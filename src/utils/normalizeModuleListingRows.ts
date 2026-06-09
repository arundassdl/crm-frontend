/** Normalize `get_modulelisting` API `message` (array, `{ data }`, or `{ records }`). */
export function normalizeModuleListingRows(message: unknown): any[] {
  if (Array.isArray(message)) return message
  if (message && typeof message === 'object') {
    const o = message as Record<string, unknown>
    if (Array.isArray(o.data)) return o.data
    if (Array.isArray(o.records)) return o.records
  }
  return []
}
