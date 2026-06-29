'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Box, CircularProgress } from '@mui/material'

import '../styles/dashboard-builder.css'

import {
  SETTINGS_HOME_PAGE_SUBTAB,
  SETTINGS_MODULES_URL_TAB,
} from '@/app/settings/utils/moduleSettingsRoutes'

import { useDashboardQuery, useSaveLayoutMutation } from '../hooks/useDashboard'
import { useDashboardComponents } from '../hooks/useDashboardComponents'
import { useDebouncedCallback } from '../hooks/useDebouncedLayoutSave'
import { selectSelectedWidget, useDashboardStore } from '../store/dashboardStore'
import type { DashboardWidget, GridLayoutItem, WidgetCatalogItem } from '../types'
import { inferKpiStyleFromCatalogItem } from '../utils/resolveKpiStyle'
import { isTemporaryComponentId } from '../utils/resolveWidgetQueryName'
import { DASHBOARD_SIDEBAR_WIDTH_PX } from '../styles/classes'
import {
  createWidgetId,
  emptyLayouts,
  layoutItemsEqual,
  nextAvailablePosition,
} from '../utils/layoutHelpers'
import { isTableChartType } from '../utils/isTableChartType'
import { getPlacedCatalogIds } from '../utils/placedCatalogItems'
import { uniqueWidgetTitle } from '../utils/uniqueWidgetTitle'
import { findCatalogItem } from '../utils/widgetCatalog'
import LayoutPermissionDialog from '@/components/layout-builder/LayoutPermissionDialog'
import { DashboardBuilderShell } from './DashboardBuilderShell'
import { DashboardCanvas } from './DashboardCanvas'
import { DashboardSidebar } from './DashboardSidebar'
import { WidgetRenderer } from './WidgetRenderer'
import { WidgetSettingsModal } from './WidgetSettingsModal'

type DashboardBuilderPageProps = {
  dashboardId: string
  embedInSettings?: boolean
  /** Clone source Insights Dashboard name when `isNew`. */
  cloneFrom?: string | null
  isNew?: boolean
}

function homePageListingPath(embedInSettings: boolean): string {
  if (embedInSettings) {
    return `/settings?tab=${SETTINGS_MODULES_URL_TAB}&subtab=${SETTINGS_HOME_PAGE_SUBTAB}`
  }
  return '/setup/layouts'
}

function catalogToWidget(
  item: WidgetCatalogItem,
  widgetId: string,
  existingWidgets: DashboardWidget[] = []
): DashboardWidget {
  const asTable =
    item.type === 'table' ||
    isTableChartType(item.config?.chartType) ||
    Boolean(item.config?.isReport)

  const kpiStyle = item.config?.kpiStyle ?? inferKpiStyleFromCatalogItem(item)
  const queryName =
    item.config?.savedReportName ??
    item.config?.queryName ??
    (isTemporaryComponentId(item.id) ? undefined : item.id)

  const isGrowthIndexKpi =
    kpiStyle === 'growth_index' || item.config?.chartType === 'Growth Index KPI'
  const title = isGrowthIndexKpi
    ? uniqueWidgetTitle(item.title, existingWidgets)
    : item.title

  return {
    id: widgetId,
    type: asTable ? 'table' : item.type,
    title,
    description: item.description,
    chartKind: asTable ? undefined : item.chartKind,
    catalogId: item.id,
    config: {
      ...item.config,
      queryName: queryName ?? item.id,
      savedReportName: item.config?.savedReportName ?? queryName,
      chartType: asTable ? 'table' : item.config?.chartType,
      kpiStyle,
      value: item.kpiValue,
      componentKind: item.config?.componentKind ?? (item.id.startsWith('component-') ? 'kpi' : undefined),
      ...(isGrowthIndexKpi
        ? {
            component_type: 'growth_index_kpi',
            component_name: title,
            chart_type: 'Growth Index KPI',
            compare_to:
              item.config?.compare_to ?? item.config?.compareTo ?? 'Previous Period',
            objective: item.config?.objective ?? 'increase_positive',
            ...(queryName ? { query_id: queryName } : {}),
          }
        : {}),
    },
    properties: {
      query: queryName,
      title,
      colors: item.type === 'chart' ? ['#318AD8', '#F683AE', '#48BB74', '#F56B6B', '#FACF7A', '#44427B', '#5FD8C4', '#F8814F', '#15CCEF', '#A6B1B9'] : undefined,
      columns: asTable ? undefined : undefined, // Will be populated by default if empty in Widget
    },
  }
}

export default function DashboardBuilderPage({
  dashboardId,
  embedInSettings = false,
  cloneFrom,
  isNew = false,
}: DashboardBuilderPageProps) {
  const router = useRouter()
  const isClone = isNew && Boolean(cloneFrom)
  const { data, isLoading } = useDashboardQuery(isNew ? null : dashboardId)
  const { data: cloneSource, isLoading: cloneLoading } = useDashboardQuery(
    isNew && cloneFrom ? cloneFrom : null
  )
  // Subscribe to component catalog so KPI widgets re-resolve query names after load.
  useDashboardComponents({ enabled: true })
  const saveMutation = useSaveLayoutMutation()

  const hydrate = useDashboardStore(s => s.hydrate)
  const reset = useDashboardStore(s => s.reset)
  const title = useDashboardStore(s => s.title)
  const description = useDashboardStore(s => s.description)
  const widgets = useDashboardStore(s => s.widgets)
  const layouts = useDashboardStore(s => s.layouts)
  const dashboardIdFromStore = useDashboardStore(s => s.dashboardId)
  const selectedWidgetId = useDashboardStore(s => s.selectedWidgetId)
  const fullscreenWidgetId = useDashboardStore(s => s.fullscreenWidgetId)
  const settingsWidgetId = useDashboardStore(s => s.settingsWidgetId)
  const sidebarOpen = useDashboardStore(s => s.sidebarOpen)
  const past = useDashboardStore(s => s.past)

  const setTitle = useDashboardStore(s => s.setTitle)
  const setSidebarOpen = useDashboardStore(s => s.setSidebarOpen)
  const setSelectedWidget = useDashboardStore(s => s.setSelectedWidget)
  const setFullscreenWidget = useDashboardStore(s => s.setFullscreenWidget)
  const setSettingsWidget = useDashboardStore(s => s.setSettingsWidget)
  const addWidget = useDashboardStore(s => s.addWidget)
  const removeWidget = useDashboardStore(s => s.removeWidget)
  const updateWidget = useDashboardStore(s => s.updateWidget)
  const updateLayout = useDashboardStore(s => s.updateLayout)
  const setDashboardIdStore = useDashboardStore(s => s.setDashboardId)

  const selectedWidget = useDashboardStore(selectSelectedWidget)
  const fullscreenWidget = useDashboardStore(s =>
    s.widgets.find(w => w.id === s.fullscreenWidgetId)
  )
  const settingsWidget = useDashboardStore(s =>
    s.widgets.find(w => w.id === s.settingsWidgetId)
  )

  const [permissionsOpen, setPermissionsOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<'save' | 'saveAndClose' | null>(null)
  const [sharedTo, setSharedTo] = useState<string[]>([])

  const hydratedDashboardKeyRef = useRef<string | null>(null)

  useEffect(() => {
    hydratedDashboardKeyRef.current = null
  }, [dashboardId])

  useEffect(() => {
    if (isNew && cloneFrom && cloneSource) {
      const key = `clone:${dashboardId}:${cloneFrom}`
      if (hydratedDashboardKeyRef.current === key) return
      hydratedDashboardKeyRef.current = key
      hydrate({
        ...cloneSource,
        id: dashboardId,
        title: cloneSource.title ? `${cloneSource.title}_Cloned` : 'Untitled Home Page',
      })
      setSharedTo(cloneSource.shared_to ?? [])
      return
    }
    if (isNew && !cloneFrom) {
      const key = `new:${dashboardId}`
      if (hydratedDashboardKeyRef.current === key) return
      hydratedDashboardKeyRef.current = key
      hydrate({
        id: dashboardId,
        title: 'Untitled Home Page',
        description: '',
        widgets: [],
        layouts: emptyLayouts(),
        filters: {},
      })
      setSharedTo([])
      return
    }
    if (!data) return
    const key = `load:${data.id}`
    if (hydratedDashboardKeyRef.current === key) return
    hydratedDashboardKeyRef.current = key
    hydrate(data)
    setSharedTo(data.shared_to ?? [])
  }, [cloneFrom, cloneSource, dashboardId, data, hydrate, isNew])

  useEffect(() => () => reset(), [reset])

  const persist = useCallback(async (sharedToOverride?: string[]) => {
    if (!title.trim()) return null

    // For new dashboards, pass null/empty to trigger creation.
    // If it's a temp ID (e.g. "dash_..."), treat as new.
    // Use the reactive ID from the store if it's been updated by a previous save.
    const workingId = dashboardIdFromStore || dashboardId
    const effectiveId = (isNew && workingId.startsWith('dash_')) ? null : workingId
    const sharedToPayload = sharedToOverride ?? sharedTo ?? []

    try {
      const result = await saveMutation.mutateAsync({
        dashboardId: effectiveId as string,
        title,
        description,
        layouts,
        widgets,
        shared_to: sharedToPayload,
      })

      if (result?.id) {
        setDashboardIdStore(result.id)
        // Update key ref and re-hydrate to reset history (past/future) so Save button disables.
        hydratedDashboardKeyRef.current = `load:${result.id}`
        hydrate(result)
      }
      return result
    } catch (err) {
      console.error('Failed to save dashboard', err)
      return null
    }
  }, [dashboardIdFromStore, dashboardId, title, isNew, description, layouts, widgets, sharedTo, saveMutation, setDashboardIdStore, hydrate])

  const layoutRef = useRef(layouts.lg)
  layoutRef.current = layouts.lg

  const handleLayoutChange = useCallback(
    (layout: GridLayoutItem[]) => {
      if (layoutItemsEqual(layoutRef.current, layout)) return
      updateLayout(layout)
    },
    [updateLayout]
  )

  const placedCatalogIdsKey = useMemo(
    () =>
      widgets
        .map(w => w.catalogId)
        .filter((id): id is string => Boolean(id))
        .sort()
        .join('|'),
    [widgets]
  )
  const placedCatalogIds = useMemo(
    () => getPlacedCatalogIds(widgets),
    [placedCatalogIdsKey, widgets]
  )

  const handleDropCatalog = useCallback(
    (catalogId: string, dropped?: Partial<GridLayoutItem>, itemOverride?: WidgetCatalogItem) => {
      if (placedCatalogIds.has(catalogId)) return
      const catalog = itemOverride ?? findCatalogItem(catalogId)
      if (!catalog) return
      const widgetId = createWidgetId()
      const pos =
        dropped?.x != null && dropped?.y != null
          ? { x: dropped.x, y: dropped.y }
          : nextAvailablePosition(layouts.lg, catalog.defaultSize.w, catalog.defaultSize.h)

      const layoutItem: GridLayoutItem = {
        i: widgetId,
        x: pos.x,
        y: pos.y,
        w: dropped?.w ?? catalog.defaultSize.w,
        h: dropped?.h ?? catalog.defaultSize.h,
        minW: 2,
        minH: 2,
      }

      addWidget(catalogToWidget(catalog, widgetId, widgets), layoutItem)
    },
    [addWidget, layouts.lg, placedCatalogIds, widgets]
  )

  const handleAddCatalogItem = useCallback(
    (item: WidgetCatalogItem) => {
      if (placedCatalogIds.has(item.id)) return
      handleDropCatalog(item.id, undefined, item)
    },
    [handleDropCatalog, placedCatalogIds]
  )

  const goToListing = useCallback(() => {
    router.push(homePageListingPath(embedInSettings), { scroll: false })
  }, [embedInSettings, router])

  const openPermissions = (action: 'save' | 'saveAndClose') => {
    setPendingAction(action)
    setPermissionsOpen(true)
  }

  const handleSave = async () => {
    if (!title.trim()) return
    if (sharedTo.length > 0) {
      await persist()
      return
    }
    openPermissions('save')
  }

  const handleSaveAndClose = async () => {
    if (!title.trim()) return
    if (sharedTo.length > 0) {
      const saved = await persist()
      if (saved) goToListing()
      return
    }
    openPermissions('saveAndClose')
  }

  const handlePermissionsCancel = () => {
    setPermissionsOpen(false)
    setPendingAction(null)
  }

  const handlePermissionsSave = async (sharedToIds: string[]) => {
    setSharedTo(sharedToIds)
    if (pendingAction === 'save') {
      await persist(sharedToIds)
    } else if (pendingAction === 'saveAndClose') {
      const saved = await persist(sharedToIds)
      if (saved) goToListing()
    }
    setPendingAction(null)
  }

  const hasChanges = useMemo(
    () => past.length > 0 || widgets.length > 0 || Boolean(title.trim()),
    [past.length, title, widgets.length]
  )

  const loading =
    (isNew && cloneFrom && cloneLoading && !cloneSource) ||
    (!isNew && isLoading && !data)

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          minHeight: 240,
        }}
      >
        <CircularProgress size={32} />
      </Box>
    )
  }

  return (
    <>
      <DashboardBuilderShell
        layoutName={title}
        isClone={isClone}
        isNew={isNew}
        hasChanges={hasChanges}
        saving={saveMutation.isPending}
        onLayoutNameChange={setTitle}
        onCancel={goToListing}
        onSave={handleSave}
        onSaveAndClose={handleSaveAndClose}
      >
        <Box
          sx={{
            width: DASHBOARD_SIDEBAR_WIDTH_PX,
            flexShrink: 0,
            minHeight: 0,
            display: sidebarOpen ? 'flex' : { xs: 'none', lg: 'flex' },
            flexDirection: 'column',
            borderRight: 1,
            borderColor: 'divider',
          }}
        >
          <DashboardSidebar
            open={sidebarOpen}
            selectedCatalogId={selectedWidget?.catalogId ?? null}
            placedCatalogIds={placedCatalogIds}
            onAddWidget={handleAddCatalogItem}
            onCloseMobile={() => setSidebarOpen(false)}
          />
        </Box>

        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            px: 2,
            pb: 2,
            bgcolor: 'background.default',
          }}
        >
          <DashboardCanvas
            widgets={widgets}
            layout={layouts.lg}
            selectedWidgetId={selectedWidgetId}
            onLayoutChange={handleLayoutChange}
            onDropCatalog={handleDropCatalog}
            onSelectWidget={setSelectedWidget}
            onRemoveWidget={id => {
              removeWidget(id)
            }}
            onEditWidget={id => setSettingsWidget(id)}
            onFullscreenWidget={id => setFullscreenWidget(id)}
          />
        </Box>
      </DashboardBuilderShell>

      <WidgetSettingsModal
        open={Boolean(settingsWidgetId && settingsWidget)}
        widget={settingsWidget ?? null}
        onClose={() => setSettingsWidget(null)}
        onSave={(id, patch) => {
          const target = widgets.find(w => w.id === id)
          if (
            target?.config?.component_type === 'growth_index_kpi' &&
            typeof patch.title === 'string' &&
            patch.title.trim() &&
            patch.title.trim() !== target.title
          ) {
            const title = uniqueWidgetTitle(
              patch.title,
              widgets.filter(w => w.id !== id)
            )
            updateWidget(id, {
              ...patch,
              title,
              config: { ...target.config, component_name: title },
              properties: { ...target.properties, title },
            })
            return
          }
          updateWidget(id, patch)
        }}
      />

      <LayoutPermissionDialog
        open={permissionsOpen}
        onClose={handlePermissionsCancel}
        layoutName={title || 'Untitled'}
        initialSharedTo={sharedTo}
        onSave={handlePermissionsSave}
        title="Dashboard Permission"
      />

      {fullscreenWidget ? (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: theme => theme.zIndex.modal + 1,
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'background.paper',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: 1,
              borderColor: 'divider',
              px: 2,
              py: 1.5,
            }}
          >
            <Box component="h2" sx={{ m: 0, fontSize: '1.125rem', fontWeight: 600 }}>
              {fullscreenWidget.title}
            </Box>
            <button
              type="button"
              onClick={() => setFullscreenWidget(null)}
              className="rounded-md border border-slate-200 px-3 py-1.5 text-sm"
            >
              Exit fullscreen
            </button>
          </Box>
          <Box sx={{ flex: 1, minHeight: 0, p: 2 }}>
            <WidgetRenderer widget={fullscreenWidget} />
          </Box>
        </Box>
      ) : null}
    </>
  )
}
