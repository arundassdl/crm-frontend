import type { ComponentListRow } from '@/services/api/report-addon/component-list-api'

import type { WidgetCatalogItem } from '../types'
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
    default:
      return 'ri-bar-chart-grouped-line'
  }
}

export function apiComponentToCatalogItem(row: ComponentListRow): WidgetCatalogItem {
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

