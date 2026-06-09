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

const CHART_KIND_TYPES = new Set(['pie', 'bar', 'line', 'scatter', 'area', 'donut'])

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

  const properties = (widget.properties as Record<string, unknown>) ?? {}
  const existingConfig = (widget.config as Record<string, unknown>) ?? {}

  return {
    ...(widget as DashboardWidget),
    id: String(widget.id ?? ''),
    type,
    chartKind: chartKind as DashboardWidget['chartKind'],
    title: String(widget.title ?? ''),
    catalogId: widget.catalogId ? String(widget.catalogId) : undefined,
    properties: properties as DashboardWidget['properties'],
    config: {
      ...existingConfig,
      kpiStyle: existingConfig.kpiStyle ?? properties.kpiStyle,
      chartType: existingConfig.chartType ?? properties.chartType ?? properties.chart_type,
      queryName:
        existingConfig.queryName ??
        existingConfig.savedReportName ??
        properties.query ??
        properties.queryName,
      componentKind: existingConfig.componentKind ?? properties.componentKind,
    } as DashboardWidget['config'],
  }
}

function normalizeLayoutItems(items: unknown[]): GridLayoutItem[] {
  return items
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    .map(item => ({
      ...(item as GridLayoutItem),
      i: String(item.i ?? ''),
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

  return widgets.map(widget => ({
    ...widget,
    properties: {
      ...widget.properties,
      ...(widget.config?.kpiStyle ? { kpiStyle: widget.config.kpiStyle } : {}),
      ...(widget.config?.chartType ? { chartType: widget.config.chartType } : {}),
      ...(widget.config?.componentKind ? { componentKind: widget.config.componentKind } : {}),
    },
  }))
}

export async function saveDashboardLayout(payload: SaveLayoutPayload): Promise<DashboardDocument> {
  const res = await fetch('/api/dashboard/save-layout', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...payload,
      widgets: serializeWidgetsForSave(payload.widgets),
    }),
  })
  const raw = await parseJson<Record<string, unknown>>(res)
  return normalizeDashboardDocument(raw)
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
