'use client'

import { useMemo } from 'react'
import type { EChartsOption } from 'echarts'

import type { ChartKind, WidgetProperties } from '../types'
import type { RuntimeFilterRow } from '../types/componentFilters'
import { buildInsightsChartOption } from '../utils/buildInsightsChartOption'
import { isTemporaryComponentId } from '../utils/resolveWidgetQueryName'
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
  runtimeFilters?: RuntimeFilterRow[]
}

export function useInsightsQueryChartData({
  queryName,
  chartKind,
  title = '',
  properties,
  enabled = true,
  runtimeFilters,
}: UseInsightsQueryChartDataOptions) {
  const propertiesQuery =
    typeof properties?.query === 'string' && !isTemporaryComponentId(properties.query)
      ? properties.query.trim()
      : null

  const { parsed, isLoading, isFetching, error, refetch } = useInsightsQueryResult({
    queryName: queryName?.trim() || propertiesQuery,
    enabled,
    runtimeFilters,
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
