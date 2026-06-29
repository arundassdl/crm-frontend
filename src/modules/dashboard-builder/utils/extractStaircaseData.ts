import type { ParsedReportGrid } from './parse-insights-query-result'

export type StaircaseStageData = {
  stage: string
  count: number
  width: number
  won: number
  lost: number
  nextCount: number | null
  conversion: number | null
  isLast: boolean
}

export type StaircaseData = {
  stages: StaircaseStageData[]
  totalWon: number
  totalLost: number
  overallWinRate: number | null
  totalCount: number
  firstStageLabel: string
}

function isTerminalStage(name: string): boolean {
  const lower = name.toLowerCase().trim()
  return (
    lower === 'closed won' || lower === 'closedwon' || lower === 'closed-won' ||
    lower === 'closed lost' || lower === 'closedlost' || lower === 'closed-lost' ||
    lower === 'won' || lower === 'lost'
  )
}

function isWonStage(name: string): boolean {
  const lower = name.toLowerCase().trim()
  return lower === 'closed won' || lower === 'closedwon' || lower === 'closed-won' || lower === 'won'
}

function findColumnField(
  parsed: ParsedReportGrid,
  heuristic: (field: string, label: string) => boolean
): string | null {
  for (const meta of parsed.columnMeta) {
    if (heuristic(meta.field.toLowerCase(), meta.label.toLowerCase())) return meta.field
  }
  return null
}

function parseCellNumber(value: unknown): number {
  if (typeof value === 'number' && !Number.isNaN(value)) return value
  if (typeof value === 'string') {
    const n = Number(value.replace(/[^0-9.-]/g, ''))
    return Number.isNaN(n) ? 0 : n
  }
  return 0
}

export function extractStaircaseData(parsed: ParsedReportGrid | null): StaircaseData | null {
  if (!parsed) return null

  const dataRows = parsed.rows.filter(r => r._reportRowVariant === 'data')
  if (!dataRows.length) return null

  const stageField = findColumnField(parsed, (f, l) => l === 'stage' || f === 'stage')
    ?? parsed.columnFields.find(f => {
      const sample = dataRows[0]?.[f]
      return typeof sample === 'string'
    })
    ?? null
  if (!stageField) return null

  const countField = findColumnField(parsed, (f, l) =>
    l === 'count' || f === 'count' || l.includes('count')
  )
    ?? parsed.columnFields.find(f => {
      if (f === stageField) return false
      const l = f.toLowerCase()
      if (l === 'probability' || l.includes('probability')) return false
      if (l === 'won' || l === 'lost') return false
      const sample = dataRows[0]?.[f]
      return typeof sample === 'number'
    })
    ?? null
  if (!countField) return null

  const wonField = findColumnField(parsed, (f, l) => l === 'won' || f === 'won')
  const lostField = findColumnField(parsed, (f, l) => l === 'lost' || f === 'lost')

  const raw: { stage: string; count: number; won: number; lost: number }[] = []
  for (const row of dataRows) {
    const stage = String(row[stageField] ?? '').trim()
    if (!stage) continue
    raw.push({
      stage,
      count: parseCellNumber(row[countField]),
      won: wonField ? parseCellNumber(row[wonField]) : 0,
      lost: lostField ? parseCellNumber(row[lostField]) : 0,
    })
  }

  if (!raw.length) return null

  const pipelineStages = raw.filter(r => !isTerminalStage(r.stage))
  const terminalStages = raw.filter(r => isTerminalStage(r.stage))

  if (!pipelineStages.length) return null

  const maxCount = Math.max(...pipelineStages.map(r => r.count))
  const safeMax = maxCount > 0 ? maxCount : 1

  const stages: StaircaseStageData[] = pipelineStages.map((r, i) => {
    const isLast = i === pipelineStages.length - 1
    const next = !isLast ? pipelineStages[i + 1] : null
    let conversion: number | null
    if (isLast) {
      conversion = 0
    } else if (r.count > 0) {
      conversion = Math.round((next!.count / r.count) * 1000) / 10
    } else {
      conversion = 0
    }

    return {
      stage: r.stage,
      count: r.count,
      width: Math.round((r.count / safeMax) * 1000) / 10,
      won: r.won,
      lost: r.lost,
      nextCount: next?.count ?? 0,
      conversion,
      isLast,
    }
  })

  const wonFromPipeline = pipelineStages.reduce((sum, r) => sum + r.won, 0)
  const lostFromPipeline = pipelineStages.reduce((sum, r) => sum + r.lost, 0)
  const wonFromTerminal = terminalStages
    .filter(r => isWonStage(r.stage))
    .reduce((sum, r) => sum + r.count, 0)
  const lostFromTerminal = terminalStages
    .filter(r => !isWonStage(r.stage))
    .reduce((sum, r) => sum + r.count, 0)
  const totalWon = wonFromPipeline + wonFromTerminal
  const totalLost = lostFromPipeline + lostFromTerminal

  const firstCount = pipelineStages[0]?.count ?? 0
  const overallWinRate =
    firstCount > 0 && totalWon > 0
      ? Math.round((totalWon / firstCount) * 1000) / 10
      : firstCount > 0 ? 0 : null

  return {
    stages,
    totalWon,
    totalLost,
    overallWinRate,
    totalCount: firstCount,
    firstStageLabel: pipelineStages[0]?.stage ?? '',
  }
}
