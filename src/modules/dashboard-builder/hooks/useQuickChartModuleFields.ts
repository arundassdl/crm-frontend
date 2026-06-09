'use client'

import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import {
  fetchReportFields,
  type ReportFormFieldCatalogEntry,
} from '@/services/api/report-addon/report-fields-api'
import {
  readAccessTokenString,
  readRoleProfileFromStorage,
} from '@/utils/accessTokenDataStorage'

import {
  buildAggregateOptions,
  type AggregateOption,
} from '../utils/buildAggregateOptions'
import {
  buildGroupingOptions,
  type GroupingOption,
} from '../utils/buildGroupingOptions'

export const quickChartModuleFieldsKeys = {
  all: ['quick-chart-module-fields'] as const,
  forModules: (moduleKeys: string) =>
    [...quickChartModuleFieldsKeys.all, moduleKeys] as const,
}

export type QuickChartModuleRef = {
  value: string
  label: string
}

type CatalogByModule = Record<string, ReportFormFieldCatalogEntry[]>
type LayoutByModule = Record<string, string>

const EMPTY_CATALOG: CatalogByModule = {}
const EMPTY_LAYOUT: LayoutByModule = {}

type UseQuickChartModuleFieldsArgs = {
  moduleOrder: QuickChartModuleRef[]
  enabled?: boolean
}

async function fetchCatalogsForModules(
  token: string,
  moduleOrder: QuickChartModuleRef[],
  roleProfile: string
): Promise<{
  catalogByModule: CatalogByModule
  layoutByModule: LayoutByModule
  picklistModuleByModule: LayoutByModule
}> {
  const catalogByModule: CatalogByModule = {}
  const layoutByModule: LayoutByModule = {}
  const picklistModuleByModule: LayoutByModule = {}
  await Promise.all(
    moduleOrder.map(async mod => {
      const result = await fetchReportFields(token, {
        module: mod.label.trim() || mod.value,
        role_profile: roleProfile,
      })
      catalogByModule[mod.value] = result.catalog
      if (result.layoutName) {
        layoutByModule[mod.value] = result.layoutName
        const labelKey = mod.label.trim()
        if (labelKey) layoutByModule[labelKey] = result.layoutName
      }
      const picklistMod = result.moduleName ?? (mod.label.trim() || mod.value)
      if (picklistMod) {
        picklistModuleByModule[mod.value] = picklistMod
        const labelKey = mod.label.trim()
        if (labelKey) picklistModuleByModule[labelKey] = picklistMod
      }
    })
  )
  return { catalogByModule, layoutByModule, picklistModuleByModule }
}

export function useQuickChartModuleFields({
  moduleOrder,
  enabled = true,
}: UseQuickChartModuleFieldsArgs) {
  const token = readAccessTokenString()
  const roleProfile = readRoleProfileFromStorage()

  const moduleKeys = moduleOrder
    .map(m => `${m.value}|${m.label}`)
    .join(',')

  const query = useQuery({
    queryKey: quickChartModuleFieldsKeys.forModules(moduleKeys),
    queryFn: async () => {
      if (!token) throw new Error('Not authenticated')
      if (moduleOrder.length === 0) {
        return {
          catalogByModule: {} as CatalogByModule,
          layoutByModule: {} as LayoutByModule,
          picklistModuleByModule: {} as LayoutByModule,
        }
      }
      return fetchCatalogsForModules(token, moduleOrder, roleProfile)
    },
    enabled: enabled && Boolean(token) && moduleOrder.length > 0,
    staleTime: 60_000,
  })

  const catalogByModule = query.data?.catalogByModule ?? EMPTY_CATALOG
  const layoutByModule = query.data?.layoutByModule ?? EMPTY_LAYOUT
  const picklistModuleByModule = query.data?.picklistModuleByModule ?? EMPTY_LAYOUT

  const aggregateOptions = useMemo(
    () => buildAggregateOptions(moduleOrder, catalogByModule),
    [catalogByModule, moduleOrder]
  )

  const groupingOptions = useMemo(
    () => buildGroupingOptions(moduleOrder, catalogByModule),
    [catalogByModule, moduleOrder]
  )

  const aggregateOptionsById = useMemo(() => {
    const map = new Map<string, AggregateOption>()
    for (const opt of aggregateOptions) {
      map.set(opt.id, opt)
    }
    return map
  }, [aggregateOptions])

  const groupingOptionsById = useMemo(() => {
    const map = new Map<string, GroupingOption>()
    for (const opt of groupingOptions) {
      map.set(opt.id, opt)
    }
    return map
  }, [groupingOptions])

  return {
    catalogByModule,
    layoutByModule,
    picklistModuleByModule,
    aggregateOptions,
    aggregateOptionsById,
    groupingOptions,
    groupingOptionsById,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
  }
}

/** @deprecated Use `useQuickChartModuleFields` */
export function useQuickChartAggregateOptions(args: UseQuickChartModuleFieldsArgs) {
  const result = useQuickChartModuleFields(args)
  return {
    options: result.aggregateOptions,
    optionsById: result.aggregateOptionsById,
    isLoading: result.isLoading,
    isFetching: result.isFetching,
    error: result.error,
  }
}
