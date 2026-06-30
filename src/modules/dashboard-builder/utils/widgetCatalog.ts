import type { ComponentListRow } from '@/services/api/report-addon/component-list-api'

import type { WidgetCatalogItem } from '../types'
import type { ComparatorParameter } from '../types/comparatorParameter'
import { isTableChartType } from './isTableChartType'
import { mapApiChartTypeToChartKind } from './mapChartType'
import { chartTypeToKpiStyle } from './resolveKpiStyle'

/** API-loaded dashboard components (keyed by `name`). */
const apiCatalogRegistry = new Map<string, WidgetCatalogItem>()

export function registerApiCatalogItems(items: WidgetCatalogItem[]): void {
  for (const item of items) {
    apiCatalogRegistry.set(item.id, item)
  }
}

export function getApiCatalogItems(): WidgetCatalogItem[] {
  return Array.from(apiCatalogRegistry.values())
}

function chartIconForKind(kind: WidgetCatalogItem['chartKind']): string {
  switch (kind) {
    case 'pie':
    case 'donut':
      return 'ri-pie-chart-2-line'
    case 'line':
    case 'area':
      return 'ri-line-chart-line'
    case 'funnel':
      return 'ri-filter-3-line'
    case 'scatter':
      return 'ri-bubble-chart-line'
    case 'progress':
      return 'ri-progress-3-line'
    default:
      return 'ri-bar-chart-grouped-line'
  }
}

export function apiComponentToCatalogItem(row: ComponentListRow): WidgetCatalogItem {
  const chartTypeLower = (row.chart_type ?? '').toLowerCase()
  const isComparator =
    Boolean(row.comparator_style) ||
    chartTypeLower === 'comparator' ||
    chartTypeLower.startsWith('comparator_')

  console.log('[Comparator] reload component', {
    name: row.name,
    chart_type: row.chart_type,
    comparator_style: row.comparator_style,
    compare_among: row.compare_among,
    isComparator,
  })

  if (isComparator) {
    const comparatorStyle = row.comparator_style || 'elegant'
    return {
      id: row.name,
      title: row.title,
      description: `${comparatorStyle} comparator`,
      type: 'comparator',
      category: 'dashboard',
      defaultSize: { w: 6, h: 5 },
      icon: 'ri-group-line',
      config: {
        componentKind: 'comparator',
        chartType: 'comparator',
        comparator_style: comparatorStyle,
        component_name: row.title,
        compare_among: row.compare_among ?? '',
        compare_among_label: row.compare_among_label ?? undefined,
        user_type: row.user_type ?? undefined,
        selected_users: row.selected_users ?? undefined,
        selected_user_labels: row.selected_user_labels ?? undefined,
        selected_roles: row.selected_roles ?? undefined,
        selected_role_labels: row.selected_role_labels ?? undefined,
        period_type: row.period_type ?? undefined,
        period_last_value: row.period_last_value ?? undefined,
        period_last_unit: row.period_last_unit ?? undefined,
        period_from_date: row.period_from_date ?? undefined,
        period_to_date: row.period_to_date ?? undefined,
        picklist_module: row.picklist_module ?? undefined,
        picklist_module_label: row.picklist_module_label ?? undefined,
        picklist_field: row.picklist_field ?? undefined,
        picklist_field_label: row.picklist_field_label ?? undefined,
        comparison_parameters: (row.comparison_parameters as ComparatorParameter[] | undefined) ?? [],
        queryName: row.name,
        savedReportName: row.name,
      },
    }
  }

  if (isTableChartType(row.chart_type)) {
    return {
      id: row.name,
      title: row.title,
      description: '',
      type: 'table',
      category: 'dashboard',
      defaultSize: { w: 12, h: 5 },
      icon: 'ri-table-line',
      config: { queryName: row.name, chartType: 'table' },
    }
  }

  const chartType = row.chart_type != null ? String(row.chart_type) : ''
  const kpiStyle = chartTypeToKpiStyle(chartType)
  if (kpiStyle) {
    return {
      id: row.name,
      title: row.title,
      description: '',
      type: 'kpi',
      category: 'dashboard',
      defaultSize: { w: 3, h: 2 },
      icon: 'ri-line-chart-line',
      config: {
        queryName: row.name,
        chartType,
        kpiStyle,
        savedReportName: row.name,
        ...(kpiStyle === 'growth_index'
          ? {
              component_type: 'growth_index_kpi',
              component_name: row.title,
              compare_to: row.compare_to ?? 'Previous Period',
              objective: row.objective ?? 'increase_positive',
              query_id: row.name,
            }
          : {}),
        ...(kpiStyle === 'standard' && (row.compare_to || row.objective)
          ? {
              compare_to: row.compare_to ?? 'Previous Period',
              objective: row.objective ?? 'increase_positive',
            }
          : {}),
        ...(kpiStyle === 'rankings'
          ? {
              component_name: row.title,
              query_id: row.name,
              rank_field: row.rank_field ?? '',
              show: row.show ?? 'Top 5',
              display_record_count: Boolean(row.display_record_count),
              shortened: Boolean(row.shortened),
              format: row.format ?? 'K',
              decimal_places: row.decimal_places ?? 0,
              measures_to_format: row.measures_to_format ?? [],
            }
          : {}),
      },
    }
  }

  const chartKind = mapApiChartTypeToChartKind(row.chart_type)
  return {
    id: row.name,
    title: row.title,
    description: '',
    type: 'chart',
    category: 'dashboard',
    chartKind,
    defaultSize: { w: 4, h: 4 },
    icon: chartIconForKind(chartKind),
    config: { queryName: row.name, chartType },
  }
}

/** Report sidebar items always render as tables on the home page canvas. */
export function apiReportComponentToCatalogItem(row: ComponentListRow): WidgetCatalogItem {
  return {
    id: row.name,
    title: row.title,
    description: '',
    type: 'table',
    category: 'reports',
    defaultSize: { w: 12, h: 5 },
    icon: 'ri-table-line',
    config: {
      reportName: row.name,
      queryName: row.name,
      isReport: true,
      chartType: 'table',
    },
  }
}

export const WIDGET_CATALOG: WidgetCatalogItem[] = [
  {
    id: 'leads-this-month',
    title: 'Leads This Month',
    description: 'Total leads created in the current month',
    type: 'kpi',
    category: 'dashboard',
    defaultSize: { w: 3, h: 2 },
    icon: 'ri-user-add-line',
    kpiValue: '128',
    kpiLabel: 'Leads This Month',
  },
  {
    id: 'revenue-this-month',
    title: 'Revenue This Month',
    description: 'Closed-won revenue for the current month',
    type: 'kpi',
    category: 'dashboard',
    defaultSize: { w: 3, h: 2 },
    icon: 'ri-money-dollar-circle-line',
    kpiValue: '$84,200',
    kpiLabel: 'Revenue This Month',
  },
  {
    id: 'deals-in-pipeline',
    title: 'Deals In Pipeline',
    description: 'Open deals by stage',
    type: 'number',
    category: 'dashboard',
    defaultSize: { w: 3, h: 2 },
    icon: 'ri-funds-line',
    kpiValue: '42',
    kpiLabel: 'Deals In Pipeline',
  },
  {
    id: 'accounts-this-month',
    title: 'Accounts This Month',
    description: 'New accounts created this month',
    type: 'kpi',
    category: 'dashboard',
    defaultSize: { w: 3, h: 2 },
    icon: 'ri-building-line',
    kpiValue: '19',
    kpiLabel: 'Accounts This Month',
  },
  {
    id: 'overdue-tasks',
    title: 'Overdue Tasks',
    description: 'Tasks past due date',
    type: 'number',
    category: 'dashboard',
    defaultSize: { w: 3, h: 2 },
    icon: 'ri-alarm-warning-line',
    kpiValue: '7',
    kpiLabel: 'Overdue Tasks',
  },
  {
    id: 'deals-funnel',
    title: 'Funnel Chart',
    description: 'Deal conversion funnel by stage',
    type: 'funnel',
    category: 'reports',
    chartKind: 'funnel',
    defaultSize: { w: 6, h: 5 },
    icon: 'ri-filter-3-line',
  },
  {
    id: 'revenue-bar',
    title: 'Revenue Trend',
    description: 'Monthly revenue bar chart',
    type: 'chart',
    category: 'reports',
    chartKind: 'bar',
    defaultSize: { w: 6, h: 4 },
    icon: 'ri-bar-chart-grouped-line',
  },
  {
    id: 'pipeline-line',
    title: 'Pipeline Trend',
    description: 'Pipeline value over time',
    type: 'chart',
    category: 'reports',
    chartKind: 'line',
    defaultSize: { w: 6, h: 4 },
    icon: 'ri-line-chart-line',
  },
  {
    id: 'deals-pivot',
    title: 'Pivot Table',
    description: 'Deals grouped by owner and stage',
    type: 'pivot',
    category: 'reports',
    defaultSize: { w: 12, h: 5 },
    icon: 'ri-table-2',
  },
  {
    id: 'leads-table',
    title: 'Leads Table',
    description: 'Recent leads data grid',
    type: 'table',
    category: 'reports',
    defaultSize: { w: 12, h: 5 },
    icon: 'ri-table-line',
  },
  {
    id: 'deals-donut',
    title: 'Deals by Stage',
    description: 'Donut chart of deal stages',
    type: 'chart',
    category: 'reports',
    chartKind: 'donut',
    defaultSize: { w: 4, h: 4 },
    icon: 'ri-pie-chart-2-line',
  },
]

export const SIDEBAR_CATEGORIES = ['dashboard', 'reports'] as const

export const CATEGORY_LABELS: Record<WidgetCatalogItem['category'], string> = {
  dashboard: 'Dashboard Components',
  reports: 'Report Components',
}

export function findCatalogItem(catalogId: string): WidgetCatalogItem | undefined {
  return apiCatalogRegistry.get(catalogId) ?? WIDGET_CATALOG.find(w => w.id === catalogId)
}

