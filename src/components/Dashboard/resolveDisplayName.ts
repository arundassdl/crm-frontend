import { readAccessTokenDataParsed } from '@/utils/accessTokenDataStorage'
import { readUserProfileDataJsonString } from '@/utils/userProfileDataStorage'

/**
 * Resolve the signed-in user's display name for the dashboard greeting.
 * Prefers the token/profile full name, falling back to the username (local part
 * of an email). Returns 'there' when nothing usable is available.
 */
export function resolveDisplayName(): string {
  const token = readAccessTokenDataParsed<{ full_name?: string; username?: string }>()
  const candidates = [token.full_name]

  try {
    const profileRaw = readUserProfileDataJsonString()
    if (profileRaw) {
      const profile = JSON.parse(profileRaw) as { full_name?: string }
      candidates.push(profile.full_name)
    }
  } catch {
    /* ignore */
  }

  candidates.push(token.username)

  for (const value of candidates) {
    if (typeof value !== 'string' || !value.trim()) continue
    const trimmed = value.trim()
    if (trimmed.includes('@')) {
      return trimmed.split('@')[0] || trimmed
    }
    return trimmed
  }

  return 'there'
}
