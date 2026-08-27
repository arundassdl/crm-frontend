'use client'

import { memo, useCallback, useMemo, useState, type RefObject } from 'react'
import {
  ResponsiveGridLayout,
  useContainerWidth,
  verticalCompactor,
  type Layout,
  type LayoutItem,
} from 'react-grid-layout'

import type { DashboardWidget, GridLayoutItem } from '../types'
import { DRAG_MIME } from '../styles/classes'
import { readCatalogDragData } from '../utils/catalogDrag'
import { buildKpiPaletteIndex } from '../utils/kpiPaletteIndex'
import { EmptyCanvasState } from './EmptyCanvasState'
import { WidgetCard } from './WidgetCard'

type DashboardCanvasProps = {
  widgets: DashboardWidget[]
  layout: GridLayoutItem[]
  selectedWidgetId: string | null
  onLayoutChange: (layout: GridLayoutItem[]) => void
  onDropCatalog: (catalogId: string, layoutItem?: Partial<GridLayoutItem>) => void
  onSelectWidget: (id: string | null) => void
  onRemoveWidget: (id: string) => void
  onEditWidget: (id: string) => void
  onFullscreenWidget: (id: string) => void
}

function DashboardCanvasInner({
  widgets,
  layout,
  selectedWidgetId,
  onLayoutChange,
  onDropCatalog,
  onSelectWidget,
  onRemoveWidget,
  onEditWidget,
  onFullscreenWidget,
}: DashboardCanvasProps) {
  const { width, containerRef, mounted } = useContainerWidth({ measureBeforeMount: true })
  const gridContainerRef = containerRef as RefObject<HTMLDivElement>
  const widgetMap = useMemo(() => new Map(widgets.map(w => [w.id, w])), [widgets])
  const kpiPaletteIndex = useMemo(() => buildKpiPaletteIndex(widgets), [widgets])

  /** Live size of the item currently being resized — drives the dimensions badge. */
  const [resizing, setResizing] = useState<{ i: string; w: number; h: number } | null>(null)

  const handleResizeStart = useCallback((_layout: Layout, oldItem: LayoutItem | null, newItem: LayoutItem | null) => {
    const item = newItem ?? oldItem
    if (item) setResizing({ i: item.i, w: item.w, h: item.h })
  }, [])

  const handleResize = useCallback((_layout: Layout, _oldItem: LayoutItem | null, newItem: LayoutItem | null) => {
    if (newItem) setResizing({ i: newItem.i, w: newItem.w, h: newItem.h })
  }, [])

  /** Persist layout only after user drag/resize — not on mount/width/compaction (avoids update loops). */
  const persistLayout = useCallback(
    (newLayout: Layout) => {
      onLayoutChange(newLayout as GridLayoutItem[])
    },
    [onLayoutChange]
  )

  const handleDragStop = useCallback(
    (newLayout: Layout) => {
      persistLayout(newLayout)
    },
    [persistLayout]
  )

  const handleResizeStop = useCallback(
    (newLayout: Layout) => {
      persistLayout(newLayout)
      setResizing(null)
    },
    [persistLayout]
  )

  const handleDrop = useCallback(
    (_layout: Layout, item: LayoutItem | undefined, e: Event) => {
      const payload = readCatalogDragData((e as DragEvent).dataTransfer)
      if (!payload || !item) return
      const gridItem = item as GridLayoutItem
      onDropCatalog(payload.catalogId, {
        ...gridItem,
        w: gridItem.w ?? payload.defaultSize.w,
        h: gridItem.h ?? payload.defaultSize.h,
      })
    },
    [onDropCatalog]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes(DRAG_MIME)) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
    }
  }, [])

  const handleCanvasDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const payload = readCatalogDragData(e.dataTransfer)
      if (!payload) return
      onDropCatalog(payload.catalogId, {
        w: payload.defaultSize.w,
        h: payload.defaultSize.h,
      })
    },
    [onDropCatalog]
  )

  if (widgets.length === 0) {
    return (
      <div
        ref={gridContainerRef}
        className="flex-1 overflow-auto p-4 md:p-6"
        onDragOver={handleDragOver}
        onDrop={handleCanvasDrop}
      >
        <EmptyCanvasState />
      </div>
    )
  }

  return (
    <div
      ref={gridContainerRef}
      className="dashboard-builder-grid min-h-0 flex-1 overflow-auto p-4 md:p-6"
      onDragOver={handleDragOver}
      onDrop={handleCanvasDrop}
    >
      {mounted ? (
        <ResponsiveGridLayout
          className="layout"
          width={width}
          layouts={{ lg: layout }}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 8, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={48}
          margin={[12, 12]}
          containerPadding={[0, 0]}
          compactor={verticalCompactor}
          dragConfig={{
            enabled: true,
            handle: '.widget-header-drag',
            cancel: '.widget-no-drag',
            threshold: 5,
          }}
          resizeConfig={{ enabled: true, handles: ['se', 's', 'e'] }}
          dropConfig={{ enabled: true }}
          onDragStop={handleDragStop}
          onResizeStart={handleResizeStart}
          onResize={handleResize}
          onResizeStop={handleResizeStop}
          onDrop={handleDrop}
          onDropDragOver={e => {
            const payload = readCatalogDragData(e.dataTransfer ?? null)
            return payload
              ? { w: payload.defaultSize.w, h: payload.defaultSize.h }
              : { w: 4, h: 4 }
          }}
        >
          {layout.map(item => {
            const widget = widgetMap.get(item.i)
            if (!widget) return null

            const isResizing = resizing?.i === item.i

            return (
              <div key={item.i} data-grid={item} className="relative h-full">
                <WidgetCard
                  widget={widget}
                  paletteIndex={kpiPaletteIndex.get(widget.id)}
                  selected={selectedWidgetId === widget.id}
                  onSelect={() => onSelectWidget(widget.id)}
                  onRemove={() => onRemoveWidget(widget.id)}
                  onEdit={() => onEditWidget(widget.id)}
                  onFullscreen={() => onFullscreenWidget(widget.id)}
                />
                {isResizing ? (
                  <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-0.5 rounded-md bg-slate-900/85 px-3 py-1.5 text-center text-xs font-medium text-white shadow-lg">
                      <span>Width: {resizing.w} columns</span>
                      <span>Height: {resizing.h} rows</span>
                    </div>
                  </div>
                ) : null}
              </div>
            )
          })}
        </ResponsiveGridLayout>
      ) : (
        <div className="min-h-[240px] animate-pulse rounded-xl bg-white" />
      )}
    </div>
  )
}

export const DashboardCanvas = memo(DashboardCanvasInner)
