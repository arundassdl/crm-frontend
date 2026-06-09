import type { FieldFilterCategory } from './field-category'

export type FilterOperatorOption = {
  value: string
  label: string
}

const DATA_OPERATORS: FilterOperatorOption[] = [
  { value: 'is', label: 'is' },
  { value: 'is not', label: 'is not' },
  { value: 'contains', label: 'contains' },
  { value: 'not contains', label: 'not contains' },
  { value: 'starts with', label: 'starts with' },
  { value: 'ends with', label: 'ends with' },
]

const NUMBER_OPERATORS: FilterOperatorOption[] = [
  { value: '=', label: '=' },
  { value: '!=', label: '!=' },
  { value: '>', label: '>' },
  { value: '<', label: '<' },
  { value: '>=', label: '>=' },
  { value: '<=', label: '<=' },
  { value: 'between', label: 'between' },
]

const DATE_OPERATORS: FilterOperatorOption[] = [
  { value: 'on', label: 'on' },
  { value: 'before', label: 'before' },
  { value: 'after', label: 'after' },
  { value: 'between', label: 'between' },
]

const CHECK_OPERATORS: FilterOperatorOption[] = [{ value: 'is', label: 'is' }]

const SELECT_OPERATORS: FilterOperatorOption[] = [
  { value: 'is', label: 'is' },
  { value: 'is not', label: 'is not' },
]

const LINK_OPERATORS: FilterOperatorOption[] = [
  { value: 'is', label: 'is' },
  { value: 'is not', label: 'is not' },
]

/** DocType Select fields with dynamic component picklist (multi-value). */
const DOC_SELECT_PICKLIST_OPERATORS: FilterOperatorOption[] = [
  { value: 'in', label: 'in' },
  { value: 'not in', label: 'not in' },
]

const BY_CATEGORY: Record<FieldFilterCategory, FilterOperatorOption[]> = {
  data: DATA_OPERATORS,
  number: NUMBER_OPERATORS,
  date: DATE_OPERATORS,
  datetime: DATE_OPERATORS,
  check: CHECK_OPERATORS,
  select: SELECT_OPERATORS,
  link: LINK_OPERATORS,
}

export function getOperatorsForCategory(
  category: FieldFilterCategory
): FilterOperatorOption[] {
  return BY_CATEGORY[category] ?? DATA_OPERATORS
}

export function getOperatorsForDocSelectPicklist(): FilterOperatorOption[] {
  return DOC_SELECT_PICKLIST_OPERATORS
}

export function defaultOperatorForDocSelectPicklist(): string {
  return DOC_SELECT_PICKLIST_OPERATORS[0]?.value ?? 'in'
}

export function operatorUsesMultiValue(operator: string): boolean {
  const op = operator.trim().toLowerCase()
  return op === 'in' || op === 'not in'
}

export function defaultOperatorForCategory(category: FieldFilterCategory): string {
  return getOperatorsForCategory(category)[0]?.value ?? 'is'
}

export function operatorRequiresRange(operator: string): boolean {
  return operator === 'between'
}
