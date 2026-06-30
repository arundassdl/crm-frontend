import type { ParsedReportGrid } from './parse-insights-query-result'

export type ScorecardKpiRow = {
  label: string
  value: number | null
  comparisonValue?: number
  growthPercentage?: number
  recordCount?: number
}

export type ScorecardKpiData = {
  rows: ScorecardKpiRow[]
  valueLabel: string
  groupingLabel: string
  hasRecordCount: boolean
  hasGrowth: boolean
}

function parseCellNumber(value: unknown): number | null {
  if (typeof value === 'number' && !Number.isNaN(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const compact = value.replace(/[^0-9.-]/g, '')
    if (compact === '' || compact === '-' || compact === '.') return null
    const parsed = Number(compact)
    return Number.isNaN(parsed) ? null : parsed
  }
  return null
}

/**
 * Extracts scorecard ranking rows (`{ label, value, comparisonValue?, growthPercentage?, recordCount? }`)
 * from a parsed report grid produced for a Scorecard KPI query.
 */
export function extractScorecardKpiData(parsed: ParsedReportGrid | null | undefined): ScorecardKpiData | null {
  if (!parsed) return null

  const dataRows = parsed.rows.filter(r => r._reportRowVariant === 'data')
  if (!dataRows.length) return null

  const findField = (predicate: (s: string) => boolean): string | undefined =>
    parsed.columnMeta.find(m => predicate(m.label.toLowerCase()) || predicate(m.field.toLowerCase()))?.field

  const recordCountField = findField(s => s === 'record count' || s === 'record_count' || s.includes('distinct_count'))
  const growthField = findField(s => s.includes('growth'))
  const comparisonField = findField(s => s.includes('comparison'))

  const excluded = new Set([recordCountField, growthField, comparisonField].filter(Boolean) as string[])

  // Column order follows the Insights Query Result metadata: the first
  // remaining (non-excluded) column is the row-group label, the second is
  // the measure value. No positional/type-based guessing.
  const remainingFields = parsed.columnFields.filter(f => !excluded.has(f))
  const labelField = remainingFields[0]
  const valueField = remainingFields[1]
  if (!valueField) return null

  const rows: ScorecardKpiRow[] = []
  let hasAnyGrowth = false

  for (const row of dataRows) {
    const value = parseCellNumber(row[valueField])
    const rawLabel = labelField ? row[labelField] : undefined
    const label = rawLabel != null && String(rawLabel).trim() !== '' ? String(rawLabel) : '—'

    const comparisonValue = comparisonField ? parseCellNumber(row[comparisonField]) ?? undefined : undefined
    let growthPercentage = growthField ? parseCellNumber(row[growthField]) ?? undefined : undefined
    if (growthPercentage == null && value != null && comparisonValue != null && comparisonValue !== 0) {
      growthPercentage = ((value - comparisonValue) / Math.abs(comparisonValue)) * 100
    }

    if (growthPercentage != null) hasAnyGrowth = true
    const recordCount = recordCountField ? parseCellNumber(row[recordCountField]) ?? undefined : undefined

    rows.push({ label, value, comparisonValue, growthPercentage, recordCount })
  }

  if (!rows.length) return null

  const valueMeta = parsed.columnMeta.find(m => m.field === valueField)
  const labelMeta = labelField ? parsed.columnMeta.find(m => m.field === labelField) : undefined

  return {
    rows,
    valueLabel: valueMeta?.label ?? valueField,
    groupingLabel: labelMeta?.label ?? labelMeta?.field ?? 'Rank',
    hasRecordCount: Boolean(recordCountField),
    hasGrowth: hasAnyGrowth,
  }
}
