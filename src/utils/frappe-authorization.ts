/**
 * Frappe REST expects: `Authorization: token <api_key>:<api_secret>`
 */
export function normalizeFrappeAuthorizationValue(raw: string): string {
  let s = raw.trim().replace(/\s+/g, ' ')
  if (!s) return ''
  if (/^token\s+/i.test(s)) {
    const rest = s.replace(/^token\s+/i, '').trim()
    return rest ? `token ${rest}` : ''
  }
  if (/^[A-Za-z0-9_-]+:[A-Za-z0-9_-]+$/.test(s)) {
    return `token ${s}`
  }
  return s
}
