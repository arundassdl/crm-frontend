const TEMP_COMPONENT_ID_PATTERN = /^component-/i

/** Frappe Insights Query doc names (e.g. `QRY-0083`). */
export function isInsightsQueryDocName(value: string | undefined | null): boolean {
  if (!value) return false
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > 200 || /\s/.test(trimmed)) return false
  return /^[A-Za-z][A-Za-z0-9_-]*-\d+$/.test(trimmed)
}

export function isTemporaryComponentId(value: string | undefined | null): boolean {
  if (!value) return false
  return TEMP_COMPONENT_ID_PATTERN.test(value.trim())
}
