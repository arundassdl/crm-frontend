'use client'

import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import { fetchInsightsQueryResult } from '@/services/api/report-addon/insights-query-result-api'
import { readAccessTokenString } from '@/utils/accessTokenDataStorage'

import {
  parseInsightsQueryResultTable,
  type ParsedReportGrid,
} from '../utils/parse-insights-query-result'
import type { RuntimeFilterRow } from '../types/componentFilters'

export const insightsQueryResultKeys = {
  all: ['insights-query-result'] as const,
  detail: (name: string, runtimeFilters?: RuntimeFilterRow[]) =>
    runtimeFilters && runtimeFilters.length > 0
      ? ([...insightsQueryResultKeys.all, name, runtimeFilters] as const)
      : ([...insightsQueryResultKeys.all, name] as const),
}

type UseInsightsQueryResultOptions = {
  queryName?: string | null
  enabled?: boolean
  /**
   * Dashboard runtime "Display Component Filters" rows, e.g.
   * `[{ fieldname: "stage", operator: "is", value: "Closed Won" }]`.
   * Applied for this request only — never persisted into the Insights Query.
   */
  runtimeFilters?: RuntimeFilterRow[]
}

export function useInsightsQueryResult({
  queryName,
  enabled = true,
  runtimeFilters,
}: UseInsightsQueryResultOptions) {
  const token = readAccessTokenString()
  const trimmed = queryName?.trim() ?? ''

  const query = useQuery({
    queryKey: insightsQueryResultKeys.detail(trimmed, runtimeFilters),
    queryFn: async ({ signal }) => {
      if (!trimmed) throw new Error('Missing query name')
      if (!token) throw new Error('Not authenticated')
      return fetchInsightsQueryResult({
        name: trimmed,
        token,
        signal,
        runtimeFilters,
      })
    },
    enabled: enabled && Boolean(trimmed) && Boolean(token),
    staleTime: 60_000,
    retry: 1,
  })

  const parsed: ParsedReportGrid | null = useMemo(
    () => (query.data ? parseInsightsQueryResultTable(query.data) : null),
    [query.data]
  )

  return {
    parsed,
    doc: query.data ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isSuccess: query.isSuccess,
    error: query.error,
    refetch: query.refetch,
  }
}
