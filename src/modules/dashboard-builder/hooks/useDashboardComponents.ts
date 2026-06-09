'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef } from 'react'

import { fetchComponentList } from '@/services/api/report-addon/component-list-api'
import { readAccessTokenString } from '@/utils/accessTokenDataStorage'

import {
  apiComponentToCatalogItem,
  registerApiCatalogItems,
} from '../utils/widgetCatalog'
import type { WidgetCatalogItem } from '../types'

export const DASHBOARD_COMPONENT_PAGE_SIZE = 20

export const dashboardComponentKeys = {
  all: ['dashboard-components'] as const,
  list: (search: string) => [...dashboardComponentKeys.all, search] as const,
}

type UseDashboardComponentsOptions = {
  search?: string
  enabled?: boolean
}

export function useDashboardComponents(options: UseDashboardComponentsOptions = {}) {
  const { search = '', enabled = true } = options
  const token = readAccessTokenString()

  const query = useInfiniteQuery({
    queryKey: dashboardComponentKeys.list(search),
    queryFn: async ({ pageParam }) => {
      if (!token) {
        throw new Error('Not authenticated')
      }
      return fetchComponentList(token, {
        collection: 'all',
        is_report: 0,
        start: pageParam,
        page_length: DASHBOARD_COMPONENT_PAGE_SIZE,
      })
    },
    initialPageParam: 0,
    getNextPageParam: lastPage =>
      lastPage.has_more ? lastPage.start + lastPage.page_length : undefined,
    enabled: enabled && Boolean(token),
  })

  const items = useMemo(() => {
    const rows = query.data?.pages.flatMap(page => page.data) ?? []
    const catalog = rows.map(apiComponentToCatalogItem)
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

export type DashboardComponentsState = {
  items: WidgetCatalogItem[]
  isLoading: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  fetchNextPage: () => void
}
