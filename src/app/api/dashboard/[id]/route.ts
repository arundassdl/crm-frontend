import { NextResponse } from 'next/server'

import { CONSTANTS } from '@/services/config/app-config'
import { resolveRequestAuthorization } from '@/utils/resolve-request-authorization'

type RouteContext = { params: { id: string } }

const GET_DASHBOARD_METHOD = '/api/method/sdl_metadata.api.dashboard.get_dashboard_layout'

/**
 * Proxies `sdl_metadata.api.dashboard.get_dashboard_layout`.
 * GET param: `dashboard_id`
 */
export async function GET(req: Request, context: RouteContext) {
  try {
    const id = context.params.id
    const frappeAuth = resolveRequestAuthorization(req)

    const base = CONSTANTS.API_BASE_URL.replace(/\/$/, '')
    if (!base) {
      return NextResponse.json({ error: 'API_BASE_URL is not configured' }, { status: 400 })
    }

    const url = new URL(`${base}${GET_DASHBOARD_METHOD}`)
    url.searchParams.set('dashboard_id', id)

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

    /** 
     * The Frappe method may return the document under `message`.
     * We normalize it for the frontend.
     */
    const result = data.message || data
    // Normalize Frappe identifiers to `id` for frontend consistency
    if (result && typeof result === 'object') {
      if (!result.id && result.dashboardId) {
        result.id = result.dashboardId
      } else if (!result.id && result.name) {
        result.id = result.name
      }
    }

    return NextResponse.json(result)
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('dashboard-load proxy error', err?.message ?? error)
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 })
  }
}
