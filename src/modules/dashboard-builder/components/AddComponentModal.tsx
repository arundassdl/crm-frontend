'use client'

import { memo, useEffect } from 'react'

import type { WidgetCatalogItem } from '../types'
import {
  ADD_COMPONENT_OPTIONS,
  addComponentToCatalogItem,
  type AddComponentOption,
} from '../utils/addComponentCatalog'

type AddComponentModalProps = {
  open: boolean
  onClose: () => void
  onSelect: (item: WidgetCatalogItem) => void
  onSelectChart?: () => void
  onSelectKpi?: () => void
  onSelectGrowthIndexKpi?: () => void
  onSelectComparator?: () => void
}

function AddComponentModalInner({
  open,
  onClose,
  onSelect,
  onSelectChart,
  onSelectKpi,
  onSelectGrowthIndexKpi,
  onSelectComparator,
}: AddComponentModalProps) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  const handlePick = (option: AddComponentOption) => {
    if (option.kind === 'kpi' && onSelectKpi) {
      onClose()
      onSelectKpi()
      return
    }
    if (option.kind === 'kpi-growth-index' && onSelectGrowthIndexKpi) {
      onClose()
      onSelectGrowthIndexKpi()
      return
    }
    if (option.kind === 'chart' && onSelectChart) {
      onClose()
      onSelectChart()
      return
    }
    if (option.kind === 'comparator' && onSelectComparator) {
      onClose()
      onSelectComparator()
      return
    }
    onSelect(addComponentToCatalogItem(option))
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-10"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-component-title"
        className="w-full max-w-[420px] rounded-xl bg-[var(--mui-palette-background-paper)] shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-[var(--mui-palette-divider)] px-5 py-4">
          <h2
            id="add-component-title"
            className="text-lg font-semibold text-[var(--mui-palette-text-primary)]"
          >
            Add Component
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

        <div className="grid grid-cols-2 gap-3 p-5">
          {ADD_COMPONENT_OPTIONS.map(option => (
            <button
              key={option.kind}
              type="button"
              onClick={() => handlePick(option)}
              className="flex items-center gap-3 rounded-lg border border-[var(--mui-palette-divider)] bg-[var(--mui-palette-background-paper)] px-3 py-3 text-left transition hover:border-[var(--mui-palette-primary-main)] hover:bg-[var(--mui-palette-action-hover)]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center text-[var(--mui-palette-text-secondary)]">
                <i
                  className={`${option.icon} text-2xl leading-none ${option.iconClassName ?? ''}`}
                  aria-hidden
                />
              </span>
              <span className="min-w-0 truncate text-sm font-medium text-[var(--mui-palette-text-primary)]">
                {option.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export const AddComponentModal = memo(AddComponentModalInner)
