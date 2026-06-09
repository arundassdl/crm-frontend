'use client'

import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef } from 'react'

import {
  fetchComponentList,
  fetchReportCollections,
} from '@/services/api/report-addon/component-list-api'
import { readAccessTokenString } from '@/utils/accessTokenDataStorage'

import {
  apiReportComponentToCatalogItem,
  registerApiCatalogItems,
} from '../utils/widgetCatalog'

export const REPORT_COMPONENT_PAGE_SIZE = 20

export const reportComponentKeys = {
  all: ['report-components'] as const,
  collections: () => [...reportComponentKeys.all, 'collections'] as const,
  list: (collection: string, search: string) =>
    [...reportComponentKeys.all, 'list', collection, search] as const,
}

type UseReportComponentsOptions = {
  collection: string
  search?: string
  enabled?: boolean
}

export function useReportCollections(enabled = true) {
  const token = readAccessTokenString()

  return useQuery({
    queryKey: reportComponentKeys.collections(),
    queryFn: async () => {
      if (!token) throw new Error('Not authenticated')
      return fetchReportCollections(token)
    },
    enabled: enabled && Boolean(token),
    staleTime: 5 * 60_000,
  })
}

export function useReportComponents(options: UseReportComponentsOptions) {
  const { collection, search = '', enabled = true } = options
  const token = readAccessTokenString()

  const query = useInfiniteQuery({
    queryKey: reportComponentKeys.list(collection, search),
    queryFn: async ({ pageParam }) => {
      if (!token) {
        throw new Error('Not authenticated')
      }
      return fetchComponentList(token, {
        collection,
        is_report: 1,
        start: pageParam,
        page_length: REPORT_COMPONENT_PAGE_SIZE,
      })
    },
    initialPageParam: 0,
    getNextPageParam: lastPage =>
      lastPage.has_more ? lastPage.start + lastPage.page_length : undefined,
    enabled: enabled && Boolean(token) && Boolean(collection),
  })

  const items = useMemo(() => {
    const rows = query.data?.pages.flatMap(page => page.data) ?? []
    const catalog = rows.map(apiReportComponentToCatalogItem)
    const q = search.trim().toLowerCase()
    if (!q) return catalog
    return catalog.filter(item => item.title.toLowerCase().includes(q))
  }, [query.data, search])

  const itemsRegistryKey = useMemo(() => items.map(i => i.id).join('|'), [items])
  const lastRegistryKeyRef = useRef('')

  useEffect(() => {
    if (!items.length || itemsRegistryKey === lastRegistryKeyRef.current) return
    lastRegistryKeyRef.current = itemsRegistryKey
    registerApiCatalogItems(items)
  }, [items, itemsRegistryKey])

  return {
    items,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage ?? false,
    fetchNextPage: query.fetchNextPage,
    error: query.error,
    refetch: query.refetch,
  }
}
