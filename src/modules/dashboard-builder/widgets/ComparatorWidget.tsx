'use client'

import { memo, useEffect, useRef, useState } from 'react'

import type { DashboardWidget } from '../types'
import { useInsightsQueryResult } from '../hooks/useInsightsQueryResult'
import { resolveWidgetQueryName } from '../utils/resolveWidgetQueryName'
import {
  transformComparatorResult,
  extractTimePeriodDataFromDoc,
  transformTimePeriodResult,
  isTimePeriodResult,
  type ComparatorResultData,
} from '../utils/transformComparatorResult'
import { ElegantScorecard, type ElegantScorecardMetric } from '../components/comparator/ElegantScorecard'
import { TimePeriodPivotTable } from '../components/comparator/TimePeriodPivotTable'

type ComparatorWidgetProps = {
  widget: DashboardWidget
  loading?: boolean
}

/** A freshly-saved Comparator may need a moment for the backend to compute its
 * grouped query result, so poll a few times before giving up (same as Scorecard KPI). */
const POLL_DELAY_MS = 2000
const MAX_POLL_ATTEMPTS = 5

const DEFAULT_SALES_REP_METRICS = ['Revenue Generated', 'Deals Closed', 'Activities Completed', 'Conversion Rate']

const SALES_REPS = ['Amelia Brooks', 'Ethan Carter', 'Liam Sanchez', 'Sophia Caddell']

/** Deterministic sample value so the comparator preview stays stable across renders. */
function sampleValue(seed: number): number {
  return 30 + ((seed * 37) % 70)
}

function readMetricLabels(widget: DashboardWidget, fallback: string[]): string[] {
  const fromConfig = widget.config?.comparison_parameter_labels
  if (Array.isArray(fromConfig) && fromConfig.length > 0) {
    return fromConfig.filter((v): v is string => typeof v === 'string')
  }
  return fallback
}

function SalesRepScorecard({ metrics }: { metrics: string[] }) {
  return (
    <div className="grid h-full grid-cols-1 gap-3 overflow-y-auto sm:grid-cols-2 lg:grid-cols-4">
      {SALES_REPS.map((rep, repIdx) => (
        <div key={rep} className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
              {rep.charAt(0)}
            </span>
            <p className="truncate text-sm font-semibold text-slate-800">{rep}</p>
          </div>
          <div className="flex flex-col gap-1.5">
            {metrics.map((metric, idx) => (
              <div key={metric} className="flex items-center justify-between text-xs">
                <span className="truncate text-slate-500">{metric}</span>
                <span className="font-medium text-slate-700">{sampleValue(repIdx * 10 + idx)}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function formatMetricValue(value: number): string {
  return Number.isFinite(value) ? value.toLocaleString() : String(value)
}

/** Converts the transformed query result into Elegant scorecard metrics (no trend/delta — real data only). */
function toElegantMetrics(data: ComparatorResultData): ElegantScorecardMetric[] {
  return data.metrics.map(metric => ({
    label: metric.name,
    values: metric.values.map(value => ({ value: formatMetricValue(value) })),
  }))
}

function ComparatorWidgetInner({ widget, loading }: ComparatorWidgetProps) {
  const queryName = resolveWidgetQueryName(widget)
  console.log('[Comparator] query execution request', { widgetId: widget.id, queryName })
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
  })
  const compareAmong = typeof widget.config?.compare_among === 'string' ? widget.config.compare_among : ''
  const chartType = typeof widget.config?.chartType === 'string' ? widget.config.chartType : ''
  const periodType = typeof widget.config?.period_type === 'string' ? widget.config.period_type : ''
  const compareAmongLabelFromConfig = typeof widget.config?.compare_among_label === 'string' ? widget.config.compare_among_label : ''

  console.log('[Comparator] query execution response', { widgetId: widget.id, queryName, doc, parsed })

  // The raw doc may contain the stored report JSON fields (compare_among_label, compare_among, etc.)
  // alongside the query results — use these as a second-tier source when widget config is incomplete.
  const compareAmongLabelFromDoc = typeof doc?.compare_among_label === 'string' ? doc.compare_among_label : ''
  const compareAmongFromDoc = typeof doc?.compare_among === 'string' ? doc.compare_among : ''
  const chartTypeFromDoc = typeof doc?.chart_type === 'string' ? doc.chart_type : ''
  const periodTypeFromDoc = typeof doc?.period_type === 'string' ? doc.period_type : ''

  // Detect time-period mode: config → doc metadata → structural result inspection.
  const configIsTimePeriod =
    compareAmong === 'time_period' ||
    compareAmongFromDoc === 'time_period' ||
    chartType === 'comparator_elegant_time_period' ||
    chartTypeFromDoc === 'comparator_elegant_time_period'
  const isTimePeriod = configIsTimePeriod || isTimePeriodResult(doc, parsed)

  // Best-effort label: widget config → doc metadata → period_type → stable fallback.
  const compareAmongLabel =
    compareAmongLabelFromConfig ||
    compareAmongLabelFromDoc ||
    periodType ||
    periodTypeFromDoc ||
    (isTimePeriod ? 'Current Period' : '')

  const resultData = isTimePeriod ? null : transformComparatorResult(parsed)
  // For time period: read rows directly from the raw doc (PARAMETER_NAME + current_value).
  // Falls back to the ParsedReportGrid path if the doc isn't in a recognised shape.
  const timePeriodData = isTimePeriod
    ? (extractTimePeriodDataFromDoc(doc, compareAmongLabel) ?? transformTimePeriodResult(parsed, compareAmongLabel))
    : null
  const hasData = isTimePeriod ? Boolean(timePeriodData) : Boolean(resultData)

  console.log('[Comparator] render pipeline', {
    widgetId: widget.id,
    queryName,
    chart_type: chartType,
    comparator_style: String(widget.config?.comparator_style ?? ''),
    compare_among: compareAmong,
    compare_among_label: compareAmongLabel,
    configIsTimePeriod,
    isTimePeriod,
    renderer_selected: isTimePeriod ? 'TimePeriodPivotTable' : 'ElegantScorecard',
    timePeriodData,
    resultData,
  })

  // A freshly-saved Comparator's grouped query may still be Pending/Running on the
  // backend — poll a few times (same pattern as ScorecardKpiWidget) until data arrives.
  const pollAttemptsRef = useRef(0)
  const [pollExhausted, setPollExhausted] = useState(false)

  useEffect(() => {
    pollAttemptsRef.current = 0
    setPollExhausted(false)
  }, [queryName])

  useEffect(() => {
    if (!queryName || !isSuccess || hasData || isFetching) return
    if (pollAttemptsRef.current >= MAX_POLL_ATTEMPTS) {
      setPollExhausted(true)
      return
    }
    pollAttemptsRef.current += 1
    const timer = setTimeout(() => {
      void refetch()
    }, POLL_DELAY_MS)
    return () => clearTimeout(timer)
  }, [queryName, isSuccess, hasData, isFetching, refetch])

  const awaitingQuery =
    Boolean(queryName) && !hasData && (queryLoading || isFetching || (isSuccess && !pollExhausted))

  if (loading || awaitingQuery) {
    return (
      <div className="flex h-full animate-pulse flex-col justify-center gap-2 px-4 py-3">
        <div className="h-4 w-32 rounded bg-slate-200" />
        <div className="h-4 w-full rounded bg-slate-200" />
        <div className="h-4 w-full rounded bg-slate-200" />
      </div>
    )
  }

  let body: React.ReactNode
  if (isTimePeriod) {
    if (timePeriodData) {
      body = <TimePeriodPivotTable data={timePeriodData} />
    } else {
      body = <p className="text-xs text-slate-400">{queryName ? 'No data available.' : 'No time period data.'}</p>
    }
  } else if (resultData) {
    body = <ElegantScorecard users={resultData.entities} metrics={toElegantMetrics(resultData)} />
  } else if (queryName) {
    body = <p className="text-xs text-slate-400">No data available.</p>
  } else {
    body = <SalesRepScorecard metrics={readMetricLabels(widget, DEFAULT_SALES_REP_METRICS)} />
  }

  return (
    <div className="flex h-full flex-col overflow-hidden px-4 py-3">
      {body}
    </div>
  )
}

export const ComparatorWidget = memo(ComparatorWidgetInner)
