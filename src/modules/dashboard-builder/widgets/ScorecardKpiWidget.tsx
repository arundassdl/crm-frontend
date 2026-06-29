'use client'

import { memo, useEffect, useMemo, useRef, useState } from 'react'

import type { DashboardWidget } from '../types'
import type { RuntimeFilterRow } from '../types/componentFilters'
import { useInsightsQueryResult } from '../hooks/useInsightsQueryResult'
import { resolveWidgetQueryName } from '../utils/resolveWidgetQueryName'
import { extractScorecardKpiData } from '../utils/extractScorecardKpiData'
import { formatShortenedNumber, type ShortenedNumberFormat } from '../utils/formatShortenedNumber'

type ScorecardKpiWidgetProps = {
  widget: DashboardWidget
  loading?: boolean
  runtimeFilters?: RuntimeFilterRow[]
}

/** A freshly-saved Scorecard KPI may need a moment for the backend to compute its
 * ranking/comparison query result, so poll a few times before giving up. */
const POLL_DELAY_MS = 2000
const MAX_POLL_ATTEMPTS = 5

function readConfigBoolean(widget: DashboardWidget, key: string): boolean {
  const fromConfig = widget.config?.[key]
  if (typeof fromConfig === 'boolean') return fromConfig
  const fromProperties = (widget.properties as Record<string, unknown> | undefined)?.[key]
  return fromProperties === true
}

function readConfigString(widget: DashboardWidget, key: string): string | undefined {
  const fromConfig = widget.config?.[key]
  if (typeof fromConfig === 'string' && fromConfig.trim()) return fromConfig.trim()
  const fromProperties = (widget.properties as Record<string, unknown> | undefined)?.[key]
  if (typeof fromProperties === 'string' && fromProperties.trim()) return fromProperties.trim()
  return undefined
}

function readConfigNumber(widget: DashboardWidget, key: string): number | undefined {
  const fromConfig = widget.config?.[key]
  if (typeof fromConfig === 'number') return fromConfig
  const fromProperties = (widget.properties as Record<string, unknown> | undefined)?.[key]
  if (typeof fromProperties === 'number') return fromProperties
  return undefined
}

function readConfigStringArray(widget: DashboardWidget, key: string): string[] {
  const fromConfig = widget.config?.[key]
  if (Array.isArray(fromConfig)) return fromConfig.filter((v): v is string => typeof v === 'string')
  const fromProperties = (widget.properties as Record<string, unknown> | undefined)?.[key]
  if (Array.isArray(fromProperties)) return fromProperties.filter((v): v is string => typeof v === 'string')
  return []
}

function formatValue(value: number): string {
  return Number.isInteger(value) ? value.toLocaleString() : value.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

function formatGrowth(value: number): string {
  const abs = Math.abs(value)
  return `${abs.toFixed(2)}%`
}

function ScorecardKpiWidgetInner({ widget, loading, runtimeFilters }: ScorecardKpiWidgetProps) {
  const queryName = resolveWidgetQueryName(widget)

  const {
    parsed,
    isLoading: queryLoading,
    isFetching,
    isSuccess,
    refetch,
  } = useInsightsQueryResult({
    queryName,
    enabled: Boolean(queryName),
    runtimeFilters,
  })

  const data = useMemo(() => extractScorecardKpiData(parsed), [parsed])

  const pollAttemptsRef = useRef(0)
  const [pollExhausted, setPollExhausted] = useState(false)

  useEffect(() => {
    pollAttemptsRef.current = 0
    setPollExhausted(false)
  }, [queryName])

  useEffect(() => {
    if (!queryName || !isSuccess || data || isFetching) return
    if (pollAttemptsRef.current >= MAX_POLL_ATTEMPTS) {
      setPollExhausted(true)
      return
    }
    pollAttemptsRef.current += 1
    const timer = setTimeout(() => {
      void refetch()
    }, POLL_DELAY_MS)
    return () => clearTimeout(timer)
  }, [queryName, isSuccess, data, isFetching, refetch])

  const shortened = readConfigBoolean(widget, 'shortened')
  const format = (readConfigString(widget, 'format') ?? 'K') as ShortenedNumberFormat
  const decimalPlaces = (readConfigNumber(widget, 'decimal_places') ?? 0) as 0 | 1 | 2
  const measuresToFormat = readConfigStringArray(widget, 'measures_to_format')
  const objective = readConfigString(widget, 'objective') ?? 'increase_positive'
  const compareTo = readConfigString(widget, 'compare_to')

  const showLoading =
    loading ||
    (Boolean(queryName) &&
      !data &&
      (queryLoading || isFetching || (isSuccess && !pollExhausted)))

  if (showLoading) {
    return (
      <div className="flex h-full animate-pulse flex-col justify-center gap-2 px-4 py-3">
        <div className="h-4 w-32 rounded bg-slate-200" />
        <div className="h-4 w-full rounded bg-slate-200" />
        <div className="h-4 w-full rounded bg-slate-200" />
        <div className="h-4 w-full rounded bg-slate-200" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-slate-400">
        No Data Found
      </div>
    )
  }

  const formatMeasure = (value: number, label: string): string => {
    if (shortened && (measuresToFormat.length === 0 || measuresToFormat.includes(label))) {
      return formatShortenedNumber(value, format, decimalPlaces)
    }
    return formatValue(value)
  }

  const showRecordCount = data.hasRecordCount
  const showGrowth = data.hasGrowth

  let comparisonFooter: string | null = null
  if (compareTo === 'Previous Year') {
    comparisonFooter = '* Compared with Last Year'
  } else if (compareTo === 'Previous Period') {
    comparisonFooter = '* Compared with Previous Period'
  } else if (compareTo === 'Custom') {
    comparisonFooter = '* Compared with Custom Period'
  }

  return (
    <div className="flex h-full flex-col overflow-hidden px-4 py-3">
      <div className="scorecard-kpi-body min-h-0 flex-1 overflow-y-auto">
      <table className="w-full text-xs">
        <thead className="sticky top-0 z-10 bg-white">
          <tr className="border-b border-slate-100 text-left font-medium uppercase tracking-tight text-slate-400">
            <th className="pb-1.5 font-medium">{data.groupingLabel}</th>
            <th className="pb-1.5 font-medium">{data.valueLabel}</th>
            {showRecordCount && <th className="pb-1.5 text-right font-medium">Record Count</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {data.rows.map((row, idx) => {
            const growth = showGrowth ? row.growthPercentage ?? null : null
            const isPositiveGrowth = growth != null && growth > 0
            const isNegativeGrowth = growth != null && growth < 0
            const isFavorable = objective === 'decrease_positive' ? isNegativeGrowth : isPositiveGrowth
            const growthColor =
              growth == null || growth === 0
                ? 'text-slate-400'
                : isFavorable
                  ? 'text-emerald-500'
                  : 'text-red-500'

            return (
              <tr key={`${row.label}-${idx}`} className="text-slate-700 hover:bg-slate-50/50 transition-colors">
                <td className="py-2 pr-2 font-medium">
                  {row.label}
                </td>
                <td className="py-2">
                  <span className="flex items-center gap-1.5">
                    <span>{row.value != null ? formatMeasure(row.value, data.valueLabel) : '-'}</span>
                    {growth != null && (
                      <span className={`flex items-center gap-0.5 text-[11px] font-semibold ${growthColor}`}>
                        {isPositiveGrowth ? <i className="ri-arrow-up-s-fill" aria-hidden /> : null}
                        {isNegativeGrowth ? <i className="ri-arrow-down-s-fill" aria-hidden /> : null}
                        {formatGrowth(growth)}
                      </span>
                    )}
                  </span>
                </td>
                {showRecordCount && (
                  <td className="py-2 text-right">
                    {row.recordCount != null ? formatMeasure(row.recordCount, 'Record Count') : '—'}
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
      </div>
      {comparisonFooter && (
        <p className="mt-2 text-[10px] italic text-slate-300">{comparisonFooter}</p>
      )}
    </div>
  )
}

export const ScorecardKpiWidget = memo(ScorecardKpiWidgetInner)
