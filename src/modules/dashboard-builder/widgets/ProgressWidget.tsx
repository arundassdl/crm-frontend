'use client'

import { memo, useMemo } from 'react'

import type { DashboardWidget } from '../types'
import type { RuntimeFilterRow } from '../types/componentFilters'
import { useInsightsQueryResult } from '../hooks/useInsightsQueryResult'
import { resolveWidgetQueryName } from '../utils/resolveWidgetQueryName'
import { extractChartSeriesFromGrid } from '../utils/parse-insights-query-result'

const PROGRESS_COLORS = ['#2563eb', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4']

type ProgressWidgetProps = {
  widget: DashboardWidget
  loading?: boolean
  runtimeFilters?: RuntimeFilterRow[]
}

type ProgressRow = { label: string; value: number; percent: number; color: string }

function buildProgressRows(
  categories: string[],
  values: number[]
): ProgressRow[] {
  const maxVal = Math.max(...values, 1)
  return categories.map((label, i) => ({
    label,
    value: values[i] ?? 0,
    percent: Math.round(((values[i] ?? 0) / maxVal) * 100),
    color: PROGRESS_COLORS[i % PROGRESS_COLORS.length],
  }))
}

const FALLBACK_ROWS: ProgressRow[] = [
  { label: 'Group A', value: 30, percent: 30, color: PROGRESS_COLORS[0] },
  { label: 'Group B', value: 60, percent: 60, color: PROGRESS_COLORS[1] },
  { label: 'Group C', value: 85, percent: 85, color: PROGRESS_COLORS[2] },
]

function ProgressBarList({ rows }: { rows: ProgressRow[] }) {
  return (
    <div className="flex h-full flex-col justify-center gap-3 overflow-y-auto px-4 py-3">
      {rows.map((row, i) => (
        <div key={i} className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs">
            <span className="truncate font-medium text-slate-700">{row.label}</span>
            <span className="ml-2 shrink-0 tabular-nums text-slate-500">{row.percent}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${row.percent}%`, backgroundColor: row.color }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function ProgressWidgetInner({ widget, loading: loadingProp, runtimeFilters }: ProgressWidgetProps) {
  const queryName = resolveWidgetQueryName(widget)
  const useLiveData = Boolean(queryName)

  const { parsed, isLoading: queryLoading, error } = useInsightsQueryResult({
    queryName,
    enabled: useLiveData,
    runtimeFilters,
  })

  const rows = useMemo(() => {
    if (!parsed) return FALLBACK_ROWS
    const series = extractChartSeriesFromGrid(parsed)
    if (!series) return FALLBACK_ROWS
    return buildProgressRows(series.categories, series.values)
  }, [parsed])

  const loading = loadingProp || (useLiveData && queryLoading)

  if (loading) {
    return <div className="h-full min-h-[120px] animate-pulse rounded bg-slate-100" />
  }

  if (useLiveData && error) {
    return (
      <div className="flex h-full min-h-[120px] flex-col items-center justify-center gap-1 px-3 text-center">
        <span className="text-xs font-medium text-red-600">Failed to load chart data</span>
        <span className="text-[11px] text-slate-500">
          {error instanceof Error ? error.message : 'Unknown error'}
        </span>
      </div>
    )
  }

  return <ProgressBarList rows={rows} />
}

export const ProgressWidget = memo(ProgressWidgetInner)
