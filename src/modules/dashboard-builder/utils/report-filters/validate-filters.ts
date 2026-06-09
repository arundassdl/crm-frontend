import type { QuickChartCriteriaFilter } from '../../types/quickChartFilter'
import { operatorRequiresRange, operatorUsesMultiValue } from './operators'
import { isBetweenValue, isFilterValueArray } from './serialize-filter-value'

export function quickChartFilterRowIsComplete(row: QuickChartCriteriaFilter): boolean {
  if (!row.module.trim() || !row.fieldname.trim()) return false
  if (operatorRequiresRange(row.operator)) {
    const v = row.value
    if (!isBetweenValue(v)) return false
    return Boolean(v.from.trim() && v.to.trim())
  }
  if (row.operator === 'is' && row.fieldtype.toLowerCase() === 'check') {
    return typeof row.value === 'boolean'
  }
  if (operatorUsesMultiValue(row.operator)) {
    return (
      isFilterValueArray(row.value) &&
      row.value.length > 0 &&
      row.value.every(v => String(v).trim().length > 0)
    )
  }
  if (isFilterValueArray(row.value)) {
    return row.value.length > 0
  }
  const scalar = row.value
  if (scalar === null || scalar === undefined) return false
  if (typeof scalar === 'string') return scalar.trim().length > 0
  return true
}
