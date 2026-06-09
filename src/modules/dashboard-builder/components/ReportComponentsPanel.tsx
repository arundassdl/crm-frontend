'use client'

import { memo, useEffect, useMemo, useState } from 'react'

import type { WidgetCatalogItem } from '../types'
import { filterAvailableCatalogItems } from '../utils/placedCatalogItems'
import { useReportCollections, useReportComponents } from '../hooks/useReportComponents'
import { DashboardComponentsList } from './DashboardComponentsList'

type ReportComponentsPanelProps = {
  selectedCatalogId?: string | null
  placedCatalogIds?: Set<string>
  enabled?: boolean
  onAddWidget: (item: WidgetCatalogItem) => void
}

function ReportComponentsPanelInner({
  selectedCatalogId,
  placedCatalogIds,
  enabled = true,
  onAddWidget,
}: ReportComponentsPanelProps) {
  const [collection, setCollection] = useState('all')
  const [search, setSearch] = useState('')

  const { data: collections = [{ value: 'all', label: 'All Reports' }], isLoading: collectionsLoading } =
    useReportCollections(enabled)

  useEffect(() => {
    if (collections.length && !collections.some(c => c.value === collection)) {
      setCollection(collections[0].value)
    }
  }, [collection, collections])

  const {
    items,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useReportComponents({
    collection,
    search,
    enabled,
  })

  const availableItems = useMemo(
    () => filterAvailableCatalogItems(items, placedCatalogIds),
    [items, placedCatalogIds]
  )

  return (
    <div className="flex flex-col gap-2 px-1 pb-2 pt-1">
      <div className="relative">
        <select
          value={collection}
          onChange={e => setCollection(e.target.value)}
          disabled={collectionsLoading}
          aria-label="Report collection"
          className="w-full appearance-none rounded-md border border-[var(--mui-palette-divider)] bg-[var(--mui-palette-background-paper)] py-2 pl-3 pr-8 text-sm text-[var(--mui-palette-text-primary)] outline-none focus:border-[var(--mui-palette-primary-main)] disabled:opacity-60"
        >
          {collections.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <i
          className="ri-arrow-down-s-line pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-base text-[var(--mui-palette-text-secondary)]"
          aria-hidden
        />
      </div>

      <div className="relative">
        <i
          className="ri-search-line pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-[var(--mui-palette-text-secondary)]"
          aria-hidden
        />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search"
          className="w-full rounded-md border border-[var(--mui-palette-divider)] bg-[var(--mui-palette-background-paper)] py-2 pl-8 pr-3 text-sm text-[var(--mui-palette-text-primary)] outline-none placeholder:text-[var(--mui-palette-text-secondary)] focus:border-[var(--mui-palette-primary-main)]"
        />
      </div>

      <DashboardComponentsList
        items={availableItems}
        selectedCatalogId={selectedCatalogId}
        isLoading={isLoading}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
        onLoadMore={() => fetchNextPage()}
        onAddWidget={onAddWidget}
        emptyMessage={
          items.length > 0 && availableItems.length === 0
            ? 'All reports are on the canvas'
            : 'No reports found'
        }
      />
    </div>
  )
}

export const ReportComponentsPanel = memo(ReportComponentsPanelInner)
