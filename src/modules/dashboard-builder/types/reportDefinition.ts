/** Report definition JSON for `save_report` (aligned with reports-app). */

export type ReportDefinitionTable = {
  label: string
  table: string
}

export type ReportDefinitionColumn = {
  label: string
  alias?: string
  field: string
  module_label: string
}

export type ReportDefinitionJoin = {
  from_label: string
  from_table: string
  to_label: string
  to_table: string
  join_type: 'left' | 'inner'
  internal_key: string | null
}

export type ReportDefinitionFilter = {
  module: string
  fieldname: string
  label: string
  fieldtype: string
  operator: string
  value: unknown
  /** Duration unit, only present when operator is "Last". */
  unit?: string
  condition: 'AND' | 'OR'
  filtertype: 'Quick' | 'Advanced'
}

export type ReportAggregateColumn = {
  fieldname: string
  aggregation: 'count' | 'count_unique' | 'avg' | 'sum' | 'min' | 'max'
  label: string
  module?: string
}

export type ReportDefinitionJson = {
  columns: ReportDefinitionColumn[]
  dimensions: ReportDefinitionColumn[]
  filters: ReportDefinitionFilter[]
  report_filters?: ReportDefinitionFilter[]
  joins: ReportDefinitionJoin[]
  limit: number
  measures: Record<string, unknown>[]
  orders: unknown[]
  aggregate_columns?: ReportAggregateColumn[]
  row_groups?: ReportDefinitionColumn[]
  /** Quick chart visualization type (`bar`, `line`, `area`, `pie`, `donut`). */
  chart_type?: string
  table: ReportDefinitionTable
  /** Comparison indicator settings, only present for Growth Index KPIs. */
  comparison?: {
    compare_to: 'Previous Period' | 'Previous Year' | 'Custom'
    objective: 'increase_positive' | 'decrease_positive'
    from?: string
    to?: string
  }
}
