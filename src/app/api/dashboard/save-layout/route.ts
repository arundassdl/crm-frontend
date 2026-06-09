import { NextResponse } from 'next/server'

import { CONSTANTS } from '@/services/config/app-config'
import { normalizeFrappeAuthorizationValue } from '@/utils/frappe-authorization'
import type { SaveLayoutPayload } from '@/modules/dashboard-builder/types'

const SAVE_DASHBOARD_METHOD = '/api/method/sdl_metadata.api.dashboard.save_dashboard'

/**
 * Proxies `sdl_metadata.api.dashboard.save_dashboard`.
 */
export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as SaveLayoutPayload
    const authFromHeader = req.headers.get('authorization')?.trim() ?? ''
    const frappeAuth = authFromHeader ? normalizeFrappeAuthorizationValue(authFromHeader) : ''

    const base = CONSTANTS.API_BASE_URL.replace(/\/$/, '')
    if (!base) {
      return NextResponse.json({ error: 'API_BASE_URL is not configured' }, { status: 400 })
    }

    const url = `${base}${SAVE_DASHBOARD_METHOD}`
    const upstreamHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }
    if (frappeAuth) upstreamHeaders.Authorization = frappeAuth
    if (CONSTANTS.APPCODE) upstreamHeaders['X-App-Code'] = CONSTANTS.APPCODE

    const upstreamRes = await fetch(url, {
      method: 'POST',
      headers: upstreamHeaders,
      body: JSON.stringify(payload),
    })

    const data = await upstreamRes.json().catch(() => ({}))

    if (!upstreamRes.ok) {
      return NextResponse.json(
        typeof data === 'object' && data !== null ? data : { error: 'Frappe request failed' },
        { status: upstreamRes.status }
      )
    }

    /** 
     * The Frappe method may return the saved document under `message`.
     * We normalize it for the frontend.
     */
    const result = data.message || data
    // Normalize Frappe 'name' to 'id' for frontend consistency if needed
    if (result && typeof result === 'object' && !result.id && result.name) {
      result.id = result.name
    }
    return NextResponse.json(result)
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('dashboard-save proxy error', err?.message ?? error)
    return NextResponse.json({ error: 'Failed to save dashboard' }, { status: 500 })
  }
}
