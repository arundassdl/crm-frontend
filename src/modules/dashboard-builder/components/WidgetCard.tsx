'use client'

import { memo, useState } from 'react'

import type { DashboardWidget } from '../types'
import type { RuntimeFilterRow } from '../types/componentFilters'
import { widgetCardClass, widgetHeaderClass } from '../styles/classes'
import { ComponentFiltersButton, readComponentFilters } from './ComponentFiltersControl'
import { WidgetRenderer } from './WidgetRenderer'
import { WidgetToolbar } from './WidgetToolbar'

type WidgetCardProps = {
  widget: DashboardWidget
  selected?: boolean
  loading?: boolean
  readOnly?: boolean
  onSelect?: () => void
  onRefresh?: () => void
  onFullscreen?: () => void
  onEdit?: () => void
  onRemove?: () => void
}

function WidgetCardInner({
  widget,
  selected,
  loading,
  readOnly = false,
  onSelect,
  onRefresh,
  onFullscreen,
  onEdit,
  onRemove,
}: WidgetCardProps) {
  const [runtimeFilters, setRuntimeFilters] = useState<RuntimeFilterRow[]>([])
  const componentFilterFields = readComponentFilters(widget)

  return (
    <div
      className={`${widgetCardClass} group h-full ${!readOnly && selected ? 'ring-2 ring-blue-500/70' : ''}`}
      onClick={readOnly ? undefined : onSelect}
      role={readOnly ? undefined : 'presentation'}
    >
      <div
        className={`${widgetHeaderClass}${
          readOnly ? '' : ' widget-header-drag cursor-grab active:cursor-grabbing'
        }`}
      >
        {!readOnly ? (
          <span
            className="widget-drag-grip -ml-0.5 flex h-6 w-4 shrink-0 items-center justify-center text-slate-300 dark:text-zinc-700 transition-colors group-hover:text-slate-500 dark:group-hover:text-zinc-400"
            aria-hidden
            title="Drag to move"
          >
            <i className="ri-draggable text-base leading-none" />
          </span>
        ) : null}
        <span className="truncate font-heading text-[11.5px] font-semibold uppercase tracking-[0.1em] text-[#4A5675] dark:text-[#94A3B8]">
          {widget.title}
        </span>
        <div className="widget-no-drag ml-auto flex items-center gap-1">
          {componentFilterFields.length > 0 ? (
            <ComponentFiltersButton
              fields={componentFilterFields}
              values={runtimeFilters}
              onApply={setRuntimeFilters}
            />
          ) : null}
          {!readOnly ? (
            <WidgetToolbar
              compact
              onRefresh={onRefresh}
              onFullscreen={onFullscreen}
              onEdit={onEdit}
              onRemove={onRemove}
            />
          ) : null}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <WidgetRenderer widget={widget} loading={loading} runtimeFilters={runtimeFilters} />
      </div>
    </div>
  )
}

export const WidgetCard = memo(WidgetCardInner)
