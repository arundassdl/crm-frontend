import type { DashboardWidget } from '../types'
import { usesKpiCardLayout } from './usesKpiCardLayout'

/**
 * Position of each count card among the dashboard's other count cards, so a row of them walks
 * the palette in the reference's order (blue → green → orange → pink) instead of each card
 * hashing to a colour on its own and two neighbours landing on the same tint.
 *
 * Taken from the dashboard's widget order rather than grid coordinates, so a card keeps its
 * colour while it is dragged around the canvas. Widgets that don't use the count-card layout
 * are skipped entirely — they never consume a palette slot.
 */
export function buildKpiPaletteIndex(widgets: DashboardWidget[]): Map<string, number> {
  const index = new Map<string, number>()
  let next = 0
  for (const widget of widgets) {
    if (usesKpiCardLayout(widget)) {
      index.set(widget.id, next)
      next += 1
    }
  }
  return index
}
