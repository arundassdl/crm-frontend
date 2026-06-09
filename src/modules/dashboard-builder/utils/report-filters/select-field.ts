import type { ReportFormFieldCatalogEntry } from '@/services/api/report-addon/report-fields-api'

import type { QuickChartFilterValue } from '../../types/quickChartFilter'

export type FilterModuleOption = { value: string; label: string }

function normFieldType(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '')
}

export function moduleListingLabel(
  moduleKey: string,
  moduleOrder: FilterModuleOption[]
): string {
  const key = moduleKey.trim()
  if (!key) return ''
  const opt = moduleOrder.find(
    o => o.value === key || (o.label ?? '').trim() === key
  )
  return (opt?.label ?? key).trim()
}

export function resolveModuleMetadata(
  moduleKey: string,
  moduleOrder: FilterModuleOption[],
  map: Record<string, string>
): string {
  const key = moduleKey.trim()
  if (!key) return ''
  const direct = map[key]?.trim()
  if (direct) return direct
  const opt = moduleOrder.find(
    o => o.value === key || (o.label ?? '').trim() === key
  )
  if (!opt) return ''
  return map[opt.value]?.trim() || map[(opt.label ?? '').trim()]?.trim() || ''
}

export function resolveDynamicFieldApiContext(
  field: ReportFormFieldCatalogEntry | null,
  module: string | undefined,
  moduleOrder: FilterModuleOption[],
  layoutByModule: Record<string, string>,
  picklistModuleByModule: Record<string, string>
): { layoutName: string; moduleName: string } | null {
  if (!field) return null
  const layoutName =
    field.layoutName?.trim() ||
    (module ? resolveModuleMetadata(module, moduleOrder, layoutByModule) : '')
  const moduleName =
    field.picklistModule?.trim() ||
    (module
      ? resolveModuleMetadata(module, moduleOrder, picklistModuleByModule)
      : '') ||
    (module ? moduleListingLabel(module, moduleOrder) : '')
  if (!layoutName || !moduleName) return null
  return { layoutName, moduleName }
}

export function isDocSelectField(field: {
  fieldtype: string
  frontendFieldtype?: string
}): boolean {
  return [field.fieldtype, field.frontendFieldtype ?? ''].some(
    t => normFieldType(t) === 'select'
  )
}

export function isStageField(field: {
  fieldtype: string
  frontendFieldtype?: string
}): boolean {
  return [field.fieldtype, field.frontendFieldtype ?? ''].some(
    t => normFieldType(t) === 'stage'
  )
}

export function isLookupField(field: {
  fieldtype: string
  frontendFieldtype?: string
}): boolean {
  return [field.fieldtype, field.frontendFieldtype ?? ''].some(
    t => normFieldType(t) === 'lookup'
  )
}

export function isMultiSelectLookupField(
  field: ReportFormFieldCatalogEntry | null
): boolean {
  return Boolean(field && isLookupField(field) && field.linkDoctype?.trim())
}

export function isMultiSelectPicklistField(
  field: ReportFormFieldCatalogEntry | null,
  module: string | undefined,
  moduleOrder: FilterModuleOption[],
  layoutByModule: Record<string, string>,
  picklistModuleByModule: Record<string, string>
): boolean {
  if (!field || !isDocSelectField(field) || isStageField(field)) return false
  return Boolean(
    resolveDynamicFieldApiContext(
      field,
      module,
      moduleOrder,
      layoutByModule,
      picklistModuleByModule
    )
  )
}

export function isMultiSelectStageField(
  field: ReportFormFieldCatalogEntry | null,
  module: string | undefined,
  moduleOrder: FilterModuleOption[],
  layoutByModule: Record<string, string>,
  picklistModuleByModule: Record<string, string>
): boolean {
  if (!field || !isStageField(field)) return false
  return Boolean(
    resolveDynamicFieldApiContext(
      field,
      module,
      moduleOrder,
      layoutByModule,
      picklistModuleByModule
    )
  )
}

export function isDynamicMultiSelectField(
  field: ReportFormFieldCatalogEntry | null,
  module: string | undefined,
  moduleOrder: FilterModuleOption[],
  layoutByModule: Record<string, string>,
  picklistModuleByModule: Record<string, string>
): boolean {
  if (isMultiSelectLookupField(field)) return true
  return (
    isMultiSelectPicklistField(
      field,
      module,
      moduleOrder,
      layoutByModule,
      picklistModuleByModule
    ) ||
    isMultiSelectStageField(
      field,
      module,
      moduleOrder,
      layoutByModule,
      picklistModuleByModule
    )
  )
}

export function coercePicklistValueToArray(value: QuickChartFilterValue): string[] {
  if (Array.isArray(value)) {
    return value.map(v => String(v).trim()).filter(Boolean)
  }
  if (typeof value === 'string' && value.trim()) return [value.trim()]
  return []
}
