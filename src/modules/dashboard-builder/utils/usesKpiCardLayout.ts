import type { DashboardWidget } from '../types'
import { resolveKpiStyle } from './resolveKpiStyle'
import { findCatalogItem } from './widgetCatalog'

/** KPI styles that render as a reference count card. Everything except the list-shaped
 *  styles (`scorecard`, `rankings`), which have their own renderers. */
const CARD_KPI_STYLES = new Set(['basic', 'growth_index', 'standard'])

/**
 * True for the count/metric cards (Contacts, Leads, Deals, …) that render with the
 * reference KPI card layout — label, large value, comparison pill and trend line inside
 * the body.
 *
 * Shared between `WidgetRenderer` (which picks the renderer), `WidgetCard` (which drops
 * its own header for these, since the title is rendered inside the body instead) and
 * `buildKpiPaletteIndex` (which numbers them for the palette).
 */
export function usesKpiCardLayout(widget: DashboardWidget): boolean {
  if (widget.config?.component_type === 'growth_index_kpi') return true
  // Number cards are single-metric count cards under a different widget type.
  if (widget.type?.toLowerCase() === 'number') return true
  const catalog = widget.catalogId ? findCatalogItem(widget.catalogId) : undefined
  return CARD_KPI_STYLES.has(resolveKpiStyle(widget, catalog))
}
