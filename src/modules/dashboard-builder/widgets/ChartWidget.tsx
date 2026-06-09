'use client'

import dynamic from 'next/dynamic'
import { memo, useMemo } from 'react'

import type { DashboardWidget } from '../types'
import { useInsightsQueryChartData } from '../hooks/useInsightsQueryChartData'
import { buildInsightsChartOption } from '../utils/buildInsightsChartOption'

const ReactECharts = dynamic(() => import('echarts-for-react'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[120px] animate-pulse items-center justify-center rounded bg-slate-50">
      <span className="text-xs text-slate-400">Loading chart…</span>
    </div>
  ),
})

type ChartWidgetProps = {
  widget: DashboardWidget
  loading?: boolean
}

function resolveQueryName(widget: DashboardWidget): string | null {
  const fromConfig = widget.config?.queryName
  if (typeof fromConfig === 'string' && fromConfig.trim()) return fromConfig.trim()
  if (widget.catalogId?.trim()) return widget.catalogId.trim()
  return null
}

function ChartWidgetInner({ widget, loading: loadingProp }: ChartWidgetProps) {
  const queryName = resolveQueryName(widget)
  const useLiveData = Boolean(queryName)

  const {
    option: liveOption,
    isLoading: queryLoading,
    error,
  } = useInsightsQueryChartData({
    queryName,
    chartKind: widget.chartKind,
    title: widget.title,
    properties: widget.properties,
    enabled: useLiveData,
  })

  const fallbackOption = useMemo(
    () => buildInsightsChartOption(widget.chartKind, null, widget.title),
    [widget.chartKind, widget.title]
  )

  const option = useLiveData ? liveOption : fallbackOption
  const loading = loadingProp || (useLiveData && queryLoading)

  const chartOptionKey = useMemo(() => JSON.stringify(option), [option])
  const stableOption = useMemo(() => option, [chartOptionKey])

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

  return (
    <div className="h-full min-h-0 w-full px-2 pb-2 pt-1">
      <ReactECharts
        option={stableOption}
        style={{ height: '100%', width: '100%' }}
        notMerge
        lazyUpdate
        opts={{ renderer: 'canvas' }}
      />
    </div>
  )
}

export const ChartWidget = memo(ChartWidgetInner)
