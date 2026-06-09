import axios from 'axios'

import { CONSTANTS } from '@/services/config/app-config'

const METHOD = '/api/method/report_addon.api.report.get_related_module'

export type RelatedModuleOption = {
  value: string
  label: string
  internal_key?: string
}

function readRowString(row: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = row[k]
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return ''
}

export function extractRelatedModuleRows(apiPayload: unknown): unknown[] {
  if (!apiPayload || typeof apiPayload !== 'object') return []
  const root = apiPayload as Record<string, unknown>

  if (Array.isArray(root.data)) return root.data
  if (Array.isArray(root.message)) return root.message

  const msg = root.message
  if (msg && typeof msg === 'object' && !Array.isArray(msg)) {
    const m = msg as Record<string, unknown>
    const merged: unknown[] = []
    for (const key of [
      'default_modules',
      'related_modules',
      'modules',
      'items',
      'data',
      'records',
      'list',
    ]) {
      const v = m[key]
      if (Array.isArray(v)) merged.push(...v)
    }
    if (merged.length) return merged
  }

  if (Array.isArray(root)) return root
  return []
}

function mapRelatedModuleRowsToOptions(rows: unknown[]): RelatedModuleOption[] {
  const out: RelatedModuleOption[] = []
  const seen = new Set<string>()

  for (const r of rows) {
    if (!r || typeof r !== 'object') continue
    const row = r as Record<string, unknown>
    const value =
      readRowString(
        row,
        'value',
        'main_doctype_name',
        'main_doctype',
        'module',
        'modulename',
        'name',
        'doctype',
        'dt'
      ) || ''
    if (!value) continue
    const labelRaw = readRowString(
      row,
      'label',
      'frontend_module',
      'module_label',
      'module_name',
      'title'
    )
    const label = (labelRaw || value).trim()
    const k = value.toLowerCase()
    if (seen.has(k)) continue
    seen.add(k)
    const internalKey = readRowString(row, 'internal_key', 'internalKey', 'internalkey')
    out.push({
      value,
      label,
      ...(internalKey ? { internal_key: internalKey } : {}),
    })
  }

  return out
}

export type FetchRelatedModulesParams = {
  /** `frontend_module` label from module listing (same as reports app). */
  modulename: string
  rolename?: string
}

/** Related modules for a primary module (`get_related_module`). */
export async function fetchRelatedModules(
  token: string,
  params: FetchRelatedModulesParams
): Promise<RelatedModuleOption[]> {
  const base = `${CONSTANTS.API_BASE_URL}${METHOD}`
  const body = {
    modulename: params.modulename,
    rolename: params.rolename ?? '',
  }
  const headers = {
    Authorization: token,
    'Content-Type': 'application/json',
  }

  try {
    const res = await axios.post(base, body, { headers, timeout: 30000 })
    const rows = extractRelatedModuleRows(res?.data)
    return mapRelatedModuleRowsToOptions(rows)
  } catch (postError) {
    try {
      const qs = new URLSearchParams()
      qs.set('modulename', body.modulename)
      qs.set('rolename', body.rolename)
      const res = await axios.get(`${base}?${qs.toString()}`, {
        headers: { Authorization: token },
        timeout: 30000,
      })
      const rows = extractRelatedModuleRows(res?.data)
      return mapRelatedModuleRowsToOptions(rows)
    } catch {
      console.error('fetchRelatedModules', postError)
      return []
    }
  }
}
