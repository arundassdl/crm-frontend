'use client'

import { useMemo } from 'react'
import type { EChartsOption } from 'echarts'

import type { ChartKind, WidgetProperties } from '../types'
import { buildInsightsChartOption } from '../utils/buildInsightsChartOption'
import { useInsightsQueryResult } from './useInsightsQueryResult'

/** @deprecated Use `insightsQueryResultKeys` from `useInsightsQueryResult`. */
export const insightsQueryChartKeys = {
  all: ['insights-query-result'] as const,
  detail: (name: string) => ['insights-query-result', name] as const,
}

type UseInsightsQueryChartDataOptions = {
  queryName?: string | null
  chartKind?: ChartKind
  title?: string
  properties?: WidgetProperties
  enabled?: boolean
}

export function useInsightsQueryChartData({
  queryName,
  chartKind,
  title = '',
  properties,
  enabled = true,
}: UseInsightsQueryChartDataOptions) {
  const { parsed, isLoading, isFetching, error, refetch } = useInsightsQueryResult({
    queryName: properties?.query ?? queryName,
    enabled,
  })

  const option: EChartsOption = useMemo(
    () => buildInsightsChartOption(chartKind, parsed, properties?.title ?? title, properties),
    [chartKind, parsed, properties, title]
  )

  return {
    option,
    parsed,
    isLoading,
    isFetching,
    error,
    refetch,
  }
}
