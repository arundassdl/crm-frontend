import type {
  QuickChartFilterBetweenValue,
  QuickChartFilterValue,
} from '../../types/quickChartFilter'

export function isBetweenValue(
  value: QuickChartFilterValue
): value is QuickChartFilterBetweenValue {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    'from' in value &&
    'to' in value
  )
}

export function isFilterValueArray(value: QuickChartFilterValue): value is string[] {
  return Array.isArray(value)
}

/** Serialize filter value for API (between → comma-separated). */
export function serializeFilterValueForApi(value: QuickChartFilterValue): string {
  if (value === null || value === undefined) return ''
  if (isFilterValueArray(value)) {
    return JSON.stringify(value)
  }
  if (isBetweenValue(value)) {
    return `${String(value.from ?? '').trim()},${String(value.to ?? '').trim()}`
  }
  if (typeof value === 'boolean') return value ? '1' : '0'
  return String(value)
}
