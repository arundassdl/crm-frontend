'use client'

import { memo } from 'react'

import type { DashboardWidget } from '../types'
import { widgetCardClass, widgetHeaderClass } from '../styles/classes'
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
  return (
    <div
      className={`${widgetCardClass} h-full ${!readOnly && selected ? 'ring-2 ring-blue-500/70' : ''}`}
      onClick={readOnly ? undefined : onSelect}
      role={readOnly ? undefined : 'presentation'}
    >
      <div className={widgetHeaderClass}>
        <span className="truncate text-sm font-semibold text-slate-800">{widget.title}</span>
        {!readOnly ? (
          <WidgetToolbar
            onRefresh={onRefresh}
            onFullscreen={onFullscreen}
            onEdit={onEdit}
            onRemove={onRemove}
          />
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <WidgetRenderer widget={widget} loading={loading} />
      </div>
    </div>
  )
}

export const WidgetCard = memo(WidgetCardInner)
