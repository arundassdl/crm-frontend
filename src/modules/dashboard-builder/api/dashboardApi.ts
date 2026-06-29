import type {
  AddWidgetPayload,
  DashboardDocument,
  DashboardListResponse,
  DashboardWidget,
  GridLayoutItem,
  RemoveWidgetPayload,
  SaveLayoutPayload,
  WidgetType,
} from '../types'
import {
  isTemporaryComponentId,
  resolveWidgetQueryName,
  resolveWidgetQueryNameFromRaw,
} from '../utils/resolveWidgetQueryName'
import {
  buildWidgetPropertiesForSave,
  configFromPersistedProperties,
  mergeWidgetsAfterSave,
} from '../utils/widgetPersistence'

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `Request failed (${res.status})`)
  }
  return res.json() as Promise<T>
}

function buildAuthHeaders(token?: string): HeadersInit | undefined {
  if (!token) return undefined
  return { Authorization: token }
}

const CHART_KIND_TYPES = new Set(['pie', 'bar', 'line', 'scatter', 'area', 'donut', 'progress'])

function normalizeWidgetFromApi(widget: Record<string, unknown>): DashboardWidget {
  const rawType = String(widget.type ?? '').toLowerCase()
  const existingChartKind =
    typeof widget.chartKind === 'string' ? widget.chartKind.toLowerCase() : undefined

  let type = rawType as WidgetType
  let chartKind = existingChartKind

  if (!chartKind && CHART_KIND_TYPES.has(rawType)) {
    chartKind = rawType
    type = 'chart'
  } else if (rawType === 'table') {
    type = 'table'
  } else if (rawType === 'number') {
    type = 'number'
  } else if (rawType === 'funnel') {
    type = 'funnel'
  } else if (rawType === 'kpi') {
    type = 'kpi'
  } else if (rawType === 'pivot') {
    type = 'pivot'
  }

  const properties = { ...((widget.properties as Record<string, unknown>) ?? {}) }
  const configFromProperties = configFromPersistedProperties(properties)
  const existingConfig = {
    ...configFromProperties,
    ...((widget.config as Record<string, unknown>) ?? {}),
  }
  const catalogId = widget.catalogId ? String(widget.catalogId) : undefined

  const normalized: DashboardWidget = {
    id: String(widget.id ?? ''),
    type,
    chartKind: chartKind as DashboardWidget['chartKind'],
    title: String(widget.title ?? ''),
    description: widget.description ? String(widget.description) : undefined,
    catalogId,
    properties: properties as DashboardWidget['properties'],
    config: {
      ...existingConfig,
      kpiStyle: existingConfig.kpiStyle ?? properties.kpiStyle,
      chartType: existingConfig.chartType ?? properties.chartType ?? properties.chart_type,
      componentKind: existingConfig.componentKind ?? properties.componentKind,
    } as DashboardWidget['config'],
  }

  const queryName = resolveWidgetQueryNameFromRaw(widget)

  if (queryName) {
    normalized.config = {
      ...normalized.config,
      queryName,
      savedReportName:
        (normalized.config?.savedReportName as string | undefined) ?? queryName,
    }
    normalized.properties = {
      ...normalized.properties,
      query: queryName,
      queryName,
      name: queryName,
    }
    if (catalogId && isTemporaryComponentId(catalogId)) {
      normalized.catalogId = queryName
    }
  }

  return normalized
}

function normalizeLayoutItems(items: unknown[]): GridLayoutItem[] {
  return items
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    .map(item => ({
      i: String(item.i ?? ''),
      x: Number(item.x ?? 0),
      y: Number(item.y ?? 0),
      w: Number(item.w ?? 0),
      h: Number(item.h ?? 0),
      ...(item.minW != null ? { minW: Number(item.minW) } : {}),
      ...(item.minH != null ? { minH: Number(item.minH) } : {}),
      ...(item.static != null ? { static: Boolean(item.static) } : {}),
    }))
}

export function normalizeDashboardDocument(raw: Record<string, unknown>): DashboardDocument {
  const layouts = (raw.layouts as DashboardDocument['layouts']) ?? { lg: [] }
  const widgets = Array.isArray(raw.widgets)
    ? raw.widgets.map(widget => normalizeWidgetFromApi(widget as Record<string, unknown>))
    : []

  return {
    id: String(raw.id ?? raw.dashboardId ?? raw.name ?? ''),
    title: String(raw.title ?? ''),
    description: String(raw.description ?? ''),
    widgets,
    layouts: {
      lg: normalizeLayoutItems(Array.isArray(layouts.lg) ? layouts.lg : []),
      md: Array.isArray(layouts.md) ? normalizeLayoutItems(layouts.md) : undefined,
      sm: Array.isArray(layouts.sm) ? normalizeLayoutItems(layouts.sm) : undefined,
      xs: Array.isArray(layouts.xs) ? normalizeLayoutItems(layouts.xs) : undefined,
    },
    filters: raw.filters as DashboardDocument['filters'],
    updatedAt: raw.updatedAt as string | undefined,
    shared_to: Array.isArray(raw.shared_to) ? (raw.shared_to as string[]) : undefined,
  }
}

export async function fetchDashboardList(options?: {
  roleProfile?: string
  username?: string
  token?: string
}): Promise<DashboardListResponse> {
  const params = new URLSearchParams()
  if (options?.roleProfile) params.set('role_profile', options.roleProfile)
  if (options?.username) params.set('username', options.username)

  const query = params.toString()
  const res = await fetch(`/api/dashboard/list${query ? `?${query}` : ''}`, {
    credentials: 'same-origin',
    headers: buildAuthHeaders(options?.token),
  })

  const data = await parseJson<DashboardListResponse>(res)
  return {
    dashboards: Array.isArray(data.dashboards) ? data.dashboards : [],
    defaultDashboardId: data.defaultDashboardId ?? null,
  }
}

export async function fetchDashboard(id: string, token?: string): Promise<DashboardDocument> {
  const res = await fetch(`/api/dashboard/${encodeURIComponent(id)}`, {
    credentials: 'same-origin',
    headers: buildAuthHeaders(token),
  })
  const raw = await parseJson<Record<string, unknown>>(res)
  return normalizeDashboardDocument(raw)
}

function serializeWidgetsForSave(widgets?: DashboardWidget[]): DashboardWidget[] | undefined {
  if (!widgets) return widgets

  return widgets.map(widget => {
    const queryName = resolveWidgetQueryName(widget)
    const config = {
      ...widget.config,
      ...(queryName
        ? {
            queryName,
            savedReportName: widget.config?.savedReportName ?? queryName,
          }
        : {}),
    }

    return {
      ...widget,
      name: queryName ?? (widget as DashboardWidget & { name?: string }).name,
      catalogId:
        queryName && isTemporaryComponentId(widget.catalogId)
          ? queryName
          : widget.catalogId,
      config,
      properties: buildWidgetPropertiesForSave({ ...widget, config }, queryName),
    }
  })
}

export async function saveDashboardLayout(
  payload: SaveLayoutPayload,
  options?: { token?: string }
): Promise<DashboardDocument> {
  const serializedWidgets = serializeWidgetsForSave(payload.widgets)
  const savePayload = {
    ...payload,
    widgets: serializedWidgets,
  }

  const res = await fetch('/api/dashboard/save-layout', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(savePayload),
  })
  const raw = await parseJson<Record<string, unknown>>(res)

  const dashboardId = String(
    raw.dashboardId ?? raw.id ?? payload.dashboardId ?? ''
  ).trim()

  if (dashboardId) {
    const reloaded = await fetchDashboard(dashboardId, options?.token)
    const localWidgets = serializedWidgets ?? []
    if (localWidgets.length > 0) {
      return {
        ...reloaded,
        widgets: mergeWidgetsAfterSave(localWidgets, reloaded.widgets),
      }
    }
    return reloaded
  }

  return normalizeDashboardDocument({
    ...raw,
    title: payload.title,
    description: payload.description,
    layouts: payload.layouts,
    widgets: serializedWidgets,
  })
}

export async function addDashboardWidget(payload: AddWidgetPayload): Promise<DashboardDocument> {
  const res = await fetch('/api/dashboard/add-widget', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return parseJson<DashboardDocument>(res)
}

export async function removeDashboardWidget(payload: RemoveWidgetPayload): Promise<DashboardDocument> {
  const res = await fetch('/api/dashboard/remove-widget', {
    method: 'DELETE',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return parseJson<DashboardDocument>(res)
}
