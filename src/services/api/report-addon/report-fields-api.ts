import axios from 'axios'

import { CONSTANTS } from '@/services/config/app-config'

const METHOD = '/api/method/report_addon.api.report.get_report_fields'

/** Report builder field catalog entry (aligned with reports-app `FormFieldCatalogEntry`). */
export type ReportFormFieldCatalogEntry = {
  fieldName: string
  label: string
  fieldtype: string
  frontendFieldtype: string
  options?: string
  layoutName?: string
  picklistModule?: string
  linkDoctype?: string
}

export type FetchReportFieldsResult = {
  catalog: ReportFormFieldCatalogEntry[]
  layoutName?: string
  moduleName?: string
}

function readString(obj: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = obj[k]
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return ''
}

function isHiddenField(row: Record<string, unknown>): boolean {
  const v = row.hide ?? row.hidden ?? row.is_hidden ?? row.isHidden
  if (v === undefined || v === null) return false
  return v === 1 || v === true || v === '1' || v === 'true'
}

function isLayoutBreakField(fieldtype: string): boolean {
  const t = fieldtype.toLowerCase()
  return (
    t.includes('section break') ||
    t.includes('column break') ||
    t.includes('tab break') ||
    t.includes('page break') ||
    t === 'heading' ||
    t === 'html'
  )
}

export function extractFormFieldsRows(apiPayload: unknown): unknown[] {
  if (!apiPayload || typeof apiPayload !== 'object') return []
  const root = apiPayload as Record<string, unknown>
  const msg = root.message
  if (Array.isArray(msg)) return msg
  if (msg && typeof msg === 'object' && !Array.isArray(msg)) {
    const m = msg as Record<string, unknown>
    if (Array.isArray(m.fields)) return m.fields
    if (Array.isArray(m.data)) return m.data
  }
  if (Array.isArray(root.data)) return root.data
  if (Array.isArray(root.fields)) return root.fields
  return []
}

export function extractLayoutNameFromPayload(apiPayload: unknown): string | undefined {
  if (!apiPayload || typeof apiPayload !== 'object') return undefined
  const root = apiPayload as Record<string, unknown>
  const msg = root.message
  if (msg && typeof msg === 'object' && !Array.isArray(msg)) {
    const layout = readString(
      msg as Record<string, unknown>,
      'layout_id',
      'layoutId',
      'layout_name',
      'layoutName',
      'layout'
    )
    if (layout) return layout
  }
  return (
    readString(root, 'layout_id', 'layoutId', 'layout_name', 'layoutName', 'layout') ||
    undefined
  )
}

export function extractModuleNameFromPayload(apiPayload: unknown): string | undefined {
  if (!apiPayload || typeof apiPayload !== 'object') return undefined
  const root = apiPayload as Record<string, unknown>
  const msg = root.message
  if (msg && typeof msg === 'object' && !Array.isArray(msg)) {
    const moduleName = readString(msg as Record<string, unknown>, 'module', 'Module')
    if (moduleName) return moduleName
  }
  return readString(root, 'module', 'Module') || undefined
}

function readOptions(row: Record<string, unknown>): string | undefined {
  const raw = readString(row, 'options', 'Options')
  return raw || undefined
}

function readLinkDoctype(row: Record<string, unknown>): string | undefined {
  const lookup = row.lookup
  if (lookup && typeof lookup === 'object') {
    const lk = lookup as Record<string, unknown>
    const dt = readString(lk, 'link_doctype', 'linkDoctype', 'linked_doctype')
    if (dt) return dt
  }
  const rel = row.relation
  if (rel && typeof rel === 'object') {
    const r = rel as Record<string, unknown>
    const dt = readString(r, 'linked_doctype', 'link_doctype')
    if (dt) return dt
  }
  const ft = readString(row, 'fieldtype', 'field_type').toLowerCase()
  if (ft === 'link' || ft === 'lookup') {
    return readString(row, 'options', 'Options') || undefined
  }
  return undefined
}

export function parseFormFieldsToCatalog(
  rows: unknown[],
  defaultLayoutName?: string,
  defaultPicklistModule?: string
): ReportFormFieldCatalogEntry[] {
  const parsed: ReportFormFieldCatalogEntry[] = []
  for (const r of rows) {
    if (!r || typeof r !== 'object') continue
    const row = r as Record<string, unknown>
    if (isHiddenField(row)) continue
    const fieldtype = readString(row, 'fieldtype', 'field_type')
    if (isLayoutBreakField(fieldtype)) continue
    const fieldName = readString(row, 'fieldname', 'field_name', 'field', 'name')
    if (!fieldName) continue
    const label = readString(row, 'label', 'Label') || fieldName
    const ft = fieldtype.trim() || 'Data'
    const frontendFtRaw = readString(
      row,
      'frontend_fieldtype',
      'frontend_field_type',
      'frontendFieldtype'
    )
    const frontendFieldtype = (frontendFtRaw.trim() || ft).trim() || 'Data'
    const entry: ReportFormFieldCatalogEntry = {
      fieldName,
      label,
      fieldtype: ft,
      frontendFieldtype,
    }
    const layoutName =
      readString(row, 'layout_id', 'layoutId', 'layout_name', 'layoutName', 'layout') ||
      defaultLayoutName
    if (layoutName) entry.layoutName = layoutName
    const picklistModule = readString(row, 'module', 'Module') || defaultPicklistModule
    if (picklistModule) entry.picklistModule = picklistModule
    const opts = readOptions(row)
    if (opts) entry.options = opts
    const linkDt = readLinkDoctype(row)
    if (linkDt) entry.linkDoctype = linkDt
    parsed.push(entry)
  }
  const seen = new Set<string>()
  const out: ReportFormFieldCatalogEntry[] = []
  for (const p of parsed) {
    const k = p.fieldName.toLowerCase()
    if (seen.has(k)) continue
    seen.add(k)
    out.push(p)
  }
  return out
}

export function parseReportFieldsResponseBody(body: unknown): FetchReportFieldsResult {
  const rows = extractFormFieldsRows(body)
  const layoutName = extractLayoutNameFromPayload(body)
  const picklistModule = extractModuleNameFromPayload(body)
  return {
    catalog: parseFormFieldsToCatalog(rows, layoutName, picklistModule),
    layoutName,
    moduleName: picklistModule,
  }
}

export type FetchReportFieldsParams = {
  /** `frontend_module` label for `get_report_fields`. */
  module: string
  role_profile?: string
}

/** Report builder field catalog (`get_report_fields`) — same source as reports-app. */
export async function fetchReportFields(
  token: string,
  params: FetchReportFieldsParams
): Promise<FetchReportFieldsResult> {
  const base = `${CONSTANTS.API_BASE_URL}${METHOD}`
  const body = {
    module: params.module,
    role_profile: params.role_profile ?? '',
  }
  const headers = {
    Authorization: token,
    'Content-Type': 'application/json',
  }

  try {
    const res = await axios.post(base, body, { headers, timeout: 30000 })
    return parseReportFieldsResponseBody(res?.data)
  } catch {
    const qs = new URLSearchParams()
    qs.set('module', body.module)
    qs.set('role_profile', body.role_profile)
    const res = await axios.get(`${base}?${qs.toString()}`, {
      headers: { Authorization: token },
      timeout: 30000,
    })
    return parseReportFieldsResponseBody(res?.data)
  }
}
