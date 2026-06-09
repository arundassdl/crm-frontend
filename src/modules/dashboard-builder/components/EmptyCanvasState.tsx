'use client'

import { memo } from 'react'

type EmptyCanvasStateProps = {
  onBrowseWidgets?: () => void
}

function EmptyCanvasStateInner({ onBrowseWidgets }: EmptyCanvasStateProps) {
  return (
    <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white/60 px-6 py-12 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
        <i className="ri-layout-grid-line text-2xl" aria-hidden />
      </div>
      <h3 className="text-lg font-semibold text-slate-800">Build your dashboard</h3>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        Drag widgets from the left sidebar onto this canvas, or click a widget to add it.
      </p>
      {onBrowseWidgets ? (
        <button
          type="button"
          onClick={onBrowseWidgets}
          className="mt-5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          Browse widgets
        </button>
      ) : null}
    </div>
  )
}

export const EmptyCanvasState = memo(EmptyCanvasStateInner)
