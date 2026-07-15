'use client'

import { memo, useEffect, useMemo, useRef, useState } from 'react'

import type { DashboardWidget } from '../types'
import type { RuntimeFilterRow } from '../types/componentFilters'
import { useInsightsQueryResult } from '../hooks/useInsightsQueryResult'
import { extractGrowthIndexKpiData } from '../utils/extractGrowthIndexKpiData'
import { extractKpiValue } from '../utils/extractKpiValue'
import { resolveWidgetQueryName } from '../utils/resolveWidgetQueryName'

type KpiCardWidgetProps = {
  widget: DashboardWidget
  loading?: boolean
  runtimeFilters?: RuntimeFilterRow[]
}

/** A freshly-saved KPI with a comparison indicator may need a moment for the backend to
 * compute comparison values, so poll a few times before giving up. */
const POLL_DELAY_MS = 2000
const MAX_POLL_ATTEMPTS = 5

function readConfigString(widget: DashboardWidget, key: string): string | undefined {
  const fromConfig = widget.config?.[key]
  if (typeof fromConfig === 'string' && fromConfig.trim()) return fromConfig.trim()
  const fromProperties = (widget.properties as Record<string, unknown> | undefined)?.[key]
  if (typeof fromProperties === 'string' && fromProperties.trim()) return fromProperties.trim()
  return undefined
}

function formatValue(value: number): string {
  return Number.isInteger(value) ? value.toLocaleString() : value.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

function formatGrowth(value: number): string {
  const abs = Math.abs(value)
  return `${Number.isInteger(abs) ? abs : Number(abs.toFixed(2))}%`
}

function KpiCardWidgetInner({ widget, loading, runtimeFilters }: KpiCardWidgetProps) {
  const compareToRaw = readConfigString(widget, 'compare_to')
  const objectiveRaw = readConfigString(widget, 'objective')
  const hasComparisonConfig = Boolean(compareToRaw || objectiveRaw)
  const compareTo = compareToRaw || 'Previous Period'
  const objective = objectiveRaw || 'increase_positive'
  const queryName = resolveWidgetQueryName(widget)

  const {
    parsed,
    doc,
    isLoading: queryLoading,
    isFetching,
    isSuccess,
    refetch,
  } = useInsightsQueryResult({
    queryName,
    enabled: Boolean(queryName),
    runtimeFilters,
  })

  const data = useMemo(() => extractGrowthIndexKpiData(doc, parsed), [doc, parsed])
  const fallbackValue = useMemo(() => extractKpiValue(parsed), [parsed])

  const pollAttemptsRef = useRef(0)
  const [pollExhausted, setPollExhausted] = useState(false)

  useEffect(() => {
    pollAttemptsRef.current = 0
    setPollExhausted(false)
  }, [queryName])

  useEffect(() => {
    if (!hasComparisonConfig) return
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
  }, [hasComparisonConfig, queryName, isSuccess, data, isFetching, refetch])

  const showLoading =
    loading ||
    (Boolean(queryName) &&
      !data &&
      fallbackValue == null &&
      (queryLoading || isFetching || (hasComparisonConfig && isSuccess && !pollExhausted)))

  if (showLoading) {
    return (
      <div className="flex h-full animate-pulse flex-col justify-center gap-2 px-4 py-3">
        <div className="h-4 w-32 rounded bg-slate-200 dark:bg-zinc-800" />
        <div className="h-8 w-24 rounded bg-slate-200 dark:bg-zinc-800" />
        <div className="h-3 w-28 rounded bg-slate-200 dark:bg-zinc-800" />
      </div>
    )
  }

  const growth = data?.growthPercentage ?? null
  const isPositiveGrowth = growth != null && growth > 0
  const isNegativeGrowth = growth != null && growth < 0
  const isFavorable = objective === 'decrease_positive' ? isNegativeGrowth : isPositiveGrowth
  const growthColor =
    growth == null || growth === 0
      ? 'text-slate-400 dark:text-zinc-500'
      : isFavorable
        ? 'text-emerald-500'
        : 'text-red-500'

  const comparisonLabel = compareTo === 'Custom' ? 'Custom Period' : compareTo

  return (
    <div className="flex h-full flex-col justify-center overflow-hidden px-4 py-3">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <p className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-zinc-50">
            {data ? formatValue(data.currentValue) : fallbackValue ?? '—'}
          </p>
          {growth != null ? (
            <span className={`flex items-center gap-0.5 text-xs font-semibold ${growthColor}`}>
              {isPositiveGrowth ? <i className="ri-arrow-up-s-fill" aria-hidden /> : null}
              {isNegativeGrowth ? <i className="ri-arrow-down-s-fill" aria-hidden /> : null}
              {formatGrowth(growth)}
            </span>
          ) : null}
        </div>
        {data?.comparisonValue != null ? (
          <p className="text-xs text-slate-400 dark:text-zinc-500">
            {comparisonLabel}: {formatValue(data.comparisonValue)}
          </p>
        ) : null}
      </div>
    </div>
  )
}

export const KpiCardWidget = memo(KpiCardWidgetInner)
