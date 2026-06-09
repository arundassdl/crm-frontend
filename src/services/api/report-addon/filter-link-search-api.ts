import axios from 'axios'

import { CONSTANTS } from '@/services/config/app-config'

const METHOD = '/api/method/frappe.desk.search.search_link'

export type LinkSearchOption = {
  value: string
  label: string
  description?: string
}

export type FetchLinkSearchParams = {
  doctype: string
  txt?: string
  limit?: number
}

/** Frappe link autocomplete (`search_link`) — same as reports-app filter modal. */
export async function fetchLinkSearch(
  token: string,
  params: FetchLinkSearchParams,
  signal?: AbortSignal
): Promise<LinkSearchOption[]> {
  const doctype = params.doctype.trim()
  if (!doctype) return []

  const url = `${CONSTANTS.API_BASE_URL}${METHOD}`
  const res = await axios.post(
    url,
    {
      doctype,
      txt: params.txt ?? '',
      page_length: Math.min(Math.max(params.limit ?? 20, 1), 50),
    },
    {
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
      signal,
      timeout: 30000,
      validateStatus: () => true,
    }
  )

  if (res.status >= 400) {
    throw new Error(
      (res.data as { message?: string })?.message || `Link search failed (${res.status})`
    )
  }

  const message = (res.data as { message?: unknown })?.message
  const rows = Array.isArray(message) ? message : []
  const out: LinkSearchOption[] = []
  for (const r of rows) {
    if (!r || typeof r !== 'object') continue
    const row = r as Record<string, unknown>
    const value = String(row.value ?? row.name ?? '').trim()
    if (!value) continue
    const label = String(row.label ?? row.description ?? value).trim() || value
    const opt: LinkSearchOption = { value, label }
    if (typeof row.description === 'string' && row.description.trim()) {
      opt.description = row.description.trim()
    }
    out.push(opt)
  }
  return out
}
