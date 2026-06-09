import type { ReportFormFieldCatalogEntry } from '@/services/api/report-addon/report-fields-api'

export type FlatFieldOption = {
  moduleValue: string
  moduleLabel: string
  field: ReportFormFieldCatalogEntry
  /** Unique key for Select value: `module::fieldName` */
  key: string
  displayLabel: string
}

export function flattenCatalogFields(
  moduleOrder: { value: string; label: string }[],
  catalogByModule: Record<string, ReportFormFieldCatalogEntry[]>
): FlatFieldOption[] {
  const out: FlatFieldOption[] = []
  for (const mod of moduleOrder) {
    const entries = catalogByModule[mod.value] ?? []
    for (const field of entries) {
      const key = `${mod.value}::${field.fieldName}`.toLowerCase()
      out.push({
        moduleValue: mod.value,
        moduleLabel: mod.label,
        field,
        key,
        displayLabel: `${field.label} - ${mod.label}`,
      })
    }
  }
  return out
}

export function fieldKeyForFilter(module: string, fieldname: string): string {
  return `${module}::${fieldname}`.toLowerCase()
}
