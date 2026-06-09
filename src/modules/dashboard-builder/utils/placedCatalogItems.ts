import type { DashboardWidget, WidgetCatalogItem } from '../types'

/** Catalog ids currently on the canvas (one entry per widget). */
export function getPlacedCatalogIds(widgets: DashboardWidget[]): Set<string> {
  const ids = new Set<string>()
  for (const w of widgets) {
    if (w.catalogId) ids.add(w.catalogId)
  }
  return ids
}

export function filterAvailableCatalogItems(
  items: WidgetCatalogItem[],
  placedIds?: Set<string>
): WidgetCatalogItem[] {
  if (!placedIds?.size) return items
  return items.filter(item => !placedIds.has(item.id))
}

export function isCatalogItemPlaced(
  catalogId: string,
  placedIds: Set<string>
): boolean {
  return placedIds.has(catalogId)
}
