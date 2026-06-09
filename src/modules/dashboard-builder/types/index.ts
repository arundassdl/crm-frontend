export type WidgetType = 'kpi' | 'chart' | 'table' | 'pivot' | 'funnel' | 'number'

export type ChartKind = 'bar' | 'line' | 'pie' | 'donut' | 'funnel' | 'area' | 'scatter'

export type WidgetCategory = 'dashboard' | 'reports'

export interface GridLayoutItem {
  i: string
  x: number
  y: number
  w: number
  h: number
  minW?: number
  minH?: number
  static?: boolean
}

export interface ResponsiveLayouts {
  lg: GridLayoutItem[]
  md?: GridLayoutItem[]
  sm?: GridLayoutItem[]
  xs?: GridLayoutItem[]
  xxs?: GridLayoutItem[]
}

export interface ChartProperties {
  colors?: string[]
  query?: string
  title?: string
  xAxis?: string
  yAxis?: string
}

export interface TableProperties {
  columns?: string[]
  query?: string
  title?: string
}

export type WidgetProperties = ChartProperties & TableProperties & Record<string, unknown>

export interface DashboardWidget {
  id: string
  type: WidgetType
  title: string
  description?: string
  chartKind?: ChartKind
  catalogId?: string
  config?: Record<string, unknown>
  properties?: WidgetProperties
}

export interface DashboardFilters {
  dateRange?: string
  module?: string
  owner?: string
}

export interface DashboardDocument {
  id: string
  title: string
  description: string
  widgets: DashboardWidget[]
  layouts: ResponsiveLayouts
  filters?: DashboardFilters
  updatedAt?: string
}

export interface DashboardListItem {
  id: string
  title: string
  isDefault?: boolean
}

export interface DashboardListResponse {
  dashboards: DashboardListItem[]
  defaultDashboardId: string | null
}

export type WidgetCatalogConfig = {
  queryName?: string
  reportName?: string
  isReport?: boolean
  /** Insights Query chart_type for report vs dashboard widgets (e.g. `table`). */
  chartType?: string
  chartSource?: string
  componentKind?: string
  savedReportName?: string
  quickChart?: any
  aggregateColumns?: any[]
  groupingColumn?: any
  measureIds?: string[]
  groupingId?: string
  kpiStyle?: string
}

export interface WidgetCatalogItem {
  id: string
  title: string
  description: string
  type: WidgetType
  category: WidgetCategory
  chartKind?: ChartKind
  defaultSize: { w: number; h: number }
  icon: string
  kpiValue?: string
  kpiLabel?: string
  config?: WidgetCatalogConfig
}

export interface SaveLayoutPayload {
  dashboardId: string
  layouts: ResponsiveLayouts
  widgets?: DashboardWidget[]
  title?: string
  description?: string
}

export interface AddWidgetPayload {
  dashboardId: string
  catalogId: string
  layoutItem: GridLayoutItem
  widget: DashboardWidget
}

export interface RemoveWidgetPayload {
  dashboardId: string
  widgetId: string
}
