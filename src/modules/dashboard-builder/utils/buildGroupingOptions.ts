/**
 * Grouping (row group) field options — same catalog as reports-app Columns / Row Groups picker.
 * Display: `Field Name - Module Name`.
 */

import type { ReportFormFieldCatalogEntry } from '@/services/api/report-addon/report-fields-api'

export type GroupingOption = {
  /** `moduleValue::fieldName` (lowercase), same as reports-app `colKey`. */
  id: string
  fieldName: string
  fieldLabel: string
  moduleValue: string
  moduleLabel: string
  /** e.g. `Contact Name - Deals` */
  label: string
}

export function groupingFieldKey(moduleValue: string, fieldName: string): string {
  return `${moduleValue}::${fieldName}`.toLowerCase()
}

export function buildGroupingLabel(fieldLabel: string, moduleLabel: string): string {
  return `${fieldLabel.trim()} - ${moduleLabel.trim()}`
}

export function buildGroupingOptions(
  moduleOrder: Array<{ value: string; label: string }>,
  catalogByModule: Record<string, ReportFormFieldCatalogEntry[]>
): GroupingOption[] {
  const out: GroupingOption[] = []

  for (const mod of moduleOrder) {
    const entries = [...(catalogByModule[mod.value] ?? [])].sort((a, b) =>
      a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })
    )
    for (const entry of entries) {
      out.push({
        id: groupingFieldKey(mod.value, entry.fieldName),
        fieldName: entry.fieldName,
        fieldLabel: entry.label,
        moduleValue: mod.value,
        moduleLabel: mod.label,
        label: buildGroupingLabel(entry.label, mod.label),
      })
    }
  }

  return out
}

export function groupingOptionToColumn(option: GroupingOption): {
  fieldName: string
  label: string
  module: string
  moduleLabel: string
} {
  return {
    fieldName: option.fieldName,
    label: option.fieldLabel,
    module: option.moduleValue,
    moduleLabel: option.moduleLabel,
  }
}
