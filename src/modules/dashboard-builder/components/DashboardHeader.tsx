'use client'

import { memo } from 'react'

type DashboardHeaderProps = {
  title: string
  description: string
  saving?: boolean
  canUndo?: boolean
  canRedo?: boolean
  onTitleChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onSave: () => void
  onCancel: () => void
  onUndo?: () => void
  onRedo?: () => void
  onToggleSidebar?: () => void
}

function DashboardHeaderInner({
  title,
  description,
  saving,
  canUndo,
  canRedo,
  onTitleChange,
  onDescriptionChange,
  onSave,
  onCancel,
  onUndo,
  onRedo,
  onToggleSidebar,
}: DashboardHeaderProps) {
  return (
    <header className="flex shrink-0 flex-wrap items-start gap-3 border-b border-slate-200 bg-white px-4 py-3 md:px-5">
      <button
        type="button"
        className="mr-1 inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 lg:hidden"
        onClick={onToggleSidebar}
        aria-label="Toggle widget sidebar"
      >
        <i className="ri-menu-line text-lg" aria-hidden />
      </button>

      <div className="min-w-0 flex-1">
        <input
          value={title}
          onChange={e => onTitleChange(e.target.value)}
          placeholder="Dashboard title"
          className="w-full max-w-xl border-0 bg-transparent text-lg font-semibold text-slate-900 outline-none placeholder:text-slate-400"
        />
        <input
          value={description}
          onChange={e => onDescriptionChange(e.target.value)}
          placeholder="Add a short description"
          className="mt-0.5 w-full max-w-2xl border-0 bg-transparent text-sm text-slate-500 outline-none placeholder:text-slate-400"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={!canUndo}
          onClick={onUndo}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          title="Undo"
        >
          <i className="ri-arrow-go-back-line" aria-hidden />
        </button>
        <button
          type="button"
          disabled={!canRedo}
          onClick={onRedo}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          title="Redo"
        >
          <i className="ri-arrow-go-forward-line" aria-hidden />
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
          title="More options"
        >
          <i className="ri-more-2-fill" aria-hidden />
        </button>
      </div>
    </header>
  )
}

export const DashboardHeader = memo(DashboardHeaderInner)
