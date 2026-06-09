import type { DashboardWidget, WidgetCatalogItem } from '../types'

function normalizeChartType(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
}

export function chartTypeToKpiStyle(chartType: string): string | undefined {
  const raw = normalizeChartType(chartType)
  if (!raw) return undefined
  if (raw.includes('basic')) return 'basic'
  if (raw.includes('growth')) return 'growth_index'
  if (raw.includes('scorecard')) return 'scorecard'
  if (raw.includes('ranking')) return 'rankings'
  if (raw.includes('standard')) return 'standard'
  return undefined
}

export function kpiStyleToChartType(style: string): string {
  switch (style) {
    case 'basic':
      return 'Basic KPI'
    case 'growth_index':
      return 'Growth Index KPI'
    case 'scorecard':
      return 'Scorecard KPI'
    case 'rankings':
      return 'Rankings KPI'
    case 'standard':
      return 'Standard KPI'
    default:
      return 'Standard KPI'
  }
}

export function isBasicKpiStyle(style: string | undefined): boolean {
  return style === 'basic'
}

export function inferKpiStyleFromCatalogItem(item: WidgetCatalogItem): string | undefined {
  const fromConfig = item.config?.kpiStyle
  if (fromConfig) return fromConfig

  const fromChartType = chartTypeToKpiStyle(item.config?.chartType ?? '')
  if (fromChartType) return fromChartType

  if (/kpi-basic/i.test(item.id)) return 'basic'
  if (/kpi-standard/i.test(item.id)) return 'standard'
  if (/kpi-growth/i.test(item.id)) return 'growth_index'
  if (/kpi-scorecard/i.test(item.id)) return 'scorecard'
  if (/kpi-rankings/i.test(item.id)) return 'rankings'

  return undefined
}

export function resolveKpiStyle(
  widget: DashboardWidget,
  catalog?: WidgetCatalogItem
): string {
  const properties = widget.properties as Record<string, unknown> | undefined

  const fromConfig = widget.config?.kpiStyle as string | undefined
  if (fromConfig) return fromConfig

  const fromProperties = properties?.kpiStyle
  if (typeof fromProperties === 'string' && fromProperties.trim()) return fromProperties

  const chartType =
    widget.config?.chartType ??
    widget.config?.chart_type ??
    properties?.chartType ??
    properties?.chart_type ??
    catalog?.config?.chartType ??
    ''
  const fromChartType = chartTypeToKpiStyle(String(chartType))
  if (fromChartType) return fromChartType

  const componentKind = String(widget.config?.componentKind ?? '')
  if (componentKind.startsWith('kpi-basic')) return 'basic'
  if (componentKind.startsWith('kpi-growth')) return 'growth_index'
  if (componentKind.startsWith('kpi-scorecard')) return 'scorecard'
  if (componentKind.startsWith('kpi-rankings')) return 'rankings'
  if (componentKind.startsWith('kpi-standard')) return 'standard'

  if (widget.catalogId && /kpi-basic/i.test(widget.catalogId)) return 'basic'

  if (catalog) {
    const fromCatalog = inferKpiStyleFromCatalogItem(catalog)
    if (fromCatalog) return fromCatalog
  }

  return 'standard'
}

export function isBasicKpiWidget(widget: DashboardWidget, catalog?: WidgetCatalogItem): boolean {
  return isBasicKpiStyle(resolveKpiStyle(widget, catalog))
}
