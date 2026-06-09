import axios from 'axios'

import { CONSTANTS } from '@/services/config/app-config'

import type { ReportDefinitionJson } from '@/modules/dashboard-builder/types/reportDefinition'

const METHOD = '/api/method/report_addon.api.report.save_report'

export type SaveReportParams = {
  reportname: string
  jsonobject: ReportDefinitionJson
  /** `null` = create; doc name = update */
  name?: string | null
  description?: string
  collection?: string
  create_collection?: boolean
  /** Dashboard chart components use `0`; reports use `1`. */
  is_report?: number
}

export type SaveReportResult = {
  ok: boolean
  status: number
  documentName?: string
  message?: string
  error?: string
  duplicate?: boolean
}

function errorMessageFromBody(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined
  const o = data as Record<string, unknown>
  if (typeof o.error === 'string' && o.error.trim()) return o.error.trim()
  const msg = o.message
  if (typeof msg === 'string' && msg.trim()) return msg.trim()
  if (msg && typeof msg === 'object') {
    const inner = msg as Record<string, unknown>
    if (typeof inner.message === 'string' && inner.message.trim()) {
      return inner.message.trim()
    }
  }
  if (typeof o.exc === 'string' && o.exc.trim()) {
    return o.exc.split('\n')[0]?.trim()
  }
  return undefined
}

function looksLikeFrappeDocName(s: string): boolean {
  const t = s.trim()
  if (!t || t.length > 200 || /\s/.test(t)) return false
  return /^[A-Za-z][A-Za-z0-9_-]*-\d+$/.test(t)
}

function parseSuccess(data: unknown): { documentName?: string; message?: string } {
  if (!data || typeof data !== 'object') return {}
  const o = data as Record<string, unknown>
  for (const key of ['name', 'docname', 'doc_name']) {
    const v = o[key]
    if (typeof v === 'string' && v.trim()) {
      return { documentName: v.trim() }
    }
  }
  const msg = o.message
  if (msg && typeof msg === 'object' && !Array.isArray(msg)) {
    const m = msg as Record<string, unknown>
    const nameRaw =
      (typeof m.name === 'string' ? m.name.trim() : '') ||
      (typeof m.docname === 'string' ? m.docname.trim() : '') ||
      ''
    return {
      documentName: nameRaw || undefined,
      message:
        typeof m.message === 'string'
          ? m.message.trim()
          : typeof m.msg === 'string'
            ? m.msg.trim()
            : undefined,
    }
  }
  if (typeof msg === 'string') {
    const trimmed = msg.trim()
    if (looksLikeFrappeDocName(trimmed)) {
      return { documentName: trimmed }
    }
    return { message: trimmed }
  }
  return {}
}

/**
 * Saves or updates an Insights Query via `report_addon.api.report.save_report`.
 * Same contract as reports-app `saveReportViaProxy` (direct CRM call).
 */
export async function saveReport(
  token: string,
  params: SaveReportParams
): Promise<SaveReportResult> {
  const url = `${CONSTANTS.API_BASE_URL}${METHOD}`
  const payload = {
    reportname: params.reportname,
    jsonobject: params.jsonobject,
    name: params.name ?? null,
    is_report: params.is_report ?? 1,
    ...(params.description !== undefined ? { description: params.description } : {}),
    ...(params.collection !== undefined ? { collection: params.collection } : {}),
    ...(params.create_collection === true ? { create_collection: true } : {}),
  }

  console.log('[save_report] POST', METHOD, payload)

  const res = await axios.post(url, payload, {
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
    timeout: 60000,
    validateStatus: () => true,
  })

  const status = res.status
  const data = res.data

  if (status >= 400) {
    const err =
      errorMessageFromBody(data) ||
      `Save failed (${status}). Check permissions and chart definition.`
    return {
      ok: false,
      status,
      error: err,
      duplicate: /duplicate|already exists|not unique/i.test(err),
    }
  }

  const { documentName, message } = parseSuccess(data)
  return {
    ok: true,
    status,
    documentName,
    message,
  }
}
