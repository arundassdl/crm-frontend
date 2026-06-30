import type { DashboardWidget } from '../types'

function normalizeTitle(title: unknown): string {
  return String(title ?? '').trim().toLowerCase()
}

/**
 * Returns `title` unchanged when no widget already uses it; otherwise appends the
 * first free numeric suffix — `Revenue Growth`, `Revenue Growth (1)`, `Revenue Growth (2)`.
 */
export function uniqueWidgetTitle(title: string, widgets: DashboardWidget[]): string {
  const base = title.trim() || 'Untitled'
  const taken = new Set(widgets.map(w => normalizeTitle(w.title)).filter(Boolean))

  if (!taken.has(normalizeTitle(base))) return base

  for (let n = 1; ; n++) {
    const candidate = `${base} (${n})`
    if (!taken.has(normalizeTitle(candidate))) return candidate
  }
}
