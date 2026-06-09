import type { ChartKind, WidgetCatalogItem, WidgetType } from '../types'
import { kpiStyleToChartType } from './resolveKpiStyle'
import type { QuickChartFormState } from '../types/quickChart'
import { aggregateOptionToColumn } from './buildAggregateOptions'
import type { AggregateOption } from './buildAggregateOptions'
import { groupingOptionToColumn } from './buildGroupingOptions'
import type { GroupingOption } from './buildGroupingOptions'

export type AddComponentKind =
  | 'chart'
  | 'kpi'
  | 'comparator'
  | 'anomaly-detection'
  | 'target-meter'
  | 'funnel'
  | 'cohort'
  | 'quadrant'
  | 'zone'
  | 'stage'
  | 'waterfall'

export type AddComponentOption = {
  kind: AddComponentKind
  label: string
  icon: string
  /** Optional multi-tone icon styling (e.g. funnel) */
  iconClassName?: string
}

export const ADD_COMPONENT_OPTIONS: AddComponentOption[] = [
  { kind: 'chart', label: 'Chart', icon: 'ri-bar-chart-grouped-line' },
  { kind: 'kpi', label: 'KPI', icon: 'ri-line-chart-line' },
  { kind: 'comparator', label: 'Comparator', icon: 'ri-group-line' },
  { kind: 'anomaly-detection', label: 'Anomaly Detection', icon: 'ri-alert-line' },
  { kind: 'target-meter', label: 'Target Meter', icon: 'ri-focus-3-line' },
  {
    kind: 'funnel',
    label: 'Funnel',
    icon: 'ri-filter-3-line',
    iconClassName: 'text-orange-500',
  },
  { kind: 'cohort', label: 'Cohort', icon: 'ri-grid-line' },
  { kind: 'quadrant', label: 'Quadrant', icon: 'ri-layout-grid-line' },
  { kind: 'zone', label: 'Zone', icon: 'ri-radar-line' },
  { kind: 'stage', label: 'Stage', icon: 'ri-stack-line' },
  { kind: 'waterfall', label: 'Waterfall', icon: 'ri-bar-chart-2-line' },
]

function resolveWidgetType(kind: AddComponentKind): WidgetType {
  switch (kind) {
    case 'kpi':
    case 'comparator':
    case 'target-meter':
      return 'kpi'
    case 'funnel':
      return 'funnel'
    case 'chart':
    case 'anomaly-detection':
    case 'cohort':
    case 'quadrant':
    case 'zone':
    case 'stage':
    case 'waterfall':
      return 'chart'
    default:
      return 'chart'
  }
}

function resolveChartKind(kind: AddComponentKind): ChartKind | undefined {
  switch (kind) {
    case 'waterfall':
    case 'chart':
      return 'bar'
    case 'anomaly-detection':
      return 'line'
    case 'cohort':
    case 'quadrant':
    case 'zone':
    case 'stage':
      return 'area'
    case 'funnel':
      return 'funnel'
    default:
      return undefined
  }
}

function defaultSizeFor(kind: AddComponentKind): { w: number; h: number } {
  if (kind === 'kpi' || kind === 'comparator' || kind === 'target-meter') {
    return { w: 3, h: 2 }
  }
  if (kind === 'funnel') return { w: 6, h: 5 }
  return { w: 4, h: 4 }
}

/** Build a catalog item when user picks a component from the Add Component modal. */
export function addComponentToCatalogItem(option: AddComponentOption): WidgetCatalogItem {
  const type = resolveWidgetType(option.kind)
  const chartKind = resolveChartKind(option.kind)

  return {
    id: `component-${option.kind}`,
    title: option.label,
    description: `${option.label} dashboard component`,
    type,
    category: 'dashboard',
    chartKind,
    defaultSize: defaultSizeFor(option.kind),
    icon: option.icon,
    kpiValue: type === 'kpi' ? '—' : undefined,
    kpiLabel: type === 'kpi' ? option.label : undefined,
  }
}

/** KPI widget with a specific style. */
export function kpiStyleToCatalogItem(
  styleId: string,
  config?: Record<string, any>
): WidgetCatalogItem {
  const base = addComponentToCatalogItem({
    kind: 'kpi',
    label: styleId.charAt(0).toUpperCase() + styleId.slice(1).replace('_', ' '),
    icon: 'ri-line-chart-line',
  })

  return {
    ...base,
    id: `component-kpi-${styleId}-${Date.now()}`,
    title: (config?.name as string) || base.title,
    config: {
      ...base.config,
      componentKind: 'kpi',
      kpiStyle: styleId,
      chartType: kpiStyleToChartType(styleId),
      ...config,
    },
  }
}

/** Chart widget from Add Chart dialog (Quick chart / From Reports). */
export function addChartCatalogItem(source: 'quick' | 'reports'): WidgetCatalogItem {
  const base = addComponentToCatalogItem({
    kind: 'chart',
    label: 'Chart',
    icon: 'ri-bar-chart-grouped-line',
  })

  return {
    ...base,
    id: `component-chart-${source}`,
    title: source === 'reports' ? 'Report Chart' : 'Quick Chart',
    description:
      source === 'reports' ? 'Chart from an existing report' : 'Quick chart created instantly',
    config: {
      chartSource: source,
      componentKind: 'chart',
    },
  }
}

/** Chart widget after Quick Chart configuration dialog. */
export function quickChartConfigToCatalogItem(
  form: QuickChartFormState,
  measureOptions: AggregateOption[],
  groupingOption?: GroupingOption | null,
  options?: { savedReportName?: string }
): WidgetCatalogItem {
  const title = form.componentName.trim() || 'Quick Chart'
  const measureLabels = measureOptions.map(m => m.label).filter(Boolean)
  const measureLabel = measureLabels.join(', ')
  const groupingLabel = groupingOption?.label ?? form.grouping
  const aggregateColumns = measureOptions.map(m => aggregateOptionToColumn(m))
  const groupingColumn = groupingOption
    ? groupingOptionToColumn(groupingOption)
    : undefined

  return {
    id: `component-chart-quick-${Date.now()}`,
    title,
    description: `${measureLabel || 'Measures'} by ${groupingLabel || 'grouping'}`,
    type: 'chart',
    category: 'dashboard',
    chartKind: form.chartKind,
    defaultSize: { w: 6, h: 4 },
    icon: 'ri-bar-chart-grouped-line',
    config: {
      chartSource: 'quick',
      componentKind: 'chart',
      quickChart: form,
      aggregateColumns,
      groupingColumn,
      measureIds: measureOptions.map(m => m.id),
      groupingId: groupingOption?.id ?? form.grouping,
      savedReportName: options?.savedReportName,
      queryName: options?.savedReportName,
    },
  }
}
