'use client'

import { memo } from 'react'

type WidgetToolbarProps = {
  onRefresh?: () => void
  onFullscreen?: () => void
  onEdit?: () => void
  onRemove?: () => void
  compact?: boolean
}

function WidgetToolbarInner({
  onRefresh,
  onFullscreen,
  onEdit,
  onRemove,
  compact,
}: WidgetToolbarProps) {
  const btn =
    'inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700'

  return (
    // `widget-no-drag` keeps these actions from starting a layout drag.
    <div className={`widget-no-drag flex items-center gap-0.5 ${compact ? '' : 'ml-auto'}`}>
      <button type="button" className={btn} title="Refresh" aria-label="Refresh" onClick={onRefresh}>
        <i className="ri-refresh-line text-sm" aria-hidden />
      </button>
      <button type="button" className={btn} title="Expand" aria-label="Expand" onClick={onFullscreen}>
        <i className="ri-fullscreen-line text-sm" aria-hidden />
      </button>
      <button type="button" className={btn} title="Edit" aria-label="Edit" onClick={onEdit}>
        <i className="ri-edit-line text-sm" aria-hidden />
      </button>
      <button
        type="button"
        className={`${btn} hover:bg-red-50 hover:text-red-600`}
        title="Delete"
        aria-label="Delete"
        onClick={onRemove}
      >
        <i className="ri-delete-bin-line text-sm" aria-hidden />
      </button>
    </div>
  )
}

export const WidgetToolbar = memo(WidgetToolbarInner)
