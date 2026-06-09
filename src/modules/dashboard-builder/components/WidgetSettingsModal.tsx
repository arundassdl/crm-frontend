'use client'

import { memo } from 'react'

import type { DashboardWidget } from '../types'

type WidgetSettingsModalProps = {
  open: boolean
  widget: DashboardWidget | null
  onClose: () => void
  onSave: (widgetId: string, patch: Partial<DashboardWidget>) => void
}

function WidgetSettingsModalInner({ open, widget, onClose, onSave }: WidgetSettingsModalProps) {
  if (!open || !widget) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">Widget settings</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <i className="ri-close-line text-xl" aria-hidden />
          </button>
        </div>
        <form
          className="space-y-3"
          onSubmit={e => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            onSave(widget.id, {
              title: String(fd.get('title') ?? widget.title),
              description: String(fd.get('description') ?? ''),
            })
            onClose()
          }}
        >
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">Title</span>
            <input
              name="title"
              defaultValue={widget.title}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">Description</span>
            <textarea
              name="description"
              defaultValue={widget.description ?? ''}
              rows={3}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white"
            >
              Apply
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export const WidgetSettingsModal = memo(WidgetSettingsModalInner)
