'use client'

import { memo, useMemo, useState } from 'react'

import type { WidgetCatalogItem } from '../types'
import { filterAvailableCatalogItems } from '../utils/placedCatalogItems'
import { DASHBOARD_SIDEBAR_WIDTH_PX } from '../styles/classes'
import { CATEGORY_LABELS } from '../utils/widgetCatalog'
import { useDashboardComponents } from '../hooks/useDashboardComponents'
import { AddComponentScreen } from './add-component'
import { DashboardComponentsList } from './DashboardComponentsList'
import { ReportComponentsPanel } from './ReportComponentsPanel'

type DashboardSidebarProps = {
  open: boolean
  selectedCatalogId?: string | null
  /** Catalog ids already on the canvas — hidden from palette lists. */
  placedCatalogIds?: Set<string>
  onAddWidget: (item: WidgetCatalogItem) => void
  onCloseMobile?: () => void
}

function DashboardAddButton({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="group/add relative shrink-0">
      <button
        type="button"
        aria-label="Add Component"
        onClick={e => {
          e.stopPropagation()
          onOpen()
        }}
        className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--mui-palette-primary-main)] text-[var(--mui-palette-primary-contrastText)] shadow-sm transition hover:opacity-90"
      >
        <i className="ri-add-line text-sm leading-none" aria-hidden />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-20 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded bg-[var(--mui-palette-grey-800)] px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-md transition-opacity group-hover/add:opacity-100"
      >
        Add Component
      </span>
    </div>
  )
}

function DashboardSidebarInner({
  open,
  selectedCatalogId,
  placedCatalogIds,
  onAddWidget,
  onCloseMobile,
}: DashboardSidebarProps) {
  const [dashboardSearch, setDashboardSearch] = useState('')
  const [addComponentScreenOpen, setAddComponentScreenOpen] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    dashboard: true,
    reports: true,
  })

  const dashboardExpanded = expanded.dashboard !== false
  const reportsExpanded = expanded.reports !== false

  const {
    items: dashboardItems,
    isLoading: dashboardLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useDashboardComponents({
    search: dashboardSearch,
    enabled: open && dashboardExpanded,
  })

  const availableDashboardItems = useMemo(
    () => filterAvailableCatalogItems(dashboardItems, placedCatalogIds),
    [dashboardItems, placedCatalogIds]
  )

  if (!open) return null

  return (
    <>
      <AddComponentScreen
        open={addComponentScreenOpen}
        onClose={() => setAddComponentScreenOpen(false)}
        onDone={item => {
          setAddComponentScreenOpen(false)
          onAddWidget(item)
        }}
      />

      <div
        className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        onClick={onCloseMobile}
        aria-hidden
      />
      <aside
        className="fixed inset-y-0 left-0 z-40 flex h-full max-w-full flex-col border-r border-[var(--mui-palette-divider)] shadow-xl lg:static lg:z-auto lg:w-full lg:shadow-none"
        style={{
          width: DASHBOARD_SIDEBAR_WIDTH_PX,
          backgroundColor: 'var(--mui-palette-background-default)',
          color: 'var(--mui-palette-text-primary)',
        }}
      >
        <div
          data-dashboard-sidebar-scroll
          className="min-h-0 flex-1 overflow-y-auto px-2 py-2"
        >
          <section className="mb-2">
            <div className="flex items-center gap-1.5 rounded-md px-1 py-1 hover:bg-[var(--mui-palette-action-hover)]">
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center gap-1 px-1 py-1 text-left"
                onClick={() => setExpanded(s => ({ ...s, dashboard: !dashboardExpanded }))}
              >
                <span className="truncate text-sm font-medium text-[var(--mui-palette-text-primary)]">
                  {CATEGORY_LABELS.dashboard}
                </span>
                <i
                  className={`ri-arrow-down-s-line shrink-0 text-base text-[var(--mui-palette-text-secondary)] transition-transform ${dashboardExpanded ? '' : '-rotate-90'}`}
                  aria-hidden
                />
              </button>
              <DashboardAddButton onOpen={() => setAddComponentScreenOpen(true)} />
            </div>
            {dashboardExpanded ? (
              <div className="flex flex-col gap-2 px-1 pb-2 pt-1">
                <div className="relative">
                  <i
                    className="ri-search-line pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-[var(--mui-palette-text-secondary)]"
                    aria-hidden
                  />
                  <input
                    value={dashboardSearch}
                    onChange={e => setDashboardSearch(e.target.value)}
                    placeholder="Search components"
                    className="w-full rounded-md border border-[var(--mui-palette-divider)] bg-[var(--mui-palette-background-paper)] py-2 pl-8 pr-3 text-sm text-[var(--mui-palette-text-primary)] outline-none placeholder:text-[var(--mui-palette-text-secondary)] focus:border-[var(--mui-palette-primary-main)]"
                  />
                </div>
                <DashboardComponentsList
                  items={availableDashboardItems}
                  selectedCatalogId={selectedCatalogId}
                  isLoading={dashboardLoading}
                  isFetchingNextPage={isFetchingNextPage}
                  hasNextPage={hasNextPage}
                  onLoadMore={() => fetchNextPage()}
                  onAddWidget={onAddWidget}
                  emptyMessage={
                    dashboardItems.length > 0 && availableDashboardItems.length === 0
                      ? 'All components are on the canvas'
                      : 'No components found'
                  }
                />
              </div>
            ) : null}
          </section>

          <section className="mb-2">
            <div className="flex items-center gap-1.5 rounded-md px-1 py-1 hover:bg-[var(--mui-palette-action-hover)]">
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center gap-1 px-1 py-1 text-left"
                onClick={() => setExpanded(s => ({ ...s, reports: !reportsExpanded }))}
              >
                <span className="truncate text-sm font-medium text-[var(--mui-palette-text-primary)]">
                  {CATEGORY_LABELS.reports}
                </span>
                <i
                  className={`ri-arrow-down-s-line shrink-0 text-base text-[var(--mui-palette-text-secondary)] transition-transform ${reportsExpanded ? '' : '-rotate-90'}`}
                  aria-hidden
                />
              </button>
            </div>
            {reportsExpanded ? (
              <ReportComponentsPanel
                selectedCatalogId={selectedCatalogId}
                placedCatalogIds={placedCatalogIds}
                enabled={open && reportsExpanded}
                onAddWidget={onAddWidget}
              />
            ) : null}
          </section>
        </div>
      </aside>
    </>
  )
}

export const DashboardSidebar = memo(DashboardSidebarInner)
