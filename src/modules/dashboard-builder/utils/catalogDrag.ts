import type { WidgetCatalogItem } from '../types'
import { DRAG_MIME } from '../styles/classes'

export type CatalogDragPayload = {
  catalogId: string
  defaultSize: { w: number; h: number }
}

export function setCatalogDragData(e: React.DragEvent, item: WidgetCatalogItem): void {
  const payload: CatalogDragPayload = {
    catalogId: item.id,
    defaultSize: item.defaultSize,
  }
  e.dataTransfer.setData(DRAG_MIME, JSON.stringify(payload))
  e.dataTransfer.effectAllowed = 'copy'
}

export function readCatalogDragData(
  dataTransfer: DataTransfer | null
): CatalogDragPayload | null {
  const raw = dataTransfer?.getData(DRAG_MIME)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as CatalogDragPayload
    if (!parsed?.catalogId) return null
    return {
      catalogId: parsed.catalogId,
      defaultSize: parsed.defaultSize ?? { w: 4, h: 4 },
    }
  } catch {
    return null
  }
}
