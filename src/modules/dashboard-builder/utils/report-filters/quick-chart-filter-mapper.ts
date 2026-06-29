import type { QuickChartCriteriaFilter } from '../../types/quickChartFilter'
import type { ReportDefinitionFilter } from '../../types/reportDefinition'
import { quickChartFilterRowIsComplete } from './validate-filters'

export function quickChartFiltersToDefinition(
  filters: QuickChartCriteriaFilter[]
): ReportDefinitionFilter[] {
  return filters.filter(quickChartFilterRowIsComplete).map(f => ({
    module: f.module.trim(),
    fieldname: f.fieldname.trim(),
    label: f.label.trim(),
    fieldtype: f.fieldtype.trim(),
    operator: f.operator.trim(),
    value: f.value,
    ...(f.unit ? { unit: f.unit } : {}),
    condition: f.condition,
    filtertype: 'Quick',
  }))
}
