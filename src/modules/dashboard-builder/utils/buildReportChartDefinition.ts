import type {
  ReportTableRef,
  ReportJoin,
  ReportAggregateColumn,
  ReportRowGroup,
  ReportColumn,
} from '@/services/api/report-addon/report-for-chart-api'
import type { ReportDefinitionJson } from '../types/reportDefinition'
import type { ChartKind } from '../types'

export type ReportChartSource = {
  title?: string
  aggregate_columns: ReportAggregateColumn[]
  row_groups: ReportRowGroup[]
  columns?: ReportColumn[]
}

export function buildReportChartDefinition(
  selectedReport: ReportChartSource,
  table: ReportTableRef,
  joins: ReportJoin[],
  selectedMeasure: string,
  selectedGrouping: string,
  chartKind: ChartKind,
  componentName: string
): { reportname: string; json: ReportDefinitionJson } {
  const separatorIdx = selectedMeasure.indexOf('::')
  const fieldname = separatorIdx >= 0 ? selectedMeasure.slice(0, separatorIdx) : selectedMeasure
  const aggregation = separatorIdx >= 0 ? selectedMeasure.slice(separatorIdx + 2) : 'count'

  const aggCol = selectedReport.aggregate_columns.find(
    c => c.fieldname === fieldname && c.aggregation === aggregation
  )
  const rowGroup = selectedReport.row_groups.find(g => g.field === selectedGrouping)

  const groupingCol = selectedReport.columns?.find(c => c.field === selectedGrouping)
  const measureCol = selectedReport.columns?.find(c => c.field === fieldname)

  const groupingColumn = {
    label: rowGroup?.label ?? groupingCol?.label ?? selectedGrouping,
    alias: rowGroup?.alias || groupingCol?.alias || selectedGrouping,
    field: selectedGrouping,
    module_label: rowGroup?.module_label ?? groupingCol?.module_label ?? table.label,
  }

  const aggregateColumn = {
    fieldname,
    aggregation: aggregation as 'count' | 'count_unique' | 'avg' | 'sum' | 'min' | 'max',
    label: aggCol?.label ?? (measureCol ? `${aggregation} of ${measureCol.label}` : `${aggregation} of ${fieldname}`),
    module: aggCol?.module ?? measureCol?.module_label ?? table.label,
  }

  const measures = [
    {
      aggregation: aggregation === 'count_unique' ? 'distinct_count' : aggregation,
      alias: aggregateColumn.label,
      column: fieldname === '*' ? 'name' : fieldname,
      label: aggregateColumn.label,
      table: table.table,
      type: 'Decimal',
      expression: {},
      format: {},
      granularity: '',
      order: '',
    },
  ]

  const joinDefs = joins.map(j => ({
    from_label: j.from_label,
    from_table: j.from_table,
    to_label: j.to_label,
    to_table: j.to_table,
    join_type: j.join_type,
    internal_key: j.internal_key,
  }))

  return {
    reportname: componentName.trim() || selectedReport.title || 'Report Chart',
    json: {
      columns: [groupingColumn],
      dimensions: [groupingColumn],
      row_groups: [groupingColumn],
      filters: [],
      joins: joinDefs,
      limit: 100,
      measures,
      orders: [],
      aggregate_columns: [aggregateColumn],
      chart_type: chartKind,
      table,
    },
  }
}
