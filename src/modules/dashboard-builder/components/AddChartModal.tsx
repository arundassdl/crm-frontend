'use client'

import { memo, useEffect, type ReactNode } from 'react'

export type ChartAddSource = 'quick' | 'reports'

type AddChartModalProps = {
  open: boolean
  onClose: () => void
  onSelect: (source: ChartAddSource) => void
}

const CHART_OPTIONS: {
  source: ChartAddSource
  title: string
  subtitle: string
  icon: ReactNode
}[] = [
  {
    source: 'quick',
    title: 'Quick chart',
    subtitle: 'Create charts instantly',
    icon: (
      <span className="relative inline-flex h-14 w-14 items-end justify-center gap-0.5 text-[var(--mui-palette-text-disabled)]">
        <span className="h-5 w-2 rounded-sm bg-current opacity-80" />
        <span className="h-8 w-2 rounded-sm bg-current" />
        <span className="relative h-6 w-2 rounded-sm bg-current opacity-90">
          <i
            className="ri-flashlight-fill absolute -bottom-1 left-1/2 -translate-x-1/2 text-sm text-[var(--mui-palette-text-secondary)]"
            aria-hidden
          />
        </span>
      </span>
    ),
  },
  {
    source: 'reports',
    title: 'From Reports',
    subtitle: 'Get from existing reports',
    icon: (
      <span className="relative inline-flex h-14 w-14 flex-col items-center justify-center text-[var(--mui-palette-text-disabled)]">
        <i
          className="ri-arrow-down-s-fill absolute -top-0.5 text-lg text-[var(--mui-palette-text-secondary)]"
          aria-hidden
        />
        <span className="mt-2 grid h-9 w-11 grid-cols-3 gap-0.5 rounded border border-current p-1">
          {Array.from({ length: 9 }).map((_, i) => (
            <span key={i} className="rounded-[1px] bg-current opacity-70" />
          ))}
        </span>
      </span>
    ),
  },
]

function AddChartModalInner({ open, onClose, onSelect }: AddChartModalProps) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[110] flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-10"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-chart-title"
        className="w-full max-w-[560px] rounded-xl bg-[var(--mui-palette-background-paper)] shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-[var(--mui-palette-divider)] px-5 py-4">
          <h2
            id="add-chart-title"
            className="text-lg font-semibold text-[var(--mui-palette-text-primary)]"
          >
            Add Chart
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--mui-palette-text-secondary)] transition hover:bg-[var(--mui-palette-action-hover)] hover:text-[var(--mui-palette-text-primary)]"
          >
            <i className="ri-close-line text-xl" aria-hidden />
          </button>
        </header>

        <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
          {CHART_OPTIONS.map(option => (
            <button
              key={option.source}
              type="button"
              onClick={() => {
                onSelect(option.source)
                onClose()
              }}
              className="flex min-h-[168px] flex-col items-center justify-center rounded-lg border border-[var(--mui-palette-divider)] bg-[var(--mui-palette-background-paper)] px-4 py-6 text-center transition hover:border-[var(--mui-palette-primary-main)] hover:bg-[var(--mui-palette-action-hover)]"
            >
              <span className="mb-4 flex items-center justify-center">{option.icon}</span>
              <span className="text-sm font-semibold text-[var(--mui-palette-text-primary)]">
                {option.title}
              </span>
              <span className="mt-1 text-xs text-[var(--mui-palette-text-secondary)]">
                {option.subtitle}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export const AddChartModal = memo(AddChartModalInner)
