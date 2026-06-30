import type { ParsedReportGrid } from './parse-insights-query-result'

export type GrowthIndexKpiData = {
  currentValue: number
  comparisonValue: number | null
  growthPercentage: number | null
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && !Number.isNaN(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value.replace(/[^0-9.eE+-]/g, ''))
    return Number.isNaN(parsed) ? null : parsed
  }
  return null
}

function readGrowthFields(source: Record<string, unknown>): GrowthIndexKpiData | null {
  const currentValue = toNumber(source.current_value)
  if (currentValue == null) return null

  const comparisonValue = toNumber(source.comparison_value)
  let growthPercentage = toNumber(source.growth_percentage)

  if (growthPercentage == null && comparisonValue != null && comparisonValue !== 0) {
    growthPercentage = ((currentValue - comparisonValue) / Math.abs(comparisonValue)) * 100
  }

  return { currentValue, comparisonValue, growthPercentage }
}

function candidateObjects(doc: Record<string, unknown>): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [doc]
  for (const key of ['comparison', 'comparison_result', 'growth', 'kpi', 'message']) {
    let nested = doc[key]
    if (typeof nested === 'string') {
      try {
        nested = JSON.parse(nested) as unknown
      } catch {
        continue
      }
    }
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      out.push(nested as Record<string, unknown>)
    }
  }
  return out
}

/**
 * Reads Growth Index KPI fields (`current_value`, `comparison_value`,
 * `growth_percentage`) from an Insights Query Result document, falling back to
 * the first data row of the parsed grid when the doc doesn't carry them.
 */
export function extractGrowthIndexKpiData(
  doc: Record<string, unknown> | null | undefined,
  parsed?: ParsedReportGrid | null
): GrowthIndexKpiData | null {
  if (doc) {
    for (const source of candidateObjects(doc)) {
      const data = readGrowthFields(source)
      if (data) return data
    }
  }

  const dataRow = parsed?.rows.find(row => row._reportRowVariant === 'data') ?? parsed?.rows[0]
  if (dataRow) {
    const data = readGrowthFields(dataRow)
    if (data) return data
  }

  return null
}
