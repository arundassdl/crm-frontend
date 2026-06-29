'use client'

import { memo, useMemo } from 'react'

import type { DashboardWidget } from '../types'
import { useInsightsQueryResult } from '../hooks/useInsightsQueryResult'
import { extractGrowthIndexKpiData } from '../utils/extractGrowthIndexKpiData'
import { resolveWidgetQueryName } from '../utils/resolveWidgetQueryName'

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
      ? 'text-slate-400'
      : isFavorable
        ? 'text-emerald-500'
        : 'text-red-500'

  const comparisonLabel = compareTo === 'Custom' ? 'Custom Period' : compareTo

  return (
    <div className="flex h-full flex-col justify-center overflow-hidden px-4 py-3">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <p className="text-3xl font-semibold tracking-tight text-slate-900">
            {data ? formatValue(data.currentValue) : '—'}
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
          <p className="text-xs text-slate-400">
            {comparisonLabel}: {formatValue(data.comparisonValue)}
          </p>
        ) : null}
      </div>
    </div>
  )
}

export const GrowthIndexKpiWidget = memo(GrowthIndexKpiWidgetInner)
