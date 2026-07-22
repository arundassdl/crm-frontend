'use client'

import { memo, useCallback, useEffect, useRef } from 'react'
import {
  ChartBar,
  ChartPie,
  ChartLineUp,
  Table as TableIcon,
  SquaresFour,
} from '@phosphor-icons/react'

import type { WidgetCatalogItem } from '../types'
import { setCatalogDragData } from '../utils/catalogDrag'

/** UI-only: leading icon + accent colour derived from the catalog item's existing type/chartKind. */
function itemVisual(item: WidgetCatalogItem): { Icon: React.ElementType; accent: string } {
  const t = `${item.type ?? ''} ${item.chartKind ?? ''}`.toLowerCase()
  if (t.includes('pie') || t.includes('donut')) return { Icon: ChartPie, accent: '#8B5CF6' }
  if (t.includes('table') || t.includes('pivot')) return { Icon: TableIcon, accent: '#10B981' }
  if (t.includes('line') || t.includes('area')) return { Icon: ChartLineUp, accent: '#06B6D4' }
  if (t.includes('bar') || t.includes('column') || t.includes('chart')) return { Icon: ChartBar, accent: '#06B6D4' }
  return { Icon: SquaresFour, accent: '#1D4ED8' }
}

type DashboardComponentsListProps = {
  items: WidgetCatalogItem[]
  selectedCatalogId?: string | null
  isLoading?: boolean
  isFetchingNextPage?: boolean
  hasNextPage?: boolean
  onLoadMore?: () => void
  onAddWidget: (item: WidgetCatalogItem) => void
  emptyMessage?: string
}

function DashboardComponentsListInner({
  items,
  selectedCatalogId,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  onLoadMore,
  onAddWidget,
  emptyMessage = 'No components found',
}: DashboardComponentsListProps) {
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const handleDragStart = (e: React.DragEvent, item: WidgetCatalogItem) => {
    setCatalogDragData(e, item)
  }

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      onLoadMore?.()
    }
  }, [hasNextPage, isFetchingNextPage, onLoadMore])

  useEffect(() => {
    const node = sentinelRef.current
    if (!node || !hasNextPage) return

    const scrollRoot =
      node.closest('[data-dashboard-sidebar-scroll]') ??
      node.parentElement?.parentElement ??
      null

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) {
          loadMore()
        }
      },
      { root: scrollRoot, rootMargin: '80px', threshold: 0 }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [hasNextPage, loadMore, items.length])

  if (isLoading && items.length === 0) {
    return (
      <div className="space-y-1.5 px-1 pb-2 pt-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-9 animate-pulse rounded-lg border border-[var(--mui-palette-divider)] bg-[var(--mui-palette-action-hover)]"
          />
        ))}
      </div>
    )
  }

  if (!isLoading && items.length === 0) {
    return (
      <p className="px-2 py-3 text-center text-xs text-[var(--mui-palette-text-secondary)]">
        {emptyMessage}
      </p>
    )
  }

  return (
    <div className="space-y-1.5 px-1 pb-2 pt-1">
      {items.map(item => {
        const active = selectedCatalogId === item.id
        const { Icon, accent } = itemVisual(item)
        return (
          <div key={item.id}>
            <button
              type="button"
              draggable
              onDragStart={e => handleDragStart(e, item)}
              onClick={() => onAddWidget(item)}
              title="Drag to canvas or click to add"
              className={`group/item flex w-full cursor-grab items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition active:cursor-grabbing ${
                active
                  ? 'border-[var(--mui-palette-primary-main)] bg-[var(--mui-palette-primary-lightOpacity)]'
                  : 'border-[var(--mui-palette-divider)] bg-[var(--mui-palette-background-paper)] hover:border-[var(--mui-palette-primary-main)] hover:bg-[var(--mui-palette-action-hover)]'
              }`}
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${accent}18` }}
                aria-hidden
              >
                <Icon size={15} color={accent} weight="duotone" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[14px] font-semibold text-[var(--mui-palette-text-primary)]">
                  {item.title}
                </span>
                {item.description ? (
                  <span className="truncate text-[12px] text-[var(--mui-palette-text-secondary)]">
                    {item.description}
                  </span>
                ) : null}
              </span>
            </button>
          </div>
        )
      })}
      {hasNextPage ? (
        <div ref={sentinelRef} className="flex justify-center py-2">
          {isFetchingNextPage ? (
            <span className="text-xs text-[var(--mui-palette-text-secondary)]">Loading more…</span>
          ) : (
            <span className="h-1 w-1" aria-hidden />
          )}
        </div>
      ) : null}
    </div>
  )
}

export const DashboardComponentsList = memo(DashboardComponentsListInner)
