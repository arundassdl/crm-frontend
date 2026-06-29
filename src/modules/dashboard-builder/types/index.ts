import type { ComponentFilterFieldConfig } from './componentFilters'
import type { ComparatorParameter } from './comparatorParameter'
import type { ReportDefinitionFilter } from './reportDefinition'

export type WidgetType = 'kpi' | 'chart' | 'table' | 'pivot' | 'funnel' | 'number' | 'comparator'

export type ChartKind =
  | 'column'
  | 'bar'
  | 'line'
  | 'pie'
  | 'donut'
  | 'treemap'
  | 'butterfly'
  | 'live'
  | 'funnel'
  | 'area'
  | 'scatter'
  | 'progress'

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
  [key: string]: GridLayoutItem[] | undefined
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
  shared_to?: string[]
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
  /** Growth Index KPI comparison settings (snake_case mirrors backend payload). */
  compare_to?: string
  compareTo?: string
  objective?: string
  component_type?: string
  component_name?: string
  query_id?: string
  /** Ranking KPI settings (snake_case mirrors backend payload). */
  rank_field?: string
  show?: string
  display_record_count?: boolean
  shortened?: boolean
  format?: string
  decimal_places?: number
  measures_to_format?: string[]
  /** Comparator widget settings. */
  comparator_style?: string
  /** 'users' | 'time_period' | 'picklist_values' */
  compare_among?: string
  compare_among_label?: string
  /** 'custom_users' | 'roles' (only when compare_among === 'users') */
  user_type?: string
  selected_users?: string[]
  selected_user_labels?: string[]
  selected_roles?: string[]
  selected_role_labels?: string[]
  /** Ownership field to group by: 'owner' | 'created_by' | 'modified_by' (only when compare_among === 'users') */
  comparison_based_on?: string
  comparison_based_on_label?: string
  /** Time-period selection (only when compare_among === 'time_period') */
  period_type?: string
  period_last_value?: number
  period_last_unit?: string
  period_from_date?: string
  period_to_date?: string
  /** Picklist module/field/mode (only when compare_among === 'picklist_values') */
  picklist_module?: string
  picklist_module_label?: string
  picklist_field?: string
  picklist_field_label?: string
  picklist_mode?: string
  selected_picklist_values?: string[]
  picklist_categories?: Array<{ id: string; label: string; values: string[] }>
  comparison_parameters?: ComparatorParameter[]
  /** Standard Staircase (Stage) widget settings. */
  module?: string
  module_label?: string
  stage_field?: string
  stage_field_label?: string
  duration_field?: string
  criteria_field?: string
  criteria_operator?: string
  criteria_value?: string
  criteria_filters?: ReportDefinitionFilter[]
  won_stage?: string
  lost_stage?: string
  /** Report chart additional config. */
  sort_by?: string
  max_grouping?: number
  benchmark_enabled?: boolean
  benchmark_value?: number
  short_number_enabled?: boolean
  short_number_format?: string
  display_total_summary?: boolean
  display_component_filters?: boolean
  component_filters?: ComponentFilterFieldConfig[]
  /** Stored table + joins for reloading filter fields when editing a report chart. */
  report_table?: { label: string; table: string }
  report_joins?: Array<{
    from_label: string
    from_table: string
    to_label: string
    to_table: string
    join_type: string
    internal_key: string | null
  }>
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
  shared_to?: string[]
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
