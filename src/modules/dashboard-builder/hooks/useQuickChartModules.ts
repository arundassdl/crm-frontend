'use client'

import { useQuery } from '@tanstack/react-query'

import {
  fetchModuleListing,
  type ModuleListingOption,
} from '@/services/api/sdl-metadata/modules-api'
import type { RelatedModuleOption } from '@/services/api/report-addon/related-module-api'
import { fetchRelatedModules } from '@/services/api/report-addon/related-module-api'
import {
  readAccessTokenString,
  readRoleProfileFromStorage,
} from '@/utils/accessTokenDataStorage'

export const EMPTY_MODULE_LIST: ModuleListingOption[] = []
export const EMPTY_RELATED_MODULE_LIST: RelatedModuleOption[] = []

export const quickChartModuleKeys = {
  all: ['quick-chart-modules'] as const,
  listing: () => [...quickChartModuleKeys.all, 'listing'] as const,
  related: (modulename: string) =>
    [...quickChartModuleKeys.all, 'related', modulename] as const,
}

export function useQuickChartModuleListing(enabled = true) {
  const token = readAccessTokenString()

  return useQuery({
    queryKey: quickChartModuleKeys.listing(),
    queryFn: async () => {
      if (!token) throw new Error('Not authenticated')
      return fetchModuleListing(token)
    },
    enabled: enabled && Boolean(token),
    staleTime: 5 * 60_000,
  })
}

export function useQuickChartRelatedModules(modulename: string, enabled = true) {
  const token = readAccessTokenString()
  const rolename = readRoleProfileFromStorage()
  const trimmed = modulename.trim()

  return useQuery({
    queryKey: quickChartModuleKeys.related(trimmed),
    queryFn: async () => {
      if (!token) throw new Error('Not authenticated')
      return fetchRelatedModules(token, { modulename: trimmed, rolename })
    },
    enabled: enabled && Boolean(token) && Boolean(trimmed),
    staleTime: 60_000,
  })
}
