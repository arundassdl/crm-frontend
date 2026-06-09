'use client'

import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import { fetchInsightsQueryResult } from '@/services/api/report-addon/insights-query-result-api'
import { readAccessTokenString } from '@/utils/accessTokenDataStorage'

import {
  parseInsightsQueryResultTable,
  type ParsedReportGrid,
} from '../utils/parse-insights-query-result'

export const insightsQueryResultKeys = {
  all: ['insights-query-result'] as const,
  detail: (name: string) => [...insightsQueryResultKeys.all, name] as const,
}

type UseInsightsQueryResultOptions = {
  queryName?: string | null
  enabled?: boolean
}

export function useInsightsQueryResult({
  queryName,
  enabled = true,
}: UseInsightsQueryResultOptions) {
  const token = readAccessTokenString()
  const trimmed = queryName?.trim() ?? ''

  const query = useQuery({
    queryKey: insightsQueryResultKeys.detail(trimmed),
    queryFn: async ({ signal }) => {
      if (!trimmed) throw new Error('Missing query name')
      if (!token) throw new Error('Not authenticated')
      return fetchInsightsQueryResult({
        name: trimmed,
        token,
        signal,
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
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isSuccess: query.isSuccess,
    error: query.error,
    refetch: query.refetch,
  }
}
