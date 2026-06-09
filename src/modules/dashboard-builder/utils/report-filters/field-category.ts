export type FieldFilterCategory =
  | 'data'
  | 'number'
  | 'date'
  | 'datetime'
  | 'check'
  | 'select'
  | 'link'

const NUMBER_TYPES = new Set([
  'int',
  'integer',
  'float',
  'number',
  'currency',
  'percent',
  'decimal',
])

const DATE_TYPES = new Set(['date'])
const DATETIME_TYPES = new Set(['datetime', 'datetimepicker'])
const CHECK_TYPES = new Set(['check', 'checkbox', 'boolean'])
const SELECT_TYPES = new Set([
  'select',
  'picklist',
  'pick list',
  'stage',
  'multiselect',
  'multi select',
])
const LINK_TYPES = new Set(['link', 'lookup', 'dynamiclink', 'dynamic link'])

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, '')
}

/** Maps DocField / frontend field types to filter operator & input categories (reports-app). */
export function getFieldFilterCategory(
  fieldtype: string,
  frontendFieldtype?: string
): FieldFilterCategory {
  const candidates = [frontendFieldtype, fieldtype].filter(Boolean) as string[]
  for (const raw of candidates) {
    const t = norm(raw)
    if (CHECK_TYPES.has(t)) return 'check'
    if (SELECT_TYPES.has(t)) return 'select'
    if (LINK_TYPES.has(t)) return 'link'
    if (DATE_TYPES.has(t)) return 'date'
    if (DATETIME_TYPES.has(t)) return 'datetime'
    if (NUMBER_TYPES.has(t)) return 'number'
  }
  return 'data'
}
