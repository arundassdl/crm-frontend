import { normalizeFrappeAuthorizationValue } from '@/utils/frappe-authorization'

const ACCESS_TOKEN_DATA_KEY = 'AccessTokenData'

function readTokenFromAccessTokenData(raw: string): string {
  try {
    const parsed = JSON.parse(raw) as { access_token?: unknown }
    return typeof parsed.access_token === 'string' ? parsed.access_token.trim() : ''
  } catch {
    return ''
  }
}

/**
 * Resolve Frappe Authorization for Next.js route handlers.
 * Prefers the Authorization header, then the AccessTokenData cookie.
 */
export function resolveRequestAuthorization(req: Request): string {
  const authFromHeader = req.headers.get('authorization')?.trim() ?? ''
  if (authFromHeader) {
    return normalizeFrappeAuthorizationValue(authFromHeader)
  }

  const cookieHeader = req.headers.get('cookie') ?? ''
  const prefix = `${ACCESS_TOKEN_DATA_KEY}=`
  for (const part of cookieHeader.split(';')) {
    const trimmed = part.trim()
    if (!trimmed.startsWith(prefix)) continue
    const raw = decodeURIComponent(trimmed.slice(prefix.length))
    const token = readTokenFromAccessTokenData(raw)
    if (token) return normalizeFrappeAuthorizationValue(token)
  }

  return ''
}

export function readRoleProfileFromRequest(req: Request): string {
  const { searchParams } = new URL(req.url)
  const fromQuery = searchParams.get('role_profile')?.trim()
  if (fromQuery) return fromQuery

  const cookieHeader = req.headers.get('cookie') ?? ''
  const match = cookieHeader.match(/(?:^|;\s*)role_profile=([^;]*)/)
  if (match?.[1]) {
    try {
      return decodeURIComponent(match[1]).trim()
    } catch {
      return match[1].trim()
    }
  }

  const prefix = `${ACCESS_TOKEN_DATA_KEY}=`
  for (const part of cookieHeader.split(';')) {
    const trimmed = part.trim()
    if (!trimmed.startsWith(prefix)) continue
    try {
      const parsed = JSON.parse(decodeURIComponent(trimmed.slice(prefix.length))) as {
        role_profile?: unknown
      }
      if (typeof parsed.role_profile === 'string') return parsed.role_profile.trim()
    } catch {
      /* ignore */
    }
  }

  return ''
}

export function readUsernameFromRequest(req: Request): string {
  const { searchParams } = new URL(req.url)
  const fromQuery = searchParams.get('username')?.trim()
  if (fromQuery) return fromQuery

  const prefix = `${ACCESS_TOKEN_DATA_KEY}=`
  for (const part of (req.headers.get('cookie') ?? '').split(';')) {
    const trimmed = part.trim()
    if (!trimmed.startsWith(prefix)) continue
    try {
      const parsed = JSON.parse(decodeURIComponent(trimmed.slice(prefix.length))) as {
        username?: unknown
      }
      if (typeof parsed.username === 'string') return parsed.username.trim()
    } catch {
      /* ignore */
    }
  }

  return ''
}
