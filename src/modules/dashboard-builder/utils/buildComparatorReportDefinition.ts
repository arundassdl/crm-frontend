import type { ComparatorParameter } from '../types/comparatorParameter'
import type {
  ReportAggregateColumn,
  ReportDefinitionColumn,
  ReportDefinitionFilter,
  ReportDefinitionJoin,
  ReportDefinitionJson,
} from '../types/reportDefinition'
import type { ReportAggregateAggregation } from './buildAggregateOptions'
import { resolveMainDoctypeFromOption, tabNameFromMainDoctypeName, type ModuleListingRef } from './moduleTableName'
import type { ComparatorStyle } from './addComponentCatalog'

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

const COMPARISON_BASED_ON_FIELD_LABELS: Record<string, string> = {
  owner: 'Owner',
  created_by: 'Created By',
  modified_by: 'Modified By',
}

function groupColumnToDefinition(
  fieldName: string,
  label: string,
  moduleKey: string,
  moduleOptionsList: ModuleListingRef[]
): ReportDefinitionColumn {
  const resolved = resolveMainDoctypeFromOption(moduleKey, moduleOptionsList) || moduleKey
  return {
    label: label.trim() || fieldName,
    alias: label.trim() || fieldName,
    field: fieldName,
    module_label: moduleListingLabel(resolved, moduleOptionsList),
  }
}

function aggregateColumnToMeasure(
  col: ReportAggregateColumn,
  moduleOptionsList: ModuleListingRef[]
): Record<string, unknown> {
  const moduleKey = (col.module ?? '').trim()
  const resolved = resolveMainDoctypeFromOption(moduleKey, moduleOptionsList) || moduleKey
  const table = resolved ? tabNameFromMainDoctypeName(resolved) : ''
  const aggregation = col.aggregation === 'count_unique' ? 'distinct_count' : col.aggregation
  const column = col.fieldname === '*' ? 'name' : col.fieldname
  return {
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
  }
}

/** Parses a `measure` id (`${module}::${fieldname}::${aggregation}`) into a `ReportAggregateColumn`. */
function parameterToAggregateColumn(parameter: ComparatorParameter): ReportAggregateColumn {
  const parts = parameter.measure.split('::')
  const fieldname = parts[1] ?? 'name'
  const aggregation = (parts[2] ?? 'count_unique') as ReportAggregateAggregation
  return {
    fieldname,
    aggregation,
    label: parameter.parameter_name.trim() || parameter.measure_label,
    module: parameter.related_module || parameter.module,
  }
}

function parameterCriteriaFilter(parameter: ComparatorParameter): ReportDefinitionFilter | null {
  if (!parameter.criteria_field || !parameter.criteria_operator) return null
  return {
    module: parameter.related_module || parameter.module,
    fieldname: parameter.criteria_field,
    label: parameter.criteria_field_label || parameter.criteria_field,
    fieldtype: 'Data',
    operator: parameter.criteria_operator,
    value: parameter.criteria_value ?? '',
    condition: 'AND',
    filtertype: 'Quick',
  }
}

export type BuildComparatorReportDefinitionInput = {
  name: string
  comparatorStyle: ComparatorStyle
  compareAmongType: string
  compareAmongLabel?: string
  userType?: string
  selectedUserIds: string[]
  selectedUserLabels: string[]
  selectedRoleIds: string[]
  selectedRoleLabels: string[]
  periodType?: string
  periodLastValue?: number
  periodLastUnit?: string
  periodFromDate?: string
  periodToDate?: string
  picklistModuleValue?: string
  picklistModuleLabel?: string
  picklistField?: string
  picklistFieldLabel?: string
  picklistMode?: string
  selectedPicklistValues?: string[]
  picklistCategories?: Array<{ id: string; label: string; values: string[] }>
  parameters: ComparatorParameter[]
  moduleOptionsList: ModuleListingRef[]
}

/**
 * Builds the `save_report` payload for the Comparator widget, reusing the same
 * `ReportDefinitionJson` shape and `save_report` API as the KPI Builder.
 *
 * The "Compare Among" selection becomes the group-by dimension (so each resulting
 * row is one comparison entity — a user, role, picklist value, etc.), and every
 * Comparison Parameter becomes an aggregate column/measure, so the Insights query
 * returns one row per entity with one column per parameter — ready for
 * `transformComparatorResult` to pivot into the Elegant scorecard layout.
 */
export function buildComparatorReportDefinition(
  input: BuildComparatorReportDefinitionInput
): { reportname: string; json: ReportDefinitionJson & Record<string, unknown> } {
  const { parameters, moduleOptionsList } = input
  const primary = parameters[0]

  const pm = primary ? resolveMainDoctypeFromOption(primary.module, moduleOptionsList) || primary.module : ''
  const primaryLabel = primary ? moduleListingLabel(pm, moduleOptionsList) || primary.module_label : ''
  const primaryTable = pm ? tabNameFromMainDoctypeName(pm) : 'tab'

  // "Compare Among" → group-by dimension, so each query result row is one comparison entity.
  let groupColumn: ReportDefinitionColumn | null = null
  if (input.compareAmongType === 'users' && primary) {
    const based = primary.comparison_based_on || 'owner'
    const isRelated = based.startsWith('related_')
    const fieldName = based.replace(/^related_/, '')
    const fieldLabel = COMPARISON_BASED_ON_FIELD_LABELS[fieldName] ?? fieldName
    const moduleKey = isRelated ? primary.related_module || primary.module : primary.module
    groupColumn = groupColumnToDefinition(fieldName, fieldLabel, moduleKey, moduleOptionsList)
  } else if (input.compareAmongType === 'picklist_values' && input.picklistField) {
    groupColumn = groupColumnToDefinition(
      input.picklistField,
      input.picklistFieldLabel || input.picklistField,
      input.picklistModuleValue || (primary?.module ?? ''),
      moduleOptionsList
    )
  }

  const dimensions = groupColumn ? [groupColumn] : []
  const row_groups = groupColumn ? [groupColumn] : undefined

  const aggregate_columns: ReportAggregateColumn[] = parameters.map(parameterToAggregateColumn)
  const measures = aggregate_columns.map(col => aggregateColumnToMeasure(col, moduleOptionsList))

  // Join in any module referenced by a measure or the group-by dimension that isn't the primary table.
  const joins: ReportDefinitionJoin[] = []
  const joinedModules = new Set<string>()
  const referencedModules = [
    ...parameters.map(p => p.related_module || p.module),
    ...(input.compareAmongType === 'picklist_values' ? [input.picklistModuleValue || ''] : []),
  ]
  for (const moduleKey of referencedModules) {
    if (!moduleKey) continue
    const resolved = resolveMainDoctypeFromOption(moduleKey, moduleOptionsList) || moduleKey
    const table = tabNameFromMainDoctypeName(resolved)
    if (!table || table === primaryTable || joinedModules.has(table)) continue
    joinedModules.add(table)
    joins.push({
      from_label: primaryLabel,
      from_table: primaryTable,
      to_label: moduleListingLabel(resolved, moduleOptionsList),
      to_table: table,
      join_type: 'left',
      internal_key: null,
    })
  }

  const filters: ReportDefinitionFilter[] = parameters
    .map(parameterCriteriaFilter)
    .filter((f): f is ReportDefinitionFilter => f != null)

  if (input.compareAmongType === 'users' && groupColumn) {
    if (input.userType === 'custom_users' && input.selectedUserIds.length > 0) {
      filters.push({
        module: primary?.module ?? '',
        fieldname: groupColumn.field,
        label: groupColumn.label,
        fieldtype: 'Link',
        operator: 'in',
        value: input.selectedUserIds,
        condition: 'AND',
        filtertype: 'Quick',
      })
    }
  }

  return {
    reportname: input.name.trim(),
    json: {
      columns: [],
      dimensions,
      ...(row_groups ? { row_groups } : {}),
      filters,
      ...(filters.length > 0 ? { report_filters: filters } : {}),
      joins,
      limit: 100,
      measures,
      orders: [],
      ...(aggregate_columns.length > 0 ? { aggregate_columns } : {}),
      chart_type: 'comparator',
      table: { label: primaryLabel, table: primaryTable },

      comparator_style: input.comparatorStyle,
      component_name: input.name.trim(),
      compare_among: input.compareAmongType,
      compare_among_label: input.compareAmongLabel,
      user_type: input.userType || undefined,
      selected_users: input.selectedUserIds,
      selected_user_labels: input.selectedUserLabels,
      selected_roles: input.selectedRoleIds,
      selected_role_labels: input.selectedRoleLabels,
      period_type: input.periodType || undefined,
      period_last_value: input.periodLastValue ?? undefined,
      period_last_unit: input.periodLastUnit || undefined,
      period_from_date: input.periodFromDate || undefined,
      period_to_date: input.periodToDate || undefined,
      picklist_module: input.picklistModuleValue || undefined,
      picklist_module_label: input.picklistModuleLabel,
      picklist_field: input.picklistField || undefined,
      picklist_field_label: input.picklistFieldLabel,
      picklist_mode: input.picklistMode || undefined,
      selected_picklist_values: input.selectedPicklistValues?.length ? input.selectedPicklistValues : undefined,
      picklist_categories: input.picklistCategories?.length ? input.picklistCategories : undefined,
      comparison_parameters: parameters,
    },
  }
}
