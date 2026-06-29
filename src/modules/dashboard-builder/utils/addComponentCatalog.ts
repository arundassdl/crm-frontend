import type { ChartKind, WidgetCatalogItem, WidgetType } from '../types'
import type { ComponentFilterFieldConfig } from '../types/componentFilters'
import type { ComparatorParameter } from '../types/comparatorParameter'
import { kpiStyleToChartType } from './resolveKpiStyle'
import type { QuickChartFormState } from '../types/quickChart'
import { aggregateOptionToColumn } from './buildAggregateOptions'
import type { AggregateOption } from './buildAggregateOptions'
import { groupingOptionToColumn } from './buildGroupingOptions'
import type { GroupingOption } from './buildGroupingOptions'

export type AddComponentKind =
  | 'chart'
  | 'kpi'
  | 'kpi-growth-index'
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
  // { kind: 'kpi-growth-index', label: 'Growth Index KPI', icon: 'ri-line-chart-line' },
  { kind: 'comparator', label: 'Comparator', icon: 'ri-group-line' },
  // { kind: 'anomaly-detection', label: 'Anomaly Detection', icon: 'ri-alert-line' },
  // { kind: 'target-meter', label: 'Target Meter', icon: 'ri-focus-3-line' },
  {
    kind: 'funnel',
    label: 'Funnel',
    icon: 'ri-filter-3-line',
    iconClassName: 'text-orange-500',
  },
  // { kind: 'cohort', label: 'Cohort', icon: 'ri-grid-line' },
  // { kind: 'quadrant', label: 'Quadrant', icon: 'ri-layout-grid-line' },
  // { kind: 'zone', label: 'Zone', icon: 'ri-radar-line' },
  { kind: 'stage', label: 'Stage', icon: 'ri-stack-line' },
  // { kind: 'waterfall', label: 'Waterfall', icon: 'ri-bar-chart-2-line' },
]

function resolveWidgetType(kind: AddComponentKind): WidgetType {
  switch (kind) {
    case 'kpi':
    case 'kpi-growth-index':
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
  if (kind === 'kpi' || kind === 'kpi-growth-index' || kind === 'comparator' || kind === 'target-meter') {
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

  const savedReportName =
    typeof config?.savedReportName === 'string' ? config.savedReportName.trim() : ''
  const title = (config?.name as string) || base.title

  const comparisonConfig =
    styleId === 'growth_index' || styleId === 'standard'
      ? {
          compare_to: (config?.compare_to as string) || (config?.compareTo as string) || 'Previous Period',
          objective: (config?.objective as string) || 'increase_positive',
        }
      : {}

  const growthIndexConfig =
    styleId === 'growth_index'
      ? {
          component_type: 'growth_index_kpi',
          component_name: title,
          chart_type: kpiStyleToChartType(styleId),
          ...(savedReportName ? { query_id: savedReportName } : {}),
        }
      : {}

  const rankingsConfig =
    styleId === 'rankings'
      ? {
          component_name: title,
          chart_type: kpiStyleToChartType(styleId),
          rank_field: (config?.rankField as string) || '',
          show: (config?.rankShow as string) || 'Top 5',
          display_record_count: Boolean(config?.displayRecordCount),
          shortened: Boolean(config?.shortened),
          format: (config?.shortenedFormat as string) || 'K',
          decimal_places: (config?.shortenedDecimalPlaces as number) ?? 0,
          measures_to_format: (config?.shortenedMeasureIds as string[]) || [],
          ...(savedReportName ? { query_id: savedReportName } : {}),
        }
      : {}

  return {
    ...base,
    id: savedReportName || `component-kpi-${styleId}-${Date.now()}`,
    title,
    config: {
      ...base.config,
      componentKind: 'kpi',
      kpiStyle: styleId,
      chartType: kpiStyleToChartType(styleId),
      ...config,
      ...(savedReportName
        ? { queryName: savedReportName, savedReportName }
        : {}),
      ...comparisonConfig,
      ...growthIndexConfig,
      ...rankingsConfig,
    },
  }
}

export type ComparatorStyle = 'elegant'

export const COMPARATOR_STYLE_LABELS: Record<ComparatorStyle, string> = {
  elegant: 'Elegant',
}

/** Comparator widget with a specific comparison style. */
export function comparatorStyleToCatalogItem(
  styleId: ComparatorStyle,
  config?: Record<string, any>
): WidgetCatalogItem {
  const label = COMPARATOR_STYLE_LABELS[styleId]
  const title = (config?.name as string) || label
  const savedReportName =
    typeof config?.savedReportName === 'string' ? config.savedReportName.trim() : ''

  return {
    id: savedReportName || `component-comparator-${styleId}-${Date.now()}`,
    title,
    description: `${label} comparator`,
    type: 'comparator',
    category: 'dashboard',
    defaultSize: { w: 6, h: 5 },
    icon: 'ri-group-line',
    config: {
      componentKind: 'comparator',
      chartType: 'comparator',
      comparator_style: styleId,
      component_name: title,
      compare_among: (config?.compare_among as string) || '',
      compare_among_label: (config?.compare_among_label as string) || undefined,
      user_type: (config?.user_type as string) || undefined,
      selected_users: (config?.selected_users as string[]) || undefined,
      selected_user_labels: (config?.selected_user_labels as string[]) || undefined,
      selected_roles: (config?.selected_roles as string[]) || undefined,
      selected_role_labels: (config?.selected_role_labels as string[]) || undefined,
      comparison_based_on: (config?.comparison_based_on as string) || undefined,
      comparison_based_on_label: (config?.comparison_based_on_label as string) || undefined,
      period_type: (config?.period_type as string) || undefined,
      period_last_value: (config?.period_last_value as number) || undefined,
      period_last_unit: (config?.period_last_unit as string) || undefined,
      period_from_date: (config?.period_from_date as string) || undefined,
      period_to_date: (config?.period_to_date as string) || undefined,
      picklist_module: (config?.picklist_module as string) || undefined,
      picklist_module_label: (config?.picklist_module_label as string) || undefined,
      picklist_field: (config?.picklist_field as string) || undefined,
      picklist_field_label: (config?.picklist_field_label as string) || undefined,
      picklist_mode: (config?.picklist_mode as string) || undefined,
      selected_picklist_values: (config?.selected_picklist_values as string[]) || undefined,
      picklist_categories: (config?.picklist_categories as Array<{ id: string; label: string; values: string[] }>) || undefined,
      comparison_parameters: (config?.comparison_parameters as ComparatorParameter[]) || [],
      ...(savedReportName ? { queryName: savedReportName, savedReportName } : {}),
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

export type ReportChartTableRef = {
  label: string
  table: string
}

export type ReportChartJoin = {
  from_label: string
  from_table: string
  to_label: string
  to_table: string
  join_type: string
  internal_key: string | null
}

export type ReportChartAdditionalConfig = {
  sortBy?: string
  maxGrouping?: number
  benchmarkEnabled?: boolean
  benchmarkValue?: number
  shortNumberEnabled?: boolean
  shortNumberFormat?: string
  decimalPlaces?: number
  displayTotalSummary?: boolean
  displayComponentFilters?: boolean
  componentFilters?: ComponentFilterFieldConfig[]
  /** Stored for chart editing: reload filter fields without re-fetching the report list. */
  table?: ReportChartTableRef
  joins?: ReportChartJoin[]
}

/** Chart widget created from an existing report via the Report Chart dialog. */
export function reportChartConfigToCatalogItem(
  componentName: string,
  reportName: string,
  reportTitle: string,
  chartKind: ChartKind,
  measureLabel?: string,
  groupingLabel?: string,
  additionalConfig?: ReportChartAdditionalConfig,
  /** Document name returned by save_report; falls back to reportName. */
  savedDocumentName?: string
): WidgetCatalogItem {
  const title = componentName.trim() || reportTitle || 'Report Chart'
  const parts = [measureLabel, groupingLabel].filter(Boolean)
  const description = parts.length ? parts.join(' by ') : 'Chart from report'
  const queryName = savedDocumentName ?? reportName

  const ac = additionalConfig ?? {}

  return {
    id: savedDocumentName ?? `component-chart-report-${Date.now()}`,
    title,
    description,
    type: 'chart',
    category: 'dashboard',
    chartKind,
    defaultSize: { w: 6, h: 4 },
    icon: 'ri-bar-chart-grouped-line',
    config: {
      chartSource: 'reports',
      componentKind: 'chart',
      chartType: chartKind,
      queryName,
      savedReportName: queryName,
      component_name: title,
      ...(ac.sortBy ? { sort_by: ac.sortBy } : {}),
      ...(ac.maxGrouping != null ? { max_grouping: ac.maxGrouping } : {}),
      benchmark_enabled: ac.benchmarkEnabled ?? false,
      ...(ac.benchmarkEnabled && ac.benchmarkValue != null
        ? { benchmark_value: ac.benchmarkValue }
        : {}),
      short_number_enabled: ac.shortNumberEnabled ?? false,
      ...(ac.shortNumberEnabled
        ? { short_number_format: ac.shortNumberFormat ?? 'Auto', decimal_places: ac.decimalPlaces ?? 1 }
        : {}),
      display_total_summary: ac.displayTotalSummary ?? false,
      display_component_filters: ac.displayComponentFilters ?? false,
      ...(ac.displayComponentFilters && ac.componentFilters?.length
        ? { component_filters: ac.componentFilters }
        : {}),
      ...(ac.table ? { report_table: ac.table } : {}),
      ...(ac.joins?.length ? { report_joins: ac.joins } : {}),
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
