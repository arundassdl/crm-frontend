import type { ReportFormFieldCatalogEntry } from '@/services/api/report-addon/report-fields-api'

import type { QuickChartCriteriaFilter } from '../../types/quickChartFilter'
import { getFieldFilterCategory } from './field-category'
import {
  defaultOperatorForCategory,
  defaultOperatorForDocSelectPicklist,
} from './operators'
import {
  isDynamicMultiSelectField,
  isMultiSelectLookupField,
  type FilterModuleOption,
} from './select-field'

export function buildFieldChangeUpdate(
  filter: QuickChartCriteriaFilter,
  field: ReportFormFieldCatalogEntry,
  module?: string,
  picklistContext?: {
    moduleOrder: FilterModuleOption[]
    layoutByModule: Record<string, string>
    picklistModuleByModule: Record<string, string>
  }
): QuickChartCriteriaFilter {
  const cat = getFieldFilterCategory(field.fieldtype, field.frontendFieldtype)
  let defaultOp = defaultOperatorForCategory(cat)
  let nextValue: QuickChartCriteriaFilter['value'] = ''
  if (cat === 'check') nextValue = true
  if (defaultOp === 'between') nextValue = { from: '', to: '' }
  const moduleKey = module ?? filter.module
  if (isMultiSelectLookupField(field)) {
    defaultOp = defaultOperatorForDocSelectPicklist()
    nextValue = []
  } else if (
    picklistContext &&
    isDynamicMultiSelectField(
      field,
      moduleKey,
      picklistContext.moduleOrder,
      picklistContext.layoutByModule,
      picklistContext.picklistModuleByModule
    )
  ) {
    defaultOp = defaultOperatorForDocSelectPicklist()
    nextValue = []
  }
  return {
    ...filter,
    ...(module !== undefined ? { module } : {}),
    fieldname: field.fieldName,
    label: field.label,
    fieldtype: field.fieldtype,
    operator: defaultOp,
    value: nextValue,
    unit: undefined,
  }
}
