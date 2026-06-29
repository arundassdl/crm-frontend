import type { ChartKind } from '../../types'
import type { KPIStyle } from '../KPIStyleSelectionModal'
import type { ComparatorStyle } from '../../utils/addComponentCatalog'

/** Top-level source toggle. */
export type ComponentSource = 'chart' | 'report'

/** Component category (only shown when source === 'chart'). */
export type ComponentCategory = 'chart' | 'kpi' | 'comparator' | 'stage'

export type TypeCard = {
  id: string
  label: string
  icon: string
}

export const SOURCE_OPTIONS: { id: ComponentSource; label: string }[] = [
  { id: 'chart', label: 'Chart' },
  { id: 'report', label: 'Chart From Report' },
]

/** Chart-kind cards (shared by the "Chart" category and the "Chart From Report" source). */
export const CHART_TYPE_CARDS: { id: ChartKind; label: string; icon: string }[] = [
  { id: 'column', label: 'Column', icon: 'ri-bar-chart-2-line' },
  { id: 'bar', label: 'Bar', icon: 'ri-bar-chart-horizontal-line' },
  { id: 'donut', label: 'Donut', icon: 'ri-donut-chart-line' },
  { id: 'pie', label: 'Pie', icon: 'ri-pie-chart-2-line' },
  { id: 'treemap', label: 'Treemap', icon: 'ri-layout-masonry-line' },
  { id: 'butterfly', label: 'Butterfly', icon: 'ri-bar-chart-grouped-line' },
  { id: 'live', label: 'Live', icon: 'ri-pulse-line' },
  { id: 'funnel', label: 'Funnel', icon: 'ri-filter-line' },
  { id: 'area', label: 'Area', icon: 'ri-line-chart-line' },
  { id: 'progress', label: 'Progress', icon: 'ri-progress-4-line' },
  { id: 'scatter', label: 'Scatter', icon: 'ri-bubble-chart-line' },
]

export const KPI_TYPE_CARDS: { id: KPIStyle; label: string; icon: string }[] = [
  { id: 'basic', label: 'Basic KPI', icon: 'ri-hashtag' },
  { id: 'growth_index', label: 'Growth Index KPI', icon: 'ri-line-chart-line' },
  { id: 'standard', label: 'Standard KPI', icon: 'ri-bar-chart-box-line' },
  { id: 'scorecard', label: 'Scorecard KPI', icon: 'ri-file-list-3-line' },
  { id: 'rankings', label: 'Ranking KPI', icon: 'ri-trophy-line' },
]

/** Comparator cards. The descriptive labels map onto the existing style ids. */
export const COMPARATOR_TYPE_CARDS: { id: ComparatorStyle; label: string; icon: string }[] = [
  { id: 'elegant', label: 'Sales Representative Scorecard', icon: 'ri-layout-grid-line' },
]

/** Stage cards. Only the Standard Staircase is available. */
export const STAGE_TYPE_CARDS: { id: string; label: string; icon: string }[] = [
  { id: 'standard_staircase', label: 'Standard Staircase', icon: 'ri-stairs-line' },
]

/** A type card tagged with the category it belongs to. */
export type CategorizedCard = TypeCard & { category: ComponentCategory }

/**
 * Flat, category-tagged list of every component type available under the
 * "Chart" source. The category is carried on each card so the selection can be
 * routed to the correct config panel without a separate category nav row.
 */
export const ALL_COMPONENT_CARDS: CategorizedCard[] = [
  ...CHART_TYPE_CARDS.map(card => ({ ...card, category: 'chart' as const })),
  ...KPI_TYPE_CARDS.map(card => ({ ...card, category: 'kpi' as const })),
  ...COMPARATOR_TYPE_CARDS.map(card => ({ ...card, category: 'comparator' as const })),
  ...STAGE_TYPE_CARDS.map(card => ({ ...card, category: 'stage' as const })),
]
