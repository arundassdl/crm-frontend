/**
 * Keeps `userProfileData` in sync in localStorage and a `document.cookie` (for SSR / shared reads).
 * Cookie size is limited (~4KB); very large profiles may need chunking — same constraint as encoded URL data.
 */

export const USER_PROFILE_DATA_KEY = 'userProfileData'

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

/** Raw JSON string: cookie first, then localStorage. */
export function readUserProfileDataJsonString(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const fromCookie = getCookieValue(USER_PROFILE_DATA_KEY)
    if (fromCookie) return fromCookie
  } catch {
    /* ignore */
  }
  try {
    const fromLs = localStorage.getItem(USER_PROFILE_DATA_KEY)
    if (fromLs && fromLs !== 'undefined') return fromLs
  } catch {
    /* ignore */
  }
  return null
}

/** Write both storage locations (same shape as login). */
export function persistUserProfileData(profile: unknown): void {
  if (typeof window === 'undefined') return
  const serialized = JSON.stringify(profile)
  try {
    localStorage.setItem(USER_PROFILE_DATA_KEY, serialized)
  } catch (e) {
    console.error('[userProfileData] localStorage write failed:', e)
  }
  try {
    document.cookie = `${USER_PROFILE_DATA_KEY}=${encodeURIComponent(serialized)}; path=/; SameSite=Lax`
  } catch (e) {
    console.error('[userProfileData] cookie write failed:', e)
  }
  window.dispatchEvent(new Event('userProfileData-updated'))
}

export function clearUserProfileDataStorage(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(USER_PROFILE_DATA_KEY)
  } catch {
    /* ignore */
  }
  document.cookie = `${USER_PROFILE_DATA_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
}
