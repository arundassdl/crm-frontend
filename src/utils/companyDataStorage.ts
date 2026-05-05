/**
 * Company branding for the shell (logo / name). Prefer cookie (SSR-friendly, shared with document.cookie
 * writers); fall back to localStorage for legacy data.
 */

export const COMPANY_DATA_KEY = 'companyData'

function getCookieValue(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  const prefix = `${name}=`
  const parts = document.cookie.split('; ')
  for (const part of parts) {
    if (part.startsWith(prefix)) {
      return decodeURIComponent(part.slice(prefix.length))
    }
  }
  return undefined
}

function parseCompanyDataJson(raw: string | null | undefined): unknown[] | Record<string, unknown> {
  if (raw == null || raw === '' || raw === 'undefined') return []
  try {
    return JSON.parse(raw) as unknown[] | Record<string, unknown>
  } catch {
    return []
  }
}

/** Raw JSON string: cookie first, then localStorage. */
export function readCompanyDataJsonString(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const fromCookie = getCookieValue(COMPANY_DATA_KEY)
    if (fromCookie && fromCookie !== 'undefined') return fromCookie
  } catch {
    /* ignore */
  }
  try {
    const fromLs = localStorage.getItem(COMPANY_DATA_KEY)
    if (fromLs && fromLs !== 'undefined') return fromLs
  } catch {
    /* ignore */
  }
  return null
}

/** Parsed company payload for Logo / navbar (object or legacy empty array). */
export function getCompanyDataParsed(): any {
  if (typeof window === 'undefined') return []
  return parseCompanyDataJson(readCompanyDataJsonString())
}

/** Keep cookie and localStorage in sync when something saves company data. */
export function persistCompanyData(company: unknown): void {
  if (typeof window === 'undefined') return
  const serialized =
    typeof company === 'string' ? company : JSON.stringify(company)
  try {
    localStorage.setItem(COMPANY_DATA_KEY, serialized)
  } catch (e) {
    console.error('[companyData] localStorage write failed:', e)
  }
  try {
    document.cookie = `${COMPANY_DATA_KEY}=${encodeURIComponent(serialized)}; path=/; SameSite=Lax`
  } catch (e) {
    console.error('[companyData] cookie write failed:', e)
  }
}

export function clearCompanyDataStorage(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(COMPANY_DATA_KEY)
  } catch {
    /* ignore */
  }
  document.cookie = `${COMPANY_DATA_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
}
