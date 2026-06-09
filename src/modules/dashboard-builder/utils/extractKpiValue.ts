import type { ParsedReportGrid } from './parse-insights-query-result'

function formatKpiScalar(raw: unknown): string | null {
  if (raw == null || raw === '') return null
  if (typeof raw === 'number' && !Number.isNaN(raw)) {
    return Number.isInteger(raw) ? String(raw) : String(raw)
  }
  const text = String(raw).trim()
  return text || null
}

/** First measure cell from a single-row KPI / aggregate query result. */
export function extractKpiValue(parsed: ParsedReportGrid | null): string | null {
  if (!parsed?.rows.length || !parsed.columnFields.length) return null

  const dataRow =
    parsed.rows.find(row => row._reportRowVariant === 'data') ??
    parsed.rows.find(row => row._reportRowVariant !== 'total') ??
    parsed.rows[0]

  for (const field of parsed.columnFields) {
    const formatted = formatKpiScalar(dataRow[field])
    if (formatted != null) return formatted
  }

  return null
}
