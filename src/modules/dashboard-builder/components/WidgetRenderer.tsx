'use client'

import { memo } from 'react'

import type { DashboardWidget } from '../types'
import { isTableChartType } from '../utils/isTableChartType'
import { findCatalogItem } from '../utils/widgetCatalog'
import { ChartWidget } from '../widgets/ChartWidget'
import { FunnelWidget } from '../widgets/FunnelWidget'
import { KpiWidget } from '../widgets/KpiWidget'
import { NumberCardWidget } from '../widgets/NumberCardWidget'
import { PivotWidget } from '../widgets/PivotWidget'
import { TableWidget } from '../widgets/TableWidget'

type WidgetRendererProps = {
  widget: DashboardWidget
  loading?: boolean
}

function isTableWidget(widget: DashboardWidget): boolean {
  if (widget.type === 'table' || widget.config?.isReport === true) return true
  if (isTableChartType(String(widget.config?.chartType ?? ''))) return true

  const catalog = widget.catalogId ? findCatalogItem(widget.catalogId) : undefined
  if (catalog?.type === 'table') return true
  if (isTableChartType(catalog?.config?.chartType)) return true

  return false
}

function WidgetRendererInner({ widget, loading }: WidgetRendererProps) {
  const chartKind = widget.chartKind?.toLowerCase()

  if (isTableWidget(widget) || chartKind === 'table') {
    return <TableWidget widget={widget} loading={loading} />
  }

  if (chartKind && ['pie', 'bar', 'line', 'scatter'].includes(chartKind)) {
    return <ChartWidget widget={widget} loading={loading} />
  }

  switch (widget.type?.toLowerCase()) {
    case 'kpi':
      return <KpiWidget widget={widget} loading={loading} />
    case 'number':
      return <NumberCardWidget widget={widget} loading={loading} />
    case 'chart':
      return <ChartWidget widget={widget} loading={loading} />
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
