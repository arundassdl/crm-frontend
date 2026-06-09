import type { DashboardWidget, GridLayoutItem, ResponsiveLayouts } from '../types'

export const GRID_COLS = { lg: 12, md: 8, sm: 6, xs: 4, xxs: 2 } as const

export const GRID_BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 } as const

function isKpiLikeWidget(widget: DashboardWidget | undefined): boolean {
  if (!widget) return false
  const type = widget.type?.toLowerCase()
  return type === 'kpi' || type === 'number'
}

/** Group layout items that share the same row start (y). */
function groupLayoutByRow(layout: GridLayoutItem[]): Map<number, GridLayoutItem[]> {
  const rows = new Map<number, GridLayoutItem[]>()
  for (const item of layout) {
    const list = rows.get(item.y) ?? []
    list.push(item)
    rows.set(item.y, list)
  }
  return rows
}

/**
 * Expand each row so widgets fill the full column count.
 * KPI widgets in the same row receive equal widths.
 */
export function expandLayoutRowsToFillWidth(
  layout: GridLayoutItem[],
  cols: number,
  widgetById?: Map<string, DashboardWidget>
): GridLayoutItem[] {
  if (!layout.length) return layout

  const rows = groupLayoutByRow(layout)
  const optimized = new Map<string, GridLayoutItem>()

  for (const [, items] of rows) {
    const sorted = [...items].sort((a, b) => a.x - b.x)
    const totalW = sorted.reduce((sum, item) => sum + item.w, 0)

    if (totalW >= cols) {
      sorted.forEach(item => optimized.set(item.i, { ...item }))
      continue
    }

    const allKpiRow =
      Boolean(widgetById) &&
      sorted.every(item => isKpiLikeWidget(widgetById?.get(String(item.i))))

    if (allKpiRow && sorted.length > 0) {
      const baseW = Math.floor(cols / sorted.length)
      const remainder = cols - baseW * sorted.length
      let x = 0
      sorted.forEach((item, index) => {
        const w = baseW + (index < remainder ? 1 : 0)
        optimized.set(item.i, { ...item, x, w })
        x += w
      })
      continue
    }

    const scale = cols / totalW
    let x = 0
    sorted.forEach((item, index) => {
      const isLast = index === sorted.length - 1
      const w = isLast ? Math.max(1, cols - x) : Math.max(1, Math.round(item.w * scale))
      optimized.set(item.i, { ...item, x, w })
      x += w
    })
  }

  return layout.map(item => optimized.get(item.i) ?? item)
}

function scaleLayoutToCols(layout: GridLayoutItem[], fromCols: number, toCols: number): GridLayoutItem[] {
  if (fromCols === toCols) return layout.map(item => ({ ...item }))
  const ratio = toCols / fromCols

  return layout.map(item => {
    const scaledW = Math.max(1, Math.min(toCols, Math.round(item.w * ratio)))
    const scaledX = Math.max(0, Math.min(toCols - scaledW, Math.round(item.x * ratio)))
    return { ...item, x: scaledX, w: scaledW }
  })
}

/** Stack widgets full-width for narrow breakpoints (mobile / tablet). */
function stackLayoutFullWidth(layout: GridLayoutItem[], cols: number): GridLayoutItem[] {
  const sorted = [...layout].sort((a, b) => a.y - b.y || a.x - b.x)
  let y = 0

  return sorted.map(item => {
    const next = { ...item, x: 0, w: cols, y }
    y += item.h
    return next
  })
}

/** Build responsive layouts for the read-only dashboard view. */
export function generateViewResponsiveLayouts(
  lgLayout: GridLayoutItem[],
  widgets: DashboardWidget[]
): ResponsiveLayouts {
  const widgetById = new Map(widgets.map(widget => [String(widget.id), widget]))
  const lg = expandLayoutRowsToFillWidth(lgLayout, GRID_COLS.lg, widgetById)
  const md = expandLayoutRowsToFillWidth(
    scaleLayoutToCols(lg, GRID_COLS.lg, GRID_COLS.md),
    GRID_COLS.md,
    widgetById
  )

  return {
    lg,
    md,
    sm: stackLayoutFullWidth(lg, GRID_COLS.sm),
    xs: stackLayoutFullWidth(lg, GRID_COLS.xs),
    xxs: stackLayoutFullWidth(lg, GRID_COLS.xxs),
  }
}

export function createWidgetId(prefix = 'widget'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

/** Place new item below existing layout (compact vertical). */
export function nextAvailablePosition(
  layout: GridLayoutItem[],
  w: number,
  h: number,
  cols = 12
): Pick<GridLayoutItem, 'x' | 'y'> {
  if (layout.length === 0) return { x: 0, y: 0 }

  let maxY = 0
  for (const item of layout) {
    maxY = Math.max(maxY, item.y + item.h)
  }

  for (let y = 0; y <= maxY + h; y++) {
    for (let x = 0; x <= cols - w; x++) {
      const collision = layout.some(
        item =>
          x < item.x + item.w &&
          x + w > item.x &&
          y < item.y + item.h &&
          y + h > item.y
      )
      if (!collision) return { x, y }
    }
  }

  return { x: 0, y: maxY }
}

export function removeLayoutItem(layout: GridLayoutItem[], widgetId: string): GridLayoutItem[] {
  return layout.filter(item => item.i !== widgetId)
}

export function cloneLayouts(layouts: ResponsiveLayouts): ResponsiveLayouts {
  return {
    lg: layouts.lg.map(item => ({ ...item })),
    md: layouts.md?.map(item => ({ ...item })),
    sm: layouts.sm?.map(item => ({ ...item })),
    xs: layouts.xs?.map(item => ({ ...item })),
    xxs: layouts.xxs?.map(item => ({ ...item })),
  }
}

export function emptyLayouts(): ResponsiveLayouts {
  return { lg: [], md: [], sm: [], xs: [] }
}

/** Avoid react-grid-layout ↔ store feedback loops when layout is unchanged. */
export function layoutItemsEqual(a: GridLayoutItem[], b: GridLayoutItem[]): boolean {
  if (a === b) return true
  if (a.length !== b.length) return false
  const byId = new Map(b.map(item => [item.i, item]))
  for (const item of a) {
    const other = byId.get(item.i)
    if (!other) return false
    if (
      item.x !== other.x ||
      item.y !== other.y ||
      item.w !== other.w ||
      item.h !== other.h
    ) {
      return false
    }
  }
  return true
}
