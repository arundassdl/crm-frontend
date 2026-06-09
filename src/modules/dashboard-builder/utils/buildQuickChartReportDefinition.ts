import type { RelatedModuleOption } from '@/services/api/report-addon/related-module-api'

import type { QuickChartFormState } from '../types/quickChart'
import type {
  ReportAggregateColumn,
  ReportDefinitionColumn,
  ReportDefinitionJoin,
  ReportDefinitionJson,
} from '../types/reportDefinition'
import type { AggregateOption } from './buildAggregateOptions'
import { aggregateOptionToColumn } from './buildAggregateOptions'
import type { GroupingOption } from './buildGroupingOptions'
import { quickChartFiltersToDefinition } from './report-filters/quick-chart-filter-mapper'
import {
  resolveMainDoctypeFromOption,
  tabNameFromMainDoctypeName,
} from './moduleTableName'

export type ModuleOption = { value: string; label: string }

function moduleListingLabel(labelOrValue: string, options: ModuleOption[] = []): string {
  const t = labelOrValue.trim()
  if (!t) return ''
  const byValue = options.find(o => o.value === t)
  if (byValue) return (byValue.label ?? byValue.value).trim()
  const byLabel = options.find(o => (o.label ?? '').trim() === t)
  if (byLabel) return (byLabel.label ?? byLabel.value).trim()
  return t
}

function groupColumnToDefinition(
  fieldName: string,
  label: string,
  moduleKey: string,
  primaryModule: string,
  moduleOptions: ModuleOption[]
): ReportDefinitionColumn {
  const sourceKey =
    resolveMainDoctypeFromOption(moduleKey.trim() || primaryModule, moduleOptions) ||
    primaryModule
  return {
    label: label.trim() || fieldName,
    alias: label.trim() || fieldName,
    field: fieldName,
    module_label: moduleListingLabel(sourceKey, moduleOptions),
  }
}

function aggregateColumnsToMeasures(
  aggregateColumns: ReportAggregateColumn[],
  primaryModule: string,
  moduleOptions: ModuleOption[]
): Record<string, unknown>[] {
  const measures: Record<string, unknown>[] = []
  for (const col of aggregateColumns) {
    const modKey =
      resolveMainDoctypeFromOption(
        (col.module ?? primaryModule).trim() || primaryModule,
        moduleOptions
      ) || primaryModule
    const table = tabNameFromMainDoctypeName(modKey)
    const aggregation =
      col.aggregation === 'count_unique' ? 'distinct_count' : col.aggregation
    const column = col.fieldname === '*' ? 'name' : col.fieldname
    measures.push({
      aggregation,
      alias: col.label,
      column,
      label: col.label,
      table,
      type: 'Decimal',
      expression: {},
      format: {},
      granularity: '',
      order: '',
    })
  }
  return measures
}

export type BuildQuickChartReportDefinitionInput = {
  form: QuickChartFormState
  moduleOptions: ModuleOption[]
  measureOptions: AggregateOption[]
  groupingOption: GroupingOption
  relatedModuleOption?: RelatedModuleOption | null
}

export function buildQuickChartReportDefinition(
  input: BuildQuickChartReportDefinitionInput
): { reportname: string; json: ReportDefinitionJson } {
  const {
    form,
    moduleOptions = [],
    measureOptions,
    groupingOption,
    relatedModuleOption,
  } = input

  const pm =
    resolveMainDoctypeFromOption(form.primaryModule.trim(), moduleOptions) ||
    form.primaryModule.trim()
  const primaryLabel = moduleListingLabel(pm, moduleOptions)
  const primaryTable = tabNameFromMainDoctypeName(pm)

  if (!groupingOption) {
    throw new Error('Grouping is required to save a quick chart.')
  }

  const groupingCol = groupColumnToDefinition(
    groupingOption.fieldName,
    groupingOption.fieldLabel,
    groupingOption.moduleValue,
    pm,
    moduleOptions
  )
  const builderColumns: ReportDefinitionColumn[] = [groupingCol]
  const rowGroups: ReportDefinitionColumn[] = [groupingCol]

  const aggregate_columns: ReportAggregateColumn[] = measureOptions.map(opt =>
    aggregateOptionToColumn(opt, moduleOptions)
  )

  const joins: ReportDefinitionJoin[] = []
  if (form.relatedModule.trim()) {
    const relValue =
      resolveMainDoctypeFromOption(form.relatedModule.trim(), moduleOptions) ||
      form.relatedModule.trim()
    const relLabel =
      relatedModuleOption?.label ??
      moduleListingLabel(relValue, moduleOptions) ??
      relValue
    joins.push({
      from_label: primaryLabel,
      from_table: primaryTable,
      to_label: relLabel,
      to_table: tabNameFromMainDoctypeName(relValue),
      join_type: 'left',
      internal_key: relatedModuleOption?.internal_key?.trim() || null,
    })
  }

  const reportFilters = quickChartFiltersToDefinition(form.criteriaFilters)
  const measures = aggregateColumnsToMeasures(aggregate_columns, pm, moduleOptions)

  return {
    reportname: form.componentName.trim(),
    json: {
      columns: builderColumns,
      dimensions: [...rowGroups],
      ...(rowGroups.length > 0 ? { row_groups: rowGroups } : {}),
      filters: reportFilters,
      ...(reportFilters.length > 0 ? { report_filters: reportFilters } : {}),
      joins,
      limit: 100,
      measures,
      orders: [],
      ...(aggregate_columns.length > 0 ? { aggregate_columns } : {}),
      chart_type: form.chartKind,
      table: {
        label: primaryLabel,
        table: primaryTable,
      },
    },
  }
}
