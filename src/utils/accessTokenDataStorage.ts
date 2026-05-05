/**
 * Access token payload: read **cookie first**, then `localStorage` (legacy / migration).
 * Login writes both in `token-login-slice`; middleware already reads the cookie.
 */

export const ACCESS_TOKEN_DATA_KEY = 'AccessTokenData'

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

/** Raw JSON string from cookie or localStorage, or `null` if missing. */
export function readAccessTokenDataJsonString(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const fromCookie = getCookieValue(ACCESS_TOKEN_DATA_KEY)
    if (fromCookie && fromCookie !== 'undefined') return fromCookie
  } catch {
    /* ignore */
  }
  try {
    const fromLs = localStorage.getItem(ACCESS_TOKEN_DATA_KEY)
    if (fromLs && fromLs !== 'undefined') return fromLs
  } catch {
    /* ignore */
  }
  return null
}

/** String suitable for `JSON.parse` (never `null` — uses `"{}"` when empty). */
export function readAccessTokenDataRaw(): string {
  return readAccessTokenDataJsonString() ?? '{}'
}

export function readAccessTokenDataParsed<T = Record<string, unknown>>(): T {
  try {
    const s = readAccessTokenDataRaw()
    if (s === '' || s === 'undefined') return {} as T
    return JSON.parse(s) as T
  } catch {
    return {} as T
  }
}

/** Bearer token when stored payload has string `access_token`; otherwise `undefined`. */
export function readAccessTokenString(): string | undefined {
  try {
    const t = readAccessTokenDataParsed<{ access_token?: unknown }>().access_token
    return typeof t === 'string' ? t : undefined
  } catch {
    return undefined
  }
}

/** `role_profile` when it is a string; otherwise empty string (APIs expect `string`). */
export function readRoleProfileFromStorage(): string {
  try {
    const rp = readAccessTokenDataParsed<{ role_profile?: unknown }>().role_profile
    return typeof rp === 'string' ? rp : ''
  } catch {
    return ''
  }
}

/** Keep cookie and localStorage in sync (same shape as login). */
export function persistAccessTokenData(data: unknown): void {
  if (typeof window === 'undefined') return
  const serialized = JSON.stringify(data)
  try {
    localStorage.setItem(ACCESS_TOKEN_DATA_KEY, serialized)
  } catch (e) {
    console.error('[AccessTokenData] localStorage write failed:', e)
  }
  try {
    document.cookie = `${ACCESS_TOKEN_DATA_KEY}=${encodeURIComponent(serialized)}; path=/; SameSite=Lax`
  } catch (e) {
    console.error('[AccessTokenData] cookie write failed:', e)
  }
}

export function clearAccessTokenDataStorage(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(ACCESS_TOKEN_DATA_KEY)
  } catch {
    /* ignore */
  }
  document.cookie = `${ACCESS_TOKEN_DATA_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
}
