import type { FieldFilterCategory } from './report-filters/field-category'

export type RuntimeFilterOperator = {
  value: string
  label: string
  /** When true, the value control is hidden (e.g. "Today", "This Month"). */
  noValue?: boolean
  /** When true, render two value controls (from/to) instead of one. */
  isRange?: boolean
}

const STRING_OPERATORS: RuntimeFilterOperator[] = [
  { value: 'is', label: 'is' },
  { value: 'is_not', label: 'is not' },
  { value: 'contains', label: 'contains' },
  { value: 'starts_with', label: 'starts with' },
  { value: 'ends_with', label: 'ends with' },
]

const NUMBER_OPERATORS: RuntimeFilterOperator[] = [
  { value: '=', label: '=' },
  { value: '!=', label: '!=' },
  { value: '>', label: '>' },
  { value: '>=', label: '>=' },
  { value: '<', label: '<' },
  { value: '<=', label: '<=' },
  { value: 'between', label: 'between', isRange: true },
]

const DATE_OPERATORS: RuntimeFilterOperator[] = [
  { value: 'today', label: 'Today', noValue: true },
  { value: 'this_month', label: 'This Month', noValue: true },
  { value: 'this_year', label: 'This Year', noValue: true },
  { value: 'between', label: 'between', isRange: true },
]

/** Runtime filter operators for the "Filter By" inline row, by field type category. */
export function getRuntimeFilterOperators(category: FieldFilterCategory): RuntimeFilterOperator[] {
  switch (category) {
    case 'number':
      return NUMBER_OPERATORS
    case 'date':
    case 'datetime':
      return DATE_OPERATORS
    default:
      return STRING_OPERATORS
  }
}
