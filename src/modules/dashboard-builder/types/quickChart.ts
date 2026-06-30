import type { ChartKind } from './index'
import type { QuickChartCriteriaFilter } from './quickChartFilter'

export type QuickChartFormState = {
  componentName: string
  primaryModule: string
  relatedModule: string
  /** Aggregate option ids (`buildAggregateOptions`), one row per measure. */
  measures: string[]
  grouping: string
  chartKind: ChartKind
  showComponentFilters: boolean
  filterField: string
  showCriteriaFilter: boolean
  criteriaFilters: QuickChartCriteriaFilter[]
}

export const DEFAULT_QUICK_CHART_FORM: QuickChartFormState = {
  componentName: '',
  primaryModule: '',
  relatedModule: '',
  measures: [''],
  grouping: '',
  chartKind: 'column',
  showComponentFilters: false,
  filterField: '',
  showCriteriaFilter: false,
  criteriaFilters: [],
}
