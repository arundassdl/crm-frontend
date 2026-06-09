import { normalizeFrappeAuthorizationValue } from '@/utils/frappe-authorization'

export type FetchInsightsQueryResultParams = {
  /** Insights Query document name (e.g. `QRY-0006`). */
  name: string
  token?: string | null
  signal?: AbortSignal
}

/**
 * Loads report/chart data via `report_addon.api.insights_query.get_insights_query_result`
 * through this app's `/api/insights-query-result` proxy.
 */
export async function fetchInsightsQueryResult(
  params: FetchInsightsQueryResultParams
): Promise<Record<string, unknown>> {
  const direct = params.token?.trim()
  const authorization = direct ? normalizeFrappeAuthorizationValue(direct) : ''

  const res = await fetch('/api/insights-query-result', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authorization ? { Authorization: authorization } : {}),
    },
    body: JSON.stringify({
      name: params.name,
      ...(authorization ? { token: authorization } : {}),
    }),
    signal: params.signal,
  })

  const contentType = res.headers.get('content-type') ?? ''
  let data: {
    message?: Record<string, unknown>
    exc_type?: string
    error?: unknown
  } = {}

  if (contentType.includes('application/json')) {
    try {
      data = (await res.json()) as typeof data
    } catch {
      data = {}
    }
  }

  if (!res.ok) {
    const msg =
      data.exc_type ??
      (typeof data.error === 'string' ? data.error : null) ??
      `Request failed: ${res.status}`
    throw new Error(String(msg))
  }

  if (data?.exc_type) {
    throw new Error(String(data.exc_type))
  }

  const doc = unwrapInsightsQueryResultDoc(data)
  return doc
}

/** Frappe wraps the doc in `message`; some proxies may return the doc at the top level. */
export function unwrapInsightsQueryResultDoc(
  data: Record<string, unknown>
): Record<string, unknown> {
  const message = data?.message
  if (message && typeof message === 'object' && !Array.isArray(message)) {
    return message as Record<string, unknown>
  }
  if (
    data.results != null ||
    data.result != null ||
    data.data != null ||
    data.rows != null
  ) {
    return data
  }
  throw new Error('Invalid response: missing insights query result document')
}
