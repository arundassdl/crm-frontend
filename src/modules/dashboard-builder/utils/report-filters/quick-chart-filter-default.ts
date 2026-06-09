import type { QuickChartCriteriaFilter } from '../../types/quickChartFilter'
import { defaultOperatorForCategory } from './operators'

let nextFilterId = 1

export function allocateQuickChartFilterId(): number {
  return nextFilterId++
}

export function createEmptyQuickChartFilter(module: string): QuickChartCriteriaFilter {
  return {
    id: allocateQuickChartFilterId(),
    module: module.trim(),
    fieldname: '',
    label: '',
    fieldtype: 'Data',
    operator: defaultOperatorForCategory('data'),
    value: '',
    condition: 'AND',
  }
}
