export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'

import { CONSTANTS } from '@/services/config/app-config'
import { normalizeFrappeAuthorizationValue } from '@/utils/frappe-authorization'

const INSIGHTS_QUERY_RESULT_PATH =
  '/api/method/report_addon.api.insights_query.get_insights_query_result'

/**
 * Proxies `report_addon.api.insights_query.get_insights_query_result`.
 * POST body: `{ name: string, token?: string, filters?: unknown[] }`
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const authFromHeader = req.headers.get('authorization')?.trim() ?? ''
    const { name, filters, token: tokenFromBody } = body ?? {}

    const frappeAuthRaw =
      authFromHeader ||
      (typeof tokenFromBody === 'string' ? tokenFromBody.trim() : '')
    const frappeAuth = frappeAuthRaw ? normalizeFrappeAuthorizationValue(frappeAuthRaw) : ''

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Missing name (Insights Query code, e.g. QRY-0006)' },
        { status: 400 }
      )
    }

    const base = CONSTANTS.API_BASE_URL.replace(/\/$/, '')
    if (!base) {
      return NextResponse.json({ error: 'API_BASE_URL is not configured' }, { status: 400 })
    }

    const url = `${base}${INSIGHTS_QUERY_RESULT_PATH}`
    const upstreamHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }
    if (frappeAuth) upstreamHeaders.Authorization = frappeAuth
    if (CONSTANTS.APPCODE) upstreamHeaders['X-App-Code'] = CONSTANTS.APPCODE

    const upstreamRes = await fetch(url, {
      method: 'POST',
      headers: upstreamHeaders,
      body: JSON.stringify({
        name,
        ...(Array.isArray(filters) && filters.length > 0 ? { filters } : {}),
      }),
    })

    const contentType = upstreamRes.headers.get('content-type') ?? ''
    let data: unknown
    if (contentType.includes('application/json')) {
      data = await upstreamRes.json().catch(() => ({}))
    } else {
      const text = await upstreamRes.text()
      try {
        data = JSON.parse(text) as unknown
      } catch {
        data = { error: 'Frappe request failed', body: text }
      }
    }

    if (!upstreamRes.ok) {
      return NextResponse.json(
        typeof data === 'object' && data !== null ? data : { error: 'Frappe request failed' },
        { status: upstreamRes.status }
      )
    }

    return NextResponse.json(data)
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('insights-query-result proxy error', err?.message ?? error)
    return NextResponse.json({ error: 'Failed to load insights query result' }, { status: 500 })
  }
}
