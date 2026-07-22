'use client'

import { memo, useMemo } from 'react'
import { useTheme } from '@mui/material/styles'

import type { DashboardWidget } from '../types'
import { useInsightsQueryResult } from '../hooks/useInsightsQueryResult'
import { extractGrowthIndexKpiData } from '../utils/extractGrowthIndexKpiData'
import { resolveWidgetQueryName } from '../utils/resolveWidgetQueryName'
import { kpiBodyBackground } from '../utils/kpiFill'

type GrowthIndexKpiWidgetProps = {
  widget: DashboardWidget
  loading?: boolean
}

function readConfigString(widget: DashboardWidget, key: string): string {
  const fromConfig = widget.config?.[key]
  if (typeof fromConfig === 'string' && fromConfig.trim()) return fromConfig.trim()
  const fromProperties = (widget.properties as Record<string, unknown> | undefined)?.[key]
  if (typeof fromProperties === 'string' && fromProperties.trim()) return fromProperties.trim()
  return ''
}

function formatValue(value: number): string {
  return Number.isInteger(value) ? value.toLocaleString() : value.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

function formatGrowth(value: number): string {
  const abs = Math.abs(value)
  return `${Number.isInteger(abs) ? abs : Number(abs.toFixed(2))}%`
}

function GrowthIndexKpiWidgetInner({ widget, loading }: GrowthIndexKpiWidgetProps) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const compareTo = readConfigString(widget, 'compare_to') || 'Previous Period'
  const objective = readConfigString(widget, 'objective') || 'increase_positive'
  const queryName = resolveWidgetQueryName(widget)

  const { parsed, doc, isLoading: queryLoading } = useInsightsQueryResult({
    queryName,
    enabled: Boolean(queryName),
  })

  const data = useMemo(() => extractGrowthIndexKpiData(doc, parsed), [doc, parsed])

  const showLoading = loading || (Boolean(queryName) && queryLoading && !data)

  if (showLoading) {
    return (
      <div className="flex h-full animate-pulse flex-col justify-center gap-2 px-4 py-3">
        <div className="h-4 w-32 rounded bg-slate-200" />
        <div className="h-8 w-24 rounded bg-slate-200" />
        <div className="h-3 w-28 rounded bg-slate-200" />
      </div>
    )
  }

  const growth = data?.growthPercentage ?? null
  const isPositiveGrowth = growth != null && growth > 0
  const isNegativeGrowth = growth != null && growth < 0
  const isFavorable = objective === 'decrease_positive' ? isNegativeGrowth : isPositiveGrowth
  const growthColor =
    growth == null || growth === 0
      ? 'text-slate-400 bg-slate-100 dark:text-zinc-500 dark:bg-zinc-800'
      : isFavorable
        ? 'text-emerald-600 bg-[#D1FAE5] dark:text-emerald-400 dark:bg-emerald-500/15'
        : 'text-red-500 bg-[#FEE2E2] dark:bg-red-500/15'

  const comparisonLabel = compareTo === 'Custom' ? 'Custom Period' : compareTo

  return (
    <div
      className="flex h-full flex-col justify-center overflow-hidden px-5 py-4"
      style={{ backgroundColor: kpiBodyBackground(widget.catalogId ?? widget.title ?? widget.id, isDark) }}
    >
      <div className="text-[26px] font-extrabold leading-none tracking-tight text-[#0C2472] dark:text-white">
        {data ? formatValue(data.currentValue) : '—'}
      </div>
      {growth != null ? (
        <span className={`mt-2 inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${growthColor}`}>
          {isPositiveGrowth ? <i className="ri-arrow-up-s-fill" aria-hidden /> : null}
          {isNegativeGrowth ? <i className="ri-arrow-down-s-fill" aria-hidden /> : null}
          {formatGrowth(growth)}
        </span>
      ) : null}
      {data?.comparisonValue != null ? (
        <p className="mt-1.5 text-[11px] font-semibold text-slate-400 dark:text-zinc-500">
          {comparisonLabel}: {formatValue(data.comparisonValue)}
        </p>
      ) : null}
    </div>
  )
}

export const GrowthIndexKpiWidget = memo(GrowthIndexKpiWidgetInner)
