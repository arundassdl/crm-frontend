'use client'

import { memo } from 'react'

import type { DashboardWidget } from '../types'
import type { RuntimeFilterRow } from '../types/componentFilters'
import { isTableChartType } from '../utils/isTableChartType'
import { resolveKpiStyle } from '../utils/resolveKpiStyle'
import { findCatalogItem } from '../utils/widgetCatalog'
import { ChartWidget } from '../widgets/ChartWidget'
import { StaircaseWidget } from '../widgets/StaircaseWidget'
import { ComparatorWidget } from '../widgets/ComparatorWidget'
import { FunnelWidget } from '../widgets/FunnelWidget'
import { ProgressWidget } from '../widgets/ProgressWidget'
import { KpiCardWidget } from '../widgets/KpiCardWidget'
import { KpiWidget } from '../widgets/KpiWidget'
import { NumberCardWidget } from '../widgets/NumberCardWidget'
import { PivotWidget } from '../widgets/PivotWidget'
import { RankingKpiWidget } from '../widgets/RankingKpiWidget'
import { ScorecardKpiWidget } from '../widgets/ScorecardKpiWidget'
import { TableWidget } from '../widgets/TableWidget'

type WidgetRendererProps = {
  widget: DashboardWidget
  loading?: boolean
  /** Dashboard runtime "Display Component Filters" rows, applied for this query only. */
  runtimeFilters?: RuntimeFilterRow[]
}

function isTableWidget(widget: DashboardWidget): boolean {
  if (widget.type === 'table' || widget.config?.isReport === true) return true
  if (isTableChartType(String(widget.config?.chartType ?? ''))) return true

  const catalog = widget.catalogId ? findCatalogItem(widget.catalogId) : undefined
  if (catalog?.type === 'table') return true
  if (isTableChartType(catalog?.config?.chartType)) return true

  return false
}

function usesKpiCardLayout(widget: DashboardWidget): boolean {
  if (widget.config?.component_type === 'growth_index_kpi') return true
  const catalog = widget.catalogId ? findCatalogItem(widget.catalogId) : undefined
  const kpiStyle = resolveKpiStyle(widget, catalog)
  return kpiStyle === 'growth_index' || kpiStyle === 'standard'
}

function usesRankingKpiLayout(widget: DashboardWidget): boolean {
  const catalog = widget.catalogId ? findCatalogItem(widget.catalogId) : undefined
  return resolveKpiStyle(widget, catalog) === 'rankings'
}

function usesScorecardKpiLayout(widget: DashboardWidget): boolean {
  const catalog = widget.catalogId ? findCatalogItem(widget.catalogId) : undefined
  return resolveKpiStyle(widget, catalog) === 'scorecard'
}

function isComparatorWidget(widget: DashboardWidget): boolean {
  if (widget.type === 'comparator') return true
  const chartType = String(widget.config?.chartType ?? widget.config?.chart_type ?? '').toLowerCase()
  return chartType === 'comparator' || chartType.startsWith('comparator_')
}

function isStaircaseWidget(widget: DashboardWidget): boolean {
  const componentKind = String(widget.config?.componentKind ?? '').toLowerCase()
  if (componentKind === 'staircase') return true
  const chartType = String(widget.config?.chartType ?? widget.config?.chart_type ?? '').toLowerCase()
  return chartType === 'standard staircase'
}

function WidgetRendererInner({ widget, loading, runtimeFilters }: WidgetRendererProps) {
  const chartKind = widget.chartKind?.toLowerCase()
  const chartType = String(widget.config?.chartType ?? widget.config?.chart_type ?? '').toLowerCase()
  const comparatorStyle = String(widget.config?.comparator_style ?? '').toLowerCase()
  const compareAmong = String(widget.config?.compare_among ?? '').toLowerCase()

  if (isStaircaseWidget(widget)) {
    return <StaircaseWidget widget={widget} loading={loading} runtimeFilters={runtimeFilters} />
  }

  // Comparator must be routed first — before chartKind/table checks — because
  // some comparator chart_types (e.g. comparator_elegant_time_period) would
  // otherwise fall through to ChartWidget via the chartKind='bar' default.
  if (isComparatorWidget(widget)) {
    console.log('[WidgetRenderer]', {
      chart_type: chartType,
      comparator_style: comparatorStyle,
      compare_among: compareAmong,
      renderer_selected: 'ComparatorWidget',
    })
    return <ComparatorWidget widget={widget} loading={loading} />
  }

  if (isTableWidget(widget) || chartKind === 'table') {
    console.log('[WidgetRenderer]', { chart_type: chartType, renderer_selected: 'TableWidget' })
    return <TableWidget widget={widget} loading={loading} />
  }

  if (chartKind === 'progress' || chartType === 'progress') {
    console.log('[WidgetRenderer]', { chart_type: chartType, chartKind, renderer_selected: 'ProgressWidget' })
    return <ProgressWidget widget={widget} loading={loading} runtimeFilters={runtimeFilters} />
  }

  if (chartKind && ['pie', 'bar', 'line', 'scatter'].includes(chartKind)) {
    console.log('[WidgetRenderer]', { chart_type: chartType, chartKind, renderer_selected: 'ChartWidget (chartKind)' })
    return <ChartWidget widget={widget} loading={loading} runtimeFilters={runtimeFilters} />
  }

  switch (widget.type?.toLowerCase()) {
    case 'kpi':
      if (usesScorecardKpiLayout(widget)) {
        return <ScorecardKpiWidget widget={widget} loading={loading} runtimeFilters={runtimeFilters} />
      }
      if (usesRankingKpiLayout(widget)) {
        return <RankingKpiWidget widget={widget} loading={loading} runtimeFilters={runtimeFilters} />
      }
      if (usesKpiCardLayout(widget)) {
        return <KpiCardWidget widget={widget} loading={loading} runtimeFilters={runtimeFilters} />
      }
      return <KpiWidget widget={widget} loading={loading} runtimeFilters={runtimeFilters} />
    case 'number':
      return <NumberCardWidget widget={widget} loading={loading} />
    case 'chart':
      return <ChartWidget widget={widget} loading={loading} runtimeFilters={runtimeFilters} />
    case 'funnel':
      return <FunnelWidget widget={widget} loading={loading} />
    case 'table':
      return <TableWidget widget={widget} loading={loading} />
    case 'pivot':
      return <PivotWidget widget={widget} loading={loading} />
    default:
      return (
        <div className="flex h-full items-center justify-center text-sm text-slate-400">
          Unsupported widget
        </div>
      )
  }
}

export const WidgetRenderer = memo(WidgetRendererInner)
