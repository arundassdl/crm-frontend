export type ModuleListingRef = { value: string; label: string }

/**
 * Frappe physical table from `main_doctype_name` (dropdown value).
 * e.g. `"CRM Deal"` → `"tabCRM Deal"`.
 */
export function tabNameFromMainDoctypeName(mainDoctypeName: string): string {
  const v = mainDoctypeName.trim()
  if (!v) return 'tab'
  if (v.toLowerCase().startsWith('tab')) return v
  return `tab${v}`
}

/** Resolve dropdown value (`main_doctype_name`) from value or `frontend_module` label. */
export function resolveMainDoctypeFromOption(
  labelOrValue: string,
  moduleOptions: ModuleListingRef[] = []
): string {
  const t = labelOrValue.trim()
  if (!t) return ''
  const byValue = moduleOptions.find(o => o.value === t)
  if (byValue) return byValue.value
  const byLabel = moduleOptions.find(o => o.label.trim() === t)
  if (byLabel) return byLabel.value
  return t
}
