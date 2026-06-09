import { NextResponse } from 'next/server'

import { CONSTANTS } from '@/services/config/app-config'
import {
  readRoleProfileFromRequest,
  readUsernameFromRequest,
  resolveRequestAuthorization,
} from '@/utils/resolve-request-authorization'

const GET_DASHBOARD_LIST_METHOD = '/api/method/sdl_metadata.api.dashboard.get_dashboard_list'

/**
 * Proxies `sdl_metadata.api.dashboard.get_dashboard_list`.
 * GET params: `role_profile` (optional)
 */
export async function GET(req: Request) {
  try {
    const frappeAuth = resolveRequestAuthorization(req)
    const roleProfile = readRoleProfileFromRequest(req)
    const username = readUsernameFromRequest(req)

    const base = CONSTANTS.API_BASE_URL.replace(/\/$/, '')
    if (!base) {
      return NextResponse.json({ error: 'API_BASE_URL is not configured' }, { status: 400 })
    }

    const url = new URL(`${base}${GET_DASHBOARD_LIST_METHOD}`)
    if (roleProfile) {
      url.searchParams.set('role_profile', roleProfile)
    }
    if (username) {
      url.searchParams.set('username', username)
    }

    const upstreamHeaders: Record<string, string> = {
      Accept: 'application/json',
    }
    if (frappeAuth) upstreamHeaders.Authorization = frappeAuth
    if (CONSTANTS.APPCODE) upstreamHeaders['X-App-Code'] = CONSTANTS.APPCODE

    const upstreamRes = await fetch(url.toString(), {
      method: 'GET',
      headers: upstreamHeaders,
    })

    const data = await upstreamRes.json().catch(() => ({}))

    if (!upstreamRes.ok) {
      return NextResponse.json(
        typeof data === 'object' && data !== null ? data : { error: 'Frappe request failed' },
        { status: upstreamRes.status }
      )
    }

    const result = data.message ?? data
    return NextResponse.json(result)
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('dashboard-list proxy error', err?.message ?? error)
    return NextResponse.json({ error: 'Failed to load dashboards' }, { status: 500 })
  }
}
