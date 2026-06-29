'use client'

import { memo, useEffect, useMemo, useRef, useState } from 'react'

export type GroupedReportOption = {
  value: string
  label: string
  group: string
}

type Props = {
  options: GroupedReportOption[]
  value: string
  onChange: (value: string) => void
  loading?: boolean
  disabled?: boolean
  error?: boolean
  placeholder?: string
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim()
}

function GroupedReportSelectInner({
  options,
  value,
  onChange,
  loading = false,
  disabled = false,
  error = false,
  placeholder = 'Select a report',
}: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const selectedLabel = options.find(o => o.value === value)?.label ?? ''

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  // Focus search when opening
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 0)
    }
  }, [open])

  const filtered = useMemo(() => {
    const q = normalize(search)
    if (!q) return options
    return options.filter(o => normalize(o.label).includes(q) || normalize(o.group).includes(q))
  }, [options, search])

  // Group filtered options preserving insertion order of groups
  const groups = useMemo(() => {
    const map = new Map<string, GroupedReportOption[]>()
    for (const opt of filtered) {
      const g = opt.group || 'General Reports'
      if (!map.has(g)) map.set(g, [])
      map.get(g)!.push(opt)
    }
    return Array.from(map.entries())
  }, [filtered])

  const handleSelect = (v: string) => {
    onChange(v)
    setOpen(false)
    setSearch('')
  }

  const triggerBorderClass = error
    ? 'border-red-500 hover:border-red-500 focus-within:ring-red-400/30'
    : 'border-[var(--mui-palette-divider)] hover:border-[var(--mui-palette-text-secondary)] focus-within:border-[var(--mui-palette-primary-main)] focus-within:ring-[var(--mui-palette-primary-main)]/20'

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => {
          if (!disabled && !loading) setOpen(prev => !prev)
        }}
        className={[
          'flex h-9 w-full items-center justify-between rounded border px-3 text-sm transition',
          'bg-[var(--mui-palette-background-paper)] text-left outline-none',
          'ring-0 focus-within:ring-2',
          triggerBorderClass,
          disabled || loading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        ].join(' ')}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={selectedLabel ? 'text-[var(--mui-palette-text-primary)]' : 'text-[var(--mui-palette-text-secondary)]'}>
          {loading
            ? 'Loading reports…'
            : selectedLabel || placeholder}
        </span>
        <i
          className={`ri-arrow-down-s-line text-lg text-[var(--mui-palette-text-secondary)] transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-full z-[200] mt-1 w-full min-w-[240px] rounded-md border border-[var(--mui-palette-divider)] bg-[var(--mui-palette-background-paper)] shadow-lg"
          style={{ maxHeight: 320, display: 'flex', flexDirection: 'column' }}
        >
          {/* Search */}
          <div className="border-b border-[var(--mui-palette-divider)] px-2 py-1.5">
            <div className="flex items-center gap-1.5 rounded border border-[var(--mui-palette-divider)] bg-[var(--mui-palette-background-default)] px-2 py-1">
              <i className="ri-search-line shrink-0 text-sm text-[var(--mui-palette-text-secondary)]" aria-hidden />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search…"
                className="w-full bg-transparent text-sm text-[var(--mui-palette-text-primary)] outline-none placeholder:text-[var(--mui-palette-text-secondary)]"
              />
              {search && (
                <button type="button" onClick={() => setSearch('')} className="shrink-0 text-[var(--mui-palette-text-secondary)] hover:text-[var(--mui-palette-text-primary)]">
                  <i className="ri-close-line text-sm" aria-hidden />
                </button>
              )}
            </div>
          </div>

          {/* Options list */}
          <div className="overflow-y-auto" style={{ flex: 1 }}>
            {groups.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-[var(--mui-palette-text-secondary)]">
                No reports found
              </p>
            ) : (
              groups.map(([group, items]) => (
                <div key={group}>
                  {/* Group header */}
                  <div className="sticky top-0 bg-[var(--mui-palette-background-paper)] px-3 pb-0.5 pt-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--mui-palette-text-secondary)]">
                      {group}
                    </span>
                  </div>
                  {/* Items */}
                  {items.map(opt => {
                    const isSelected = opt.value === value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleSelect(opt.value)}
                        className={[
                          'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition',
                          isSelected
                            ? 'bg-[var(--mui-palette-primary-main)]/8 text-[var(--mui-palette-primary-main)]'
                            : 'text-[var(--mui-palette-text-primary)] hover:bg-[var(--mui-palette-action-hover)]',
                        ].join(' ')}
                      >
                        {isSelected ? (
                          <i className="ri-check-line shrink-0 text-base text-[var(--mui-palette-primary-main)]" aria-hidden />
                        ) : (
                          <span className="w-4 shrink-0" aria-hidden />
                        )}
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export const GroupedReportSelect = memo(GroupedReportSelectInner)
