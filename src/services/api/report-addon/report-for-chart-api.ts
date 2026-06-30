import axios from 'axios'

import { CONSTANTS } from '@/services/config/app-config'

const METHOD = '/api/method/report_addon.api.report.get_reportforchart'

export type ReportRowGroup = {
  label: string
  alias: string
  field: string
  module_label: string
}

export type ReportAggregateColumn = {
  fieldname: string
  aggregation: string
  label: string
  module: string
}

export type ReportTableRef = {
  label: string
  table: string
}

export type ReportJoin = {
  from_label: string
  from_table: string
  to_label: string
  to_table: string
  join_type: 'left' | 'inner'
  internal_key: string | null
}

export type ReportColumn = {
  label: string
  alias: string
  field: string
  module_label: string
  fieldtype: string
}

export type ReportForChartItem = {
  /** Insights Query document name (e.g. `QRY-0043`). */
  name: string
  /** Human-readable title displayed in the dropdown. */
  title: string
  /** Collection / group name. Empty → mapped to "General Reports". */
  collection: string
  /** Primary table with label and physical table name. */
  table: ReportTableRef
  /** Join definitions with full from/to metadata. */
  joins: ReportJoin[]
  /** Row grouping fields from `front_json.row_groups`. */
  row_groups: ReportRowGroup[]
  /** Aggregate measure columns from `front_json.aggregate_columns`. */
  aggregate_columns: ReportAggregateColumn[]
  /** All report columns from `front_json.columns`. */
  columns: ReportColumn[]
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

function parseTableRef(raw: unknown): ReportTableRef {
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>
    const label = str(o.label)
    const table = str(o.table)
    if (label || table) {
      return { label: label || table, table: table || `tab${label}` }
    }
  }
  // Backward-compat: old API returned table as a plain string
  if (typeof raw === 'string' && raw.trim()) {
    const t = raw.trim()
    return { label: t, table: t.toLowerCase().startsWith('tab') ? t : `tab${t}` }
  }
  return { label: '', table: '' }
}

function parseJoin(raw: unknown): ReportJoin | null {
  if (!raw) return null
  // New format: full join object
  if (typeof raw === 'object') {
    const o = raw as Record<string, unknown>
    if (o.to_label || o.to_table) {
      return {
        from_label: str(o.from_label),
        from_table: str(o.from_table),
        to_label: str(o.to_label),
        to_table: str(o.to_table),
        join_type: (str(o.join_type) as 'left' | 'inner') || 'left',
        internal_key: str(o.internal_key) || null,
      }
    }
    // Old object format with label/name field
    const label = str(o.label) || str(o.name)
    if (label) {
      return {
        from_label: '', from_table: '',
        to_label: label,
        to_table: label.toLowerCase().startsWith('tab') ? label : `tab${label}`,
        join_type: 'left',
        internal_key: null,
      }
    }
    return null
  }
  // Backward-compat: old API returned joins as string[]
  if (typeof raw === 'string' && raw.trim()) {
    const label = raw.trim()
    return {
      from_label: '', from_table: '',
      to_label: label,
      to_table: label.toLowerCase().startsWith('tab') ? label : `tab${label}`,
      join_type: 'left',
      internal_key: null,
    }
  }
  return null
}

function parseJoins(raw: unknown): ReportJoin[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map(parseJoin)
    .filter((j): j is ReportJoin => j !== null && Boolean(j.to_label || j.to_table))
}

function parseRowGroup(raw: unknown): ReportRowGroup | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const field = str(o.field)
  if (!field) return null
  return {
    label: str(o.label) || field,
    alias: str(o.alias),
    field,
    module_label: str(o.module_label),
  }
}

function parseColumn(raw: unknown): ReportColumn | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const field = str(o.field) || str(o.column)
  if (!field) return null
  return {
    label: str(o.label) || field,
    alias: str(o.alias),
    field,
    module_label: str(o.module_label),
    fieldtype: str(o.fieldtype) || str(o.type),
  }
}

function parseEditColumn(
  raw: unknown,
  tableLabels: Map<string, string>
): ReportColumn | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const field = str(o.field) || str(o.column)
  if (!field) return null
  const moduleLabel = str(o.module_label) || tableLabels.get(str(o.table)) || ''
  return {
    label: str(o.label) || field,
    alias: str(o.alias),
    field,
    module_label: moduleLabel,
    fieldtype: str(o.fieldtype) || str(o.type),
  }
}

function parseAggregateColumn(raw: unknown): ReportAggregateColumn | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const fieldname = str(o.fieldname)
  const aggregation = str(o.aggregation)
  if (!fieldname || !aggregation) return null
  return {
    fieldname,
    aggregation,
    label: str(o.label) || `${aggregation} of ${fieldname}`,
    module: str(o.module),
  }
}

function parseResponse(data: unknown): ReportForChartItem[] {
  if (!data || typeof data !== 'object') return []
  const root = data as Record<string, unknown>
  const msg = root.message ?? root.data ?? root
  const rows = Array.isArray(msg) ? msg : []
  return rows
    .filter((r): r is Record<string, unknown> => r != null && typeof r === 'object')
    .map(r => ({
      name: str(r.name),
      title: str(r.title) || str(r.name),
      collection: str(r.collection),
      table: parseTableRef(r.table),
      joins: parseJoins(r.joins),
      row_groups: (Array.isArray(r.row_groups) ? r.row_groups : [])
        .map(parseRowGroup)
        .filter((g): g is ReportRowGroup => g !== null),
      aggregate_columns: (Array.isArray(r.aggregate_columns) ? r.aggregate_columns : [])
        .map(parseAggregateColumn)
        .filter((c): c is ReportAggregateColumn => c !== null),
      columns: (Array.isArray(r.columns) ? r.columns : [])
        .map(parseColumn)
        .filter((c): c is ReportColumn => c !== null),
    }))
    .filter(r => r.name)
}

export async function fetchReportsForChart(token: string): Promise<ReportForChartItem[]> {
  const url = `${CONSTANTS.API_BASE_URL}${METHOD}`
  const res = await axios.get(url, {
    headers: { Authorization: token },
    timeout: 30_000,
  })
  return parseResponse(res?.data)
}

// ---------------------------------------------------------------------------
// get_report_for_edit — full report configuration for a single report
// ---------------------------------------------------------------------------

const EDIT_METHOD = '/api/method/report_addon.api.report.get_report_for_edit'

export type ReportEditDetail = {
  name: string
  title: string
  table: ReportTableRef
  joins: ReportJoin[]
  row_groups: ReportRowGroup[]
  aggregate_columns: ReportAggregateColumn[]
  columns: ReportColumn[]
}

function parseFrontJson(raw: unknown): Record<string, unknown> {
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) as Record<string, unknown> } catch { return {} }
  }
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>
  }
  return {}
}

function findColumnsWithType(msg: Record<string, unknown>): unknown[] {
  // The columns with type metadata (type: "Float", "String", etc.) can live in
  // several places depending on the Frappe Insights response shape. Search all
  // known locations and pick the first source where entries carry a `type` key.
  const sources: { label: string; value: unknown }[] = [
    { label: 'msg.json→columns', value: parseFrontJson(msg.json).columns },
    { label: 'msg.front_json→columns', value: parseFrontJson(msg.front_json).columns },
    { label: 'msg.columns', value: msg.columns },
  ]

  // Also check msg.doc.json / msg.doc.front_json (nested doc wrapper)
  if (msg.doc && typeof msg.doc === 'object') {
    const doc = msg.doc as Record<string, unknown>
    sources.push(
      { label: 'msg.doc.json→columns', value: parseFrontJson(doc.json).columns },
      { label: 'msg.doc.front_json→columns', value: parseFrontJson(doc.front_json).columns },
    )
  }

  let firstNonEmpty: unknown[] | null = null
  let firstNonEmptyLabel = ''

  for (const src of sources) {
    if (!Array.isArray(src.value) || src.value.length === 0) continue

    if (!firstNonEmpty) {
      firstNonEmpty = src.value as unknown[]
      firstNonEmptyLabel = src.label
    }

    // Check if at least one entry has a `type` or `fieldtype` key
    const sample = src.value[0] as Record<string, unknown> | null
    if (sample && (sample.type != null || sample.fieldtype != null)) {
      console.log('[findColumnsWithType] using:', src.label, '| sample:', sample)
      return src.value as unknown[]
    }
  }

  if (firstNonEmpty) {
    console.log('[findColumnsWithType] no source has type metadata, falling back to:', firstNonEmptyLabel)
  } else {
    console.log('[findColumnsWithType] no columns found in any source')
  }
  return firstNonEmpty ?? []
}

function parseEditResponse(data: unknown): ReportEditDetail | null {
  if (!data || typeof data !== 'object') return null
  const root = data as Record<string, unknown>
  const msg = (root.message ?? root.data ?? root) as Record<string, unknown>
  if (!msg || typeof msg !== 'object') return null

  const name = str(msg.name)
  if (!name) return null

  console.log('[parseEditResponse] msg keys:', Object.keys(msg))

  const frontJson = parseFrontJson(msg.front_json)
  const queryJson = parseFrontJson(msg.json)

  const table = parseTableRef(frontJson.table ?? queryJson.table)
  const joins = parseJoins(frontJson.joins ?? queryJson.joins)

  const tableLabels = new Map<string, string>()
  if (table.table && table.label) tableLabels.set(table.table, table.label)
  for (const j of joins) {
    if (j.to_table && j.to_label) tableLabels.set(j.to_table, j.to_label)
    if (j.from_table && j.from_label) tableLabels.set(j.from_table, j.from_label)
  }

  const rawColumns = findColumnsWithType(msg)

  const parsed = rawColumns
    .map((c: unknown) => parseEditColumn(c, tableLabels))
    .filter((c): c is ReportColumn => c !== null)

  console.log('[parseEditResponse] parsed columns:', parsed.map(c => ({ label: c.label, field: c.field, fieldtype: c.fieldtype, module_label: c.module_label })))

  return {
    name,
    title: str(msg.title) || name,
    table,
    joins,
    row_groups: (Array.isArray(frontJson.row_groups ?? queryJson.row_groups) ? (frontJson.row_groups ?? queryJson.row_groups) as unknown[] : [])
      .map(parseRowGroup)
      .filter((g): g is ReportRowGroup => g !== null),
    aggregate_columns: (Array.isArray(frontJson.aggregate_columns ?? queryJson.aggregate_columns) ? (frontJson.aggregate_columns ?? queryJson.aggregate_columns) as unknown[] : [])
      .map(parseAggregateColumn)
      .filter((c): c is ReportAggregateColumn => c !== null),
    columns: parsed,
  }
}

export async function fetchReportForEdit(
  token: string,
  name: string
): Promise<ReportEditDetail | null> {
  const url = `${CONSTANTS.API_BASE_URL}${EDIT_METHOD}`
  const res = await axios.get(url, {
    params: { name },
    headers: { Authorization: token },
    timeout: 30_000,
  })
  return parseEditResponse(res?.data)
}
