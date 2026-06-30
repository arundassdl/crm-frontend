'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import { fetchReportFields } from '@/services/api/report-addon/report-fields-api'
import type { ReportFormFieldCatalogEntry } from '@/services/api/report-addon/report-fields-api'
import type { ReportTableRef, ReportJoin } from '@/services/api/report-addon/report-for-chart-api'
import { flattenCatalogFields } from '../utils/report-filters/flatten-catalog-fields'
import type { FlatFieldOption } from '../utils/report-filters/flatten-catalog-fields'
import { readAccessTokenString } from '@/utils/accessTokenDataStorage'

type UseReportChartFilterFieldsOptions = {
  table: ReportTableRef | null
  joins: ReportJoin[]
  enabled: boolean
}

type ModuleResult = { module: string; catalog: ReportFormFieldCatalogEntry[] }

export function useReportChartFilterFields({
  table,
  joins,
  enabled,
}: UseReportChartFilterFieldsOptions): {
  flatFieldOptions: FlatFieldOption[]
  filterFieldsLoading: boolean
} {
  const token = readAccessTokenString()

  // Deduplicated ordered list of module labels: primary table first, then each join's to_label
  const modules = useMemo(() => {
    const seen = new Set<string>()
    const candidates = [
      table?.label ?? '',
      ...joins.map(j => j.to_label),
    ]
    return candidates
      .map(m => m.trim())
      .filter(m => {
        if (!m || seen.has(m)) return false
        seen.add(m)
        return true
      })
  }, [table, joins])

  const { data: moduleResults, isLoading } = useQuery<ModuleResult[]>({
    queryKey: ['report-chart-filter-fields', ...modules],
    queryFn: async () => {
      if (!token) throw new Error('Not authenticated')
      return Promise.all(
        modules.map(module =>
          fetchReportFields(token, { module }).then(r => ({ module, catalog: r.catalog }))
        )
      )
    },
    enabled: enabled && Boolean(token) && modules.length > 0,
    staleTime: 5 * 60_000,
  })

  const flatFieldOptions: FlatFieldOption[] = useMemo(() => {
    if (!moduleResults?.length) return []
    const moduleOrder: { value: string; label: string }[] = []
    const catalogByModule: Record<string, ReportFormFieldCatalogEntry[]> = {}
    for (const { module, catalog } of moduleResults) {
      const value = module.toLowerCase()
      moduleOrder.push({ value, label: module })
      catalogByModule[value] = catalog
    }
    return flattenCatalogFields(moduleOrder, catalogByModule)
  }, [moduleResults])

  return { flatFieldOptions, filterFieldsLoading: isLoading }
}
