import type { ParsedReportGrid } from './parse-insights-query-result'

export type ComparatorResultData = {
  /** First column values — comparison entities (users, roles, years, cities, etc.). */
  entities: string[]
  /** Remaining columns — one metric per column, pivoted into a row of values (one per entity). */
  metrics: { name: string; values: number[] }[]
}

export type TimePeriodResultData = {
  periodLabel: string
  rows: { name: string; value: string }[]
}

function parseNumber(value: unknown): number {
  if (typeof value === 'number' && !Number.isNaN(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const compact = value.replace(/[^0-9.-]/g, '')
    const parsed = Number(compact)
    return Number.isNaN(parsed) ? 0 : parsed
  }
  return 0
}

function formatValue(raw: unknown): string {
  const n = parseNumber(raw)
  return Number.isFinite(n) ? n.toLocaleString() : String(raw ?? '—')
}

/**
 * Returns true when the query result columns indicate a Time Period comparator
 * (PARAMETER_NAME + current_value), regardless of widget config.
 *
 * This is the structural fallback used when compare_among isn't available in
 * the widget config (e.g. loaded from an older API response).
 */
export function isTimePeriodResult(
  doc: Record<string, unknown> | null,
  parsed: ParsedReportGrid | null
): boolean {
  const lower = (s: string) => s.toLowerCase()

  if (parsed?.columnFields.length) {
    const hasParam = parsed.columnFields.some(f => lower(f) === 'parameter_name')
    const hasValue = parsed.columnFields.some(f => lower(f) === 'current_value')
    if (hasParam && hasValue) return true
  }

  if (!doc) return false
  const rawResults = doc.results
  const matrix = typeof rawResults === 'string'
    ? (() => { try { return JSON.parse(rawResults) as unknown } catch { return null } })()
    : rawResults

  if (Array.isArray(matrix) && Array.isArray(matrix[0])) {
    const headers = matrix[0] as unknown[]
    return (
      headers.some(h => typeof h === 'string' && lower(h) === 'parameter_name') &&
      headers.some(h => typeof h === 'string' && lower(h) === 'current_value')
    )
  }

  const candidates = [doc.results, doc.result, doc.data, doc.rows, doc.table_data]
  for (const c of candidates) {
    if (!Array.isArray(c) || !c.length) continue
    if (Array.isArray(c[0])) {
      const headers = c[0] as unknown[]
      if (
        headers.some(h => typeof h === 'string' && lower(h) === 'parameter_name') &&
        headers.some(h => typeof h === 'string' && lower(h) === 'current_value')
      ) return true
    }
    if (c[0] && typeof c[0] === 'object' && !Array.isArray(c[0])) {
      const keys = Object.keys(c[0] as Record<string, unknown>)
      if (
        keys.some(k => lower(k) === 'parameter_name') &&
        keys.some(k => lower(k) === 'current_value')
      ) return true
    }
  }
  return false
}

/**
 * Transforms the Time Period Insights result directly from the raw API doc,
 * bypassing the ParsedReportGrid abstraction.
 *
 * The backend returns one row per parameter:
 *   PARAMETER_NAME | current_value | comparison_value | growth_percentage
 *
 * We iterate the dataset rows (NOT Object.keys) and read:
 *   row.PARAMETER_NAME → metric label
 *   row.current_value  → value (displayed as compare_among_label column)
 */
export function extractTimePeriodDataFromDoc(
  doc: Record<string, unknown> | null,
  periodLabel: string
): TimePeriodResultData | null {
  if (!doc) return null

  const lower = (s: string) => s.toLowerCase()

  // Locate the array of rows — try matrix format first, then object-row format.
  const rawResults = doc.results
  const matrix = typeof rawResults === 'string'
    ? (() => { try { return JSON.parse(rawResults) as unknown } catch { return null } })()
    : rawResults

  if (Array.isArray(matrix) && matrix.length >= 2 && Array.isArray(matrix[0])) {
    // 2-D matrix: first sub-array = headers, rest = data rows.
    const headers = matrix[0] as unknown[]
    const paramIdx = headers.findIndex(h => typeof h === 'string' && lower(h) === 'parameter_name')
    const valueIdx = headers.findIndex(h => typeof h === 'string' && lower(h) === 'current_value')
    if (paramIdx < 0 || valueIdx < 0) return null

    const rows = (matrix.slice(1) as unknown[][])
      .map(row => ({ name: String(row[paramIdx] ?? ''), value: formatValue(row[valueIdx]) }))
      .filter(r => r.name.trim())

    return rows.length ? { periodLabel, rows } : null
  }

  // Object-row format: search the usual candidates.
  const candidates = [doc.results, doc.result, doc.data, doc.rows, doc.table_data]
  for (const c of candidates) {
    if (!Array.isArray(c) || !c.length) continue
    const objRows = c.filter(
      (r): r is Record<string, unknown> => r != null && typeof r === 'object' && !Array.isArray(r)
    )
    if (!objRows.length) continue

    const first = objRows[0]
    const paramKey = Object.keys(first).find(k => lower(k) === 'parameter_name')
    const valueKey = Object.keys(first).find(k => lower(k) === 'current_value')
    if (!paramKey || !valueKey) continue

    const rows = objRows
      .map(row => ({ name: String(row[paramKey] ?? ''), value: formatValue(row[valueKey]) }))
      .filter(r => r.name.trim())

    if (rows.length) return { periodLabel, rows }
  }

  return null
}

/**
 * Fallback: transforms the Time Period result from a pre-parsed grid.
 * Kept for environments where the raw doc is unavailable.
 */
export function transformTimePeriodResult(
  parsed: ParsedReportGrid | null,
  periodLabel: string
): TimePeriodResultData | null {
  if (!parsed || !parsed.columnFields.length) return null
  const dataRows = parsed.rows.filter(r => r._reportRowVariant === 'data')
  if (!dataRows.length) return null

  const lower = (s: string) => s.toLowerCase()
  const paramField = parsed.columnFields.find(f => lower(f) === 'parameter_name')
  const valueField = parsed.columnFields.find(f => lower(f) === 'current_value')
  if (!paramField || !valueField) return null

  const rows = dataRows
    .map(row => ({ name: String(row[paramField] ?? ''), value: formatValue(row[valueField]) }))
    .filter(r => r.name.trim())

  return rows.length ? { periodLabel, rows } : null
}

/**
 * Transforms a flat Insights Query result table into the Comparator scorecard shape:
 * the first column becomes the comparison entities, and every remaining column becomes
 * a metric row with one value per entity.
 */
export function transformComparatorResult(parsed: ParsedReportGrid | null): ComparatorResultData | null {
  if (!parsed || parsed.columnFields.length < 2) return null

  const dataRows = parsed.rows.filter(r => r._reportRowVariant === 'data')
  if (!dataRows.length) return null

  const [entityField, ...metricFields] = parsed.columnFields
  if (!metricFields.length) return null

  const entities = dataRows.map(row => {
    const value = row[entityField]
    return value != null && String(value).trim() !== '' ? String(value) : '—'
  })

  const metrics = metricFields.map(field => {
    const meta = parsed.columnMeta.find(m => m.field === field)
    return {
      name: meta?.label ?? field,
      values: dataRows.map(row => parseNumber(row[field])),
    }
  })

  return { entities, metrics }
}
