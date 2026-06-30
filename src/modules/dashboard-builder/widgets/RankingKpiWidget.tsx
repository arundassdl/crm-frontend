'use client'

import { memo, useMemo } from 'react'

import type { DashboardWidget } from '../types'
import type { RuntimeFilterRow } from '../types/componentFilters'
import { useInsightsQueryResult } from '../hooks/useInsightsQueryResult'
import { resolveWidgetQueryName } from '../utils/resolveWidgetQueryName'
import { extractRankingKpiData } from '../utils/extractRankingKpiData'
import { formatShortenedNumber, type ShortenedNumberFormat } from '../utils/formatShortenedNumber'

type RankingKpiWidgetProps = {
  widget: DashboardWidget
  loading?: boolean
  runtimeFilters?: RuntimeFilterRow[]
}

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

function RankingKpiWidgetInner({ widget, loading, runtimeFilters }: RankingKpiWidgetProps) {
  const queryName = resolveWidgetQueryName(widget)

  const { parsed, isLoading: queryLoading, isFetching } = useInsightsQueryResult({
    queryName,
    enabled: Boolean(queryName),
    runtimeFilters,
  })

  const data = useMemo(() => extractRankingKpiData(parsed), [parsed])

  const displayRecordCount = readConfigBoolean(widget, 'display_record_count')
  const shortened = readConfigBoolean(widget, 'shortened')
  const format = (readConfigString(widget, 'format') ?? 'K') as ShortenedNumberFormat
  const decimalPlaces = (readConfigNumber(widget, 'decimal_places') ?? 0) as 0 | 1 | 2
  const measuresToFormat = readConfigStringArray(widget, 'measures_to_format')
  const objective = readConfigString(widget, 'objective') ?? 'increase_positive'

  const showLoading =
    loading || (Boolean(queryName) && !data && (queryLoading || isFetching))

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

  const showRecordCount = displayRecordCount && data.hasRecordCount

  return (
    <div className="flex h-full flex-col overflow-hidden px-4 py-3">
      <div className="ranking-kpi-body min-h-0 flex-1 overflow-y-auto">
      {showRecordCount ? (
        <table className="w-full text-xs">
          <thead className="sticky top-0 z-10 bg-white">
            <tr className="border-b border-slate-100 text-left font-medium uppercase tracking-tight text-slate-400">
              <th className="pb-1.5 font-medium">{data.groupingLabel}</th>
              <th className="pb-1.5 font-medium">{data.valueLabel}</th>
              <th className="pb-1.5 text-right font-medium">Record Count</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, idx) => {
              const growth = data.hasGrowth ? row.growthPercentage ?? null : null
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
                <tr key={`${row.label}-${idx}`} className="text-slate-700">
                  <td className="py-1 pr-2">
                    {idx + 1}. {row.label}
                  </td>
                  <td className="py-1">
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
                  <td className="py-1 text-right">
                    {row.recordCount != null ? formatMeasure(row.recordCount, 'Record Count') : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      ) : (
        <ul className="flex flex-col gap-1.5 text-xs text-slate-700">
          {data.rows.map((row, idx) => {
            const growth = data.hasGrowth ? row.growthPercentage ?? null : null
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
              <li key={`${row.label}-${idx}`} className="flex items-center justify-between gap-2">
                <span>
                  {idx + 1}. {row.label}
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <span>{row.value != null ? formatMeasure(row.value, data.valueLabel) : '-'}</span>
                  {growth != null && (
                    <span className={`flex items-center gap-0.5 text-[11px] font-semibold ${growthColor}`}>
                      {isPositiveGrowth ? <i className="ri-arrow-up-s-fill" aria-hidden /> : null}
                      {isNegativeGrowth ? <i className="ri-arrow-down-s-fill" aria-hidden /> : null}
                      {formatGrowth(growth)}
                    </span>
                  )}
                </span>
              </li>
            )
          })}
        </ul>
      )}
      </div>
    </div>
  )
}

export const RankingKpiWidget = memo(RankingKpiWidgetInner)
