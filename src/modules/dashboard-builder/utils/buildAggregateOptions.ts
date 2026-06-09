/**
 * Aggregate column options — aligned with reports-app `build-aggregate-options.ts`
 * (/reports/create → Aggregate Columns).
 */

import type { ReportFormFieldCatalogEntry } from '@/services/api/report-addon/report-fields-api'

export type ReportAggregateAggregation =
  | 'count'
  | 'count_unique'
  | 'avg'
  | 'sum'
  | 'min'
  | 'max'

export type AggregateOption = {
  id: string
  module: string
  moduleLabel: string
  fieldname: string
  fieldLabel: string
  aggregation: ReportAggregateAggregation
  label: string
}

const NUMERIC_FIELD_KEYS = new Set([
  'int',
  'integer',
  'float',
  'decimal',
  'currency',
  'percent',
  'number',
  'check',
  'checkbox',
  'boolean',
])

function normalizeFieldType(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '_')
}

function isNumericAggregateField(entry: ReportFormFieldCatalogEntry): boolean {
  for (const raw of [entry.fieldtype, entry.frontendFieldtype]) {
    const key = normalizeFieldType(raw || '')
    if (!key) continue
    if (NUMERIC_FIELD_KEYS.has(key)) return true
    if (key.includes('currency') || key.includes('float') || key.includes('percent')) {
      return true
    }
  }
  return false
}

export function aggregateOptionId(
  module: string,
  fieldname: string,
  aggregation: ReportAggregateAggregation
): string {
  return `${module}::${fieldname}::${aggregation}`.toLowerCase()
}

function aggregationLabelPrefix(aggregation: ReportAggregateAggregation): string {
  switch (aggregation) {
    case 'count':
      return 'Count of'
    case 'count_unique':
      return 'Count of Unique'
    case 'avg':
      return 'Avg of'
    case 'sum':
      return 'Sum of'
    case 'min':
      return 'Min of'
    case 'max':
      return 'Max of'
    default:
      return aggregation
  }
}

export function buildAggregateLabel(
  aggregation: ReportAggregateAggregation,
  fieldLabel: string
): string {
  return `${aggregationLabelPrefix(aggregation)} ${fieldLabel}`.trim()
}

function aggregationsForField(
  entry: ReportFormFieldCatalogEntry
): ReportAggregateAggregation[] {
  if (isNumericAggregateField(entry)) {
    return ['avg', 'sum', 'min', 'max']
  }
  return ['count', 'count_unique']
}

export function buildAggregateOptionsForModule(
  moduleValue: string,
  moduleLabel: string,
  catalog: ReportFormFieldCatalogEntry[]
): AggregateOption[] {
  const options: AggregateOption[] = []

  options.push({
    id: aggregateOptionId(moduleValue, '*', 'count_unique'),
    module: moduleValue,
    moduleLabel,
    fieldname: '*',
    fieldLabel: moduleLabel,
    aggregation: 'count_unique',
    label: buildAggregateLabel('count_unique', moduleLabel),
  })

  for (const entry of catalog) {
    const aggregations = aggregationsForField(entry)
    for (const aggregation of aggregations) {
      options.push({
        id: aggregateOptionId(moduleValue, entry.fieldName, aggregation),
        module: moduleValue,
        moduleLabel,
        fieldname: entry.fieldName,
        fieldLabel: entry.label,
        aggregation,
        label: buildAggregateLabel(aggregation, entry.label),
      })
    }
  }

  return options
}

export function buildAggregateOptions(
  moduleOrder: Array<{ value: string; label: string }>,
  catalogByModule: Record<string, ReportFormFieldCatalogEntry[]>
): AggregateOption[] {
  const out: AggregateOption[] = []
  for (const mod of moduleOrder) {
    out.push(
      ...buildAggregateOptionsForModule(
        mod.value,
        mod.label,
        catalogByModule[mod.value] ?? []
      )
    )
  }
  return out
}

export function aggregateOptionToColumn(
  option: AggregateOption,
  moduleOptions?: Array<{ value: string; label: string }>
): {
  fieldname: string
  aggregation: ReportAggregateAggregation
  label: string
  module?: string
} {
  let moduleKey = option.module
  if (moduleOptions?.length && moduleKey) {
    const byValue = moduleOptions.find(o => o.value === moduleKey)
    const byLabel = moduleOptions.find(o => o.label.trim() === moduleKey)
    if (!byValue && byLabel) moduleKey = byLabel.value
  }
  return {
    fieldname: option.fieldname,
    aggregation: option.aggregation,
    label: option.label,
    ...(moduleKey ? { module: moduleKey } : {}),
  }
}
