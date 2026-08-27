'use client'

import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { useTheme } from '@mui/material/styles'
import {
  UsersThree,
  Lightning,
  Handshake,
  Buildings,
  CheckCircle,
  CurrencyCircleDollar,
  SquaresFour,
  ArrowUp,
  ArrowDown,
} from '@phosphor-icons/react'

import { kpiBodyBackground, kpiPaletteEntry } from '../utils/kpiFill'
import { extractKpiTrendSeries } from '../utils/extractKpiTrendSeries'
import { KpiSparkline } from '../components/KpiSparkline'
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
  /**
   * Position among the dashboard's other count cards. Drives which palette entry the card
   * paints in, so a row walks blue → green → orange → pink like the reference. Falls back to
   * the per-widget hash when the caller doesn't know the position.
   */
  paletteIndex?: number
  /**
   * Whether this card renders its own title. False when the card shell kept its header
   * (builder canvas, or a card carrying component filters) — the header shows the title
   * there, and rendering it again would duplicate it.
   */
  showBodyTitle?: boolean
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

/** One decimal, as in the reference (`4.7%`), with a bare integer when it is exact (`25%`). */
function formatGrowth(value: number): string {
  const abs = Math.abs(value)
  return `${Number(abs.toFixed(1))}%`
}

/** Reference count-card icon, chosen from the widget's own title. UI only — no data logic. */
function countIcon(title: string | undefined): React.ElementType {
  const t = String(title ?? '').toLowerCase()
  if (t.includes('contact')) return UsersThree
  if (t.includes('lead')) return Lightning
  if (t.includes('deal') || t.includes('opportunit')) return Handshake
  if (t.includes('account') || t.includes('organi') || t.includes('compan')) return Buildings
  if (t.includes('task')) return CheckCircle
  if (t.includes('revenue') || t.includes('amount') || t.includes('value') || t.includes('sales')) {
    return CurrencyCircleDollar
  }
  return SquaresFour
}

function KpiCardWidgetInner({
  widget,
  loading,
  runtimeFilters,
  paletteIndex,
  showBodyTitle = true,
}: KpiCardWidgetProps) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
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
  // Real points only: a per-period series when the query returns one, otherwise the two
  // values the card already displays. Never synthesised — `null` means no chart is drawn.
  const trend = useMemo(
    () => extractKpiTrendSeries(parsed, data?.currentValue ?? null, data?.comparisonValue ?? null),
    [parsed, data]
  )

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
  const growthPill =
    growth == null || growth === 0
      ? 'text-[#64748B] bg-white/85 dark:text-zinc-500 dark:bg-zinc-800'
      : isFavorable
        ? 'text-[#16A34A] bg-white/85 dark:text-emerald-400 dark:bg-emerald-500/15'
        : 'text-[#DC2626] bg-white/85 dark:text-red-400 dark:bg-red-500/15'

  const comparisonLabel = compareTo === 'Custom' ? 'Custom Period' : compareTo
  const Icon = countIcon(widget.title)
  const paletteKey = widget.catalogId ?? widget.title ?? widget.id
  // Same palette entry the body fill comes from, so each card's line matches its own colour.
  const accent = kpiPaletteEntry(paletteKey, paletteIndex).accent

  // With neither a comparison pill nor a chart there is no bottom row to push down to, so the
  // value keeps the centred placement the card had before the reference layout was added.
  const hasFooter = growth != null || trend != null

  return (
    <div
      className={`flex h-full flex-col overflow-hidden p-6 ${hasFooter ? 'justify-between' : 'justify-center'}`}
      style={{ backgroundColor: kpiBodyBackground(paletteKey, isDark, 'solid', paletteIndex) }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {/* Title sits in the card body (uppercase label) as in the reference, rather than
              only in the card header — see WidgetCard, which drops its own header for these
              cards when it would carry nothing but this same title. */}
          {showBodyTitle && widget.title ? (
            <p className="truncate text-[13px] font-semibold uppercase tracking-[0.08em] text-[#4A5675] dark:text-[#A1A1AA]">
              {widget.title}
            </p>
          ) : null}
          <div className="mt-2.5 truncate text-[38px] font-extrabold leading-none tracking-tight text-[#0C2472] dark:text-white">
            {data ? formatValue(data.currentValue) : fallbackValue ?? '—'}
          </div>
        </div>
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-white shadow-sm dark:bg-[#1C1C1E]"
          aria-hidden
        >
          {/* One blue across every card in the row, as in the reference — the per-card colour
              is carried by the fill and the trend line, not the icon. */}
          <Icon size={21} weight="duotone" color={isDark ? '#A1A1AA' : '#1D4ED8'} />
        </span>
      </div>
      {hasFooter ? (
      <div className="mt-5 flex items-end justify-between gap-3 overflow-hidden">
        {growth != null ? (
          <span
            className={`inline-flex min-w-0 items-center gap-1 rounded-full px-3 py-1.5 text-[12.5px] font-semibold ${growthPill}`}
            // The absolute comparison figure used to occupy its own line; the reference folds the
            // comparison into this pill, so it is kept here rather than dropped.
            title={data?.comparisonValue != null ? `${comparisonLabel}: ${formatValue(data.comparisonValue)}` : undefined}
          >
            {isPositiveGrowth ? <ArrowUp size={12} weight="bold" aria-hidden /> : null}
            {isNegativeGrowth ? <ArrowDown size={12} weight="bold" aria-hidden /> : null}
            {/* Truncates first so the trend chart beside it is never pushed out of the card. */}
            <span className="truncate">
              {formatGrowth(growth)} vs {comparisonLabel.toLowerCase()}
            </span>
          </span>
        ) : (
          <span />
        )}
        {trend ? (
          <KpiSparkline
            points={trend.points}
            accent={accent}
            width={100}
            height={44}
            title={
              trend.source === 'series'
                ? `Trend over ${trend.points.length} periods`
                : `${comparisonLabel} → current`
            }
          />
        ) : null}
      </div>
      ) : null}
    </div>
  )
}

export const KpiCardWidget = memo(KpiCardWidgetInner)
