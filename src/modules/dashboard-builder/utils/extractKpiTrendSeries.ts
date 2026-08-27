import type { ParsedReportGrid } from './parse-insights-query-result'

/**
 * Points for a count card's trend sparkline, plus how they were obtained so the UI can
 * label them honestly.
 *
 * - `series`   — the query returned a row per period; these are real per-period values.
 * - `endpoints`— the query returned a single KPI row, so the only history available is the
 *                comparison value and the current value (two real points).
 */
export type KpiTrendSeries = {
  points: number[]
  source: 'series' | 'endpoints'
}

const DATE_TYPES = ['date', 'datetime', 'timestamp', 'time']

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && !Number.isNaN(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value.replace(/[^0-9.eE+-]/g, ''))
    return Number.isNaN(parsed) ? null : parsed
  }
  return null
}

function isDateColumn(field: string, type: string): boolean {
  const t = type.toLowerCase()
  if (DATE_TYPES.some(d => t.includes(d))) return true
  const f = field.toLowerCase()
  return f.includes('date') || f.includes('month') || f.includes('week') || f.includes('period')
}

/**
 * Build the trend points for a count card.
 *
 * Prefers a genuine per-period series from the query grid: when the result has several data
 * rows, the rows are ordered by their date-ish column (if any) and the first numeric column
 * that isn't that date column is read off each row. Falls back to the two real values the KPI
 * already shows (previous → current). Returns `null` when neither is available, so the caller
 * can omit the chart rather than draw an invented one.
 */
export function extractKpiTrendSeries(
  parsed: ParsedReportGrid | null | undefined,
  currentValue: number | null | undefined,
  comparisonValue: number | null | undefined
): KpiTrendSeries | null {
  const dataRows = (parsed?.rows ?? []).filter(
    row => row._reportRowVariant === undefined || row._reportRowVariant === 'data'
  )

  if (parsed && dataRows.length >= 3) {
    const meta = parsed.columnMeta ?? []
    const dateCol = meta.find(m => isDateColumn(m.field, m.type))?.field

    // The value column: first column that parses as a number on most rows and isn't the date.
    const valueCol = (parsed.columnFields ?? []).find(field => {
      if (field === dateCol) return false
      const numeric = dataRows.filter(row => toNumber(row[field]) != null).length
      return numeric >= Math.ceil(dataRows.length * 0.8)
    })

    if (valueCol) {
      const ordered = dateCol
        ? [...dataRows].sort((a, b) => {
            const at = new Date(String(a[dateCol])).getTime()
            const bt = new Date(String(b[dateCol])).getTime()
            if (Number.isNaN(at) || Number.isNaN(bt)) return 0
            return at - bt
          })
        : dataRows

      const points = ordered.map(row => toNumber(row[valueCol])).filter((n): n is number => n != null)
      if (points.length >= 3) return { points, source: 'series' }
    }
  }

  if (currentValue != null && comparisonValue != null) {
    return { points: [comparisonValue, currentValue], source: 'endpoints' }
  }

  return null
}
