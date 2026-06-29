import type {
  ReportDefinitionColumn,
  ReportDefinitionFilter,
  ReportDefinitionJson,
} from '../types/reportDefinition'
import type { QuickChartCriteriaFilter } from '../types/quickChartFilter'
import { quickChartFiltersToDefinition } from './report-filters/quick-chart-filter-mapper'
import { tabNameFromMainDoctypeName } from './moduleTableName'
import type { FlatFieldOption } from './report-filters/flatten-catalog-fields'

export type BuildStaircaseReportDefinitionInput = {
  name: string
  moduleValue: string
  moduleLabel: string
  stageField: string
  stageFieldLabel: string
  durationField: string
  durationValue: string
  durationLastValue?: number | ''
  durationLastUnit?: 'day' | 'week' | 'month'
  durationFromDate?: string
  durationToDate?: string
  criteriaFilters: QuickChartCriteriaFilter[]
  catalogFields: FlatFieldOption[]
}

export function buildStaircaseReportDefinition(
  input: BuildStaircaseReportDefinitionInput
): { reportname: string; json: ReportDefinitionJson } {
  const primaryTable = tabNameFromMainDoctypeName(input.moduleValue)

  const stageCol: ReportDefinitionColumn = {
    label: input.stageFieldLabel || input.stageField,
    alias: input.stageFieldLabel || input.stageField,
    field: input.stageField,
    module_label: input.moduleLabel,
  }

  const filters: ReportDefinitionFilter[] = quickChartFiltersToDefinition(input.criteriaFilters)

  if (input.durationField && input.durationValue && input.durationValue !== 'Select duration') {
    const durationFieldOpt = input.catalogFields.find(f => f.key === input.durationField)
    if (durationFieldOpt) {
      if (input.durationValue === 'Last') {
        filters.push({
          module: durationFieldOpt.moduleValue,
          fieldname: durationFieldOpt.field.fieldName,
          label: durationFieldOpt.field.label,
          fieldtype: durationFieldOpt.field.fieldtype,
          operator: 'Last',
          value: input.durationLastValue || 0,
          unit: input.durationLastUnit || 'day',
          condition: 'AND',
          filtertype: 'Quick',
        })
      } else if (input.durationValue === 'Custom') {
        filters.push({
          module: durationFieldOpt.moduleValue,
          fieldname: durationFieldOpt.field.fieldName,
          label: durationFieldOpt.field.label,
          fieldtype: durationFieldOpt.field.fieldtype,
          operator: 'between',
          value: { from: input.durationFromDate || '', to: input.durationToDate || '' },
          condition: 'AND',
          filtertype: 'Quick',
        })
      } else {
        filters.push({
          module: durationFieldOpt.moduleValue,
          fieldname: durationFieldOpt.field.fieldName,
          label: durationFieldOpt.field.label,
          fieldtype: durationFieldOpt.field.fieldtype,
          operator: 'between',
          value: input.durationValue,
          condition: 'AND',
          filtertype: 'Quick',
        })
      }
    }
  }

  const aggregate_columns = [
    {
      fieldname: 'name',
      aggregation: 'count' as const,
      label: 'Count',
      module: input.moduleValue,
    },
  ]

  const measures = [
    {
      aggregation: 'count',
      alias: 'Count',
      column: 'name',
      label: 'Count',
      table: primaryTable,
      type: 'Integer',
      expression: {},
      format: {},
      granularity: '',
      order: '',
    },
  ]

  return {
    reportname: input.name.trim(),
    json: {
      columns: [],
      dimensions: [stageCol],
      row_groups: [stageCol],
      filters,
      ...(filters.length > 0 ? { report_filters: filters } : {}),
      joins: [],
      limit: 100,
      measures,
      orders: [],
      aggregate_columns,
      chart_type: 'Standard Staircase',
      table: {
        label: input.moduleLabel,
        table: primaryTable,
      },
    },
  }
}
