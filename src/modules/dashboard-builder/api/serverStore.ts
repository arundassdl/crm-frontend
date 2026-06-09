import type { DashboardDocument } from '../types'
import { emptyLayouts } from '../utils/layoutHelpers'

const store = new Map<string, DashboardDocument>()

function defaultDashboard(id: string): DashboardDocument {
  return {
    id,
    title: id === 'new' ? 'Untitled Dashboard' : "Manager's Home",
    description: 'Custom homepage for your team',
    widgets: [],
    layouts: emptyLayouts(),
    filters: {},
    updatedAt: new Date().toISOString(),
  }
}

export function getDashboardFromStore(id: string): DashboardDocument {
  const existing = store.get(id)
  if (existing) return structuredClone(existing)
  const doc = defaultDashboard(id)
  store.set(id, doc)
  return structuredClone(doc)
}

export function saveDashboardToStore(doc: DashboardDocument): DashboardDocument {
  const saved = {
    ...doc,
    updatedAt: new Date().toISOString(),
  }
  store.set(doc.id, structuredClone(saved))
  return structuredClone(saved)
}

export function listDashboardIds(): string[] {
  return Array.from(store.keys())
}
