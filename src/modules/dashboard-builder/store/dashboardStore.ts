import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

import type {
  DashboardDocument,
  DashboardFilters,
  DashboardWidget,
  GridLayoutItem,
  ResponsiveLayouts,
} from '../types'
import { cloneLayouts, emptyLayouts, layoutItemsEqual } from '../utils/layoutHelpers'

type HistorySnapshot = {
  widgets: DashboardWidget[]
  layouts: ResponsiveLayouts
}

const MAX_HISTORY = 40

interface DashboardStoreState {
  dashboardId: string | null
  title: string
  description: string
  widgets: DashboardWidget[]
  layouts: ResponsiveLayouts
  selectedWidgetId: string | null
  fullscreenWidgetId: string | null
  loading: boolean
  saving: boolean
  filters: DashboardFilters
  sidebarOpen: boolean
  settingsWidgetId: string | null
  past: HistorySnapshot[]
  future: HistorySnapshot[]
}

interface DashboardStoreActions {
  hydrate: (doc: DashboardDocument) => void
  reset: () => void
  setTitle: (title: string) => void
  setDescription: (description: string) => void
  setLoading: (loading: boolean) => void
  setSaving: (saving: boolean) => void
  setFilters: (filters: DashboardFilters) => void
  setSidebarOpen: (open: boolean) => void
  setSelectedWidget: (widgetId: string | null) => void
  setFullscreenWidget: (widgetId: string | null) => void
  setSettingsWidget: (widgetId: string | null) => void
  pushHistory: () => void
  undo: () => void
  redo: () => void
  addWidget: (widget: DashboardWidget, layoutItem: GridLayoutItem) => void
  removeWidget: (widgetId: string) => void
  updateWidget: (widgetId: string, patch: Partial<DashboardWidget>) => void
  updateLayout: (layout: GridLayoutItem[]) => void
  updateResponsiveLayouts: (layouts: ResponsiveLayouts) => void
  setDashboardId: (id: string | null) => void
}

export type DashboardStore = DashboardStoreState & DashboardStoreActions

const initialState: DashboardStoreState = {
  dashboardId: null,
  title: 'Untitled Dashboard',
  description: '',
  widgets: [],
  layouts: emptyLayouts(),
  selectedWidgetId: null,
  fullscreenWidgetId: null,
  loading: false,
  saving: false,
  filters: {},
  sidebarOpen: true,
  settingsWidgetId: null,
  past: [],
  future: [],
}

export const useDashboardStore = create<DashboardStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      hydrate: doc =>
        set({
          dashboardId: doc.id,
          title: doc.title,
          description: doc.description,
          widgets: doc.widgets,
          layouts: cloneLayouts(doc.layouts),
          filters: doc.filters ?? {},
          selectedWidgetId: null,
          fullscreenWidgetId: null,
          settingsWidgetId: null,
          past: [],
          future: [],
        }),

      reset: () => set({ ...initialState, layouts: emptyLayouts() }),

      setTitle: title => set({ title }),
      setDescription: description => set({ description }),
      setLoading: loading => set({ loading }),
      setSaving: saving => set({ saving }),
      setFilters: filters => set({ filters }),
      setSidebarOpen: sidebarOpen => set({ sidebarOpen }),
      setSelectedWidget: selectedWidgetId => set({ selectedWidgetId }),
      setFullscreenWidget: fullscreenWidgetId => set({ fullscreenWidgetId }),
      setSettingsWidget: settingsWidgetId => set({ settingsWidgetId }),

      pushHistory: () => {
        const { widgets, layouts, past } = get()
        const snapshot: HistorySnapshot = {
          widgets: widgets.map(w => ({ ...w })),
          layouts: cloneLayouts(layouts),
        }
        set({
          past: [...past.slice(-MAX_HISTORY + 1), snapshot],
          future: [],
        })
      },

      undo: () => {
        const { past, future, widgets, layouts } = get()
        if (past.length === 0) return
        const previous = past[past.length - 1]
        const current: HistorySnapshot = {
          widgets: widgets.map(w => ({ ...w })),
          layouts: cloneLayouts(layouts),
        }
        set({
          past: past.slice(0, -1),
          future: [current, ...future].slice(0, MAX_HISTORY),
          widgets: previous.widgets,
          layouts: cloneLayouts(previous.layouts),
        })
      },

      redo: () => {
        const { past, future, widgets, layouts } = get()
        if (future.length === 0) return
        const next = future[0]
        const current: HistorySnapshot = {
          widgets: widgets.map(w => ({ ...w })),
          layouts: cloneLayouts(layouts),
        }
        set({
          past: [...past, current].slice(-MAX_HISTORY),
          future: future.slice(1),
          widgets: next.widgets,
          layouts: cloneLayouts(next.layouts),
        })
      },

      addWidget: (widget, layoutItem) => {
        get().pushHistory()
        set(state => ({
          widgets: [...state.widgets, widget],
          layouts: {
            ...state.layouts,
            lg: [...state.layouts.lg, layoutItem],
          },
          selectedWidgetId: widget.id,
        }))
      },

      removeWidget: widgetId => {
        get().pushHistory()
        set(state => ({
          widgets: state.widgets.filter(w => w.id !== widgetId),
          layouts: {
            ...state.layouts,
            lg: state.layouts.lg.filter(item => item.i !== widgetId),
          },
          selectedWidgetId: state.selectedWidgetId === widgetId ? null : state.selectedWidgetId,
          fullscreenWidgetId:
            state.fullscreenWidgetId === widgetId ? null : state.fullscreenWidgetId,
        }))
      },

      updateWidget: (widgetId, patch) => {
        set(state => ({
          widgets: state.widgets.map(w => (w.id === widgetId ? { ...w, ...patch } : w)),
        }))
      },

      updateLayout: layout => {
        set(state => {
          if (layoutItemsEqual(state.layouts.lg, layout)) return state
          return {
            layouts: { ...state.layouts, lg: layout },
          }
        })
      },

      updateResponsiveLayouts: layouts => set({ layouts: cloneLayouts(layouts) }),
      setDashboardId: dashboardId => set({ dashboardId }),
    }),
    { name: 'dashboard-builder' }
  )
)

export const selectSelectedWidget = (state: DashboardStore) =>
  state.widgets.find(w => w.id === state.selectedWidgetId) ?? null
