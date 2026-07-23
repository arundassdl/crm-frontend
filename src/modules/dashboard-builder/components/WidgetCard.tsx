'use client'

import { memo, useState } from 'react'
import { Tooltip } from '@mui/material'
import {
  ChartBar,
  ChartPie,
  ChartLineUp,
  Table as TableIcon,
  SquaresFour,
  Info,
  FileText,
  ArrowSquareOut,
} from '@phosphor-icons/react'

import type { DashboardWidget } from '../types'
import type { RuntimeFilterRow } from '../types/componentFilters'
import { widgetCardClass, widgetHeaderClass } from '../styles/classes'
import { ComponentFiltersButton, readComponentFilters } from './ComponentFiltersControl'
import { WidgetRenderer } from './WidgetRenderer'
import { WidgetToolbar } from './WidgetToolbar'

/** UI-only: pick a leading icon + accent colour from the widget's existing type/chartKind. */
function widgetVisual(widget: DashboardWidget): { Icon: React.ElementType; accent: string } {
  const t = `${widget.type ?? ''} ${widget.chartKind ?? ''}`.toLowerCase()
  if (t.includes('pie') || t.includes('donut')) return { Icon: ChartPie, accent: '#8B5CF6' }
  if (t.includes('table') || t.includes('pivot')) return { Icon: TableIcon, accent: '#10B981' }
  if (t.includes('line') || t.includes('area')) return { Icon: ChartLineUp, accent: '#06B6D4' }
  if (t.includes('bar') || t.includes('column') || t.includes('chart')) return { Icon: ChartBar, accent: '#06B6D4' }
  return { Icon: SquaresFour, accent: '#1D4ED8' }
}

/** Source report label already carried on the widget's config (read-only — no data logic added). */
function readSourceReportName(widget: DashboardWidget): string | undefined {
  const cfg = widget.config as Record<string, unknown> | undefined
  const props = widget.properties as Record<string, unknown> | undefined
  for (const key of ['reportName', 'savedReportName', 'queryName']) {
    const v = cfg?.[key] ?? props?.[key]
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return undefined
}

type WidgetCardProps = {
  widget: DashboardWidget
  selected?: boolean
  loading?: boolean
  readOnly?: boolean
  onSelect?: () => void
  onRefresh?: () => void
  onFullscreen?: () => void
  onEdit?: () => void
  onRemove?: () => void
}

function WidgetCardInner({
  widget,
  selected,
  loading,
  readOnly = false,
  onSelect,
  onRefresh,
  onFullscreen,
  onEdit,
  onRemove,
}: WidgetCardProps) {
  const [runtimeFilters, setRuntimeFilters] = useState<RuntimeFilterRow[]>([])
  const componentFilterFields = readComponentFilters(widget)
  const { Icon, accent } = widgetVisual(widget)
  // Source report is a builder-only affordance — hidden from the end-user dashboard view.
  const sourceReportName = readOnly ? undefined : readSourceReportName(widget)

  return (
    <div
      className={`${widgetCardClass} group h-full ${!readOnly && selected ? 'ring-2 ring-blue-500/70' : ''}`}
      onClick={readOnly ? undefined : onSelect}
      role={readOnly ? undefined : 'presentation'}
    >
      <div
        className={`${widgetHeaderClass}${
          readOnly ? '' : ' widget-header-drag cursor-grab active:cursor-grabbing'
        }`}
      >
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${accent}1F` }}
          aria-hidden
        >
          <Icon size={14} color={accent} weight="duotone" />
        </span>
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <Tooltip title={widget.title}>
            <span className="truncate text-[13px] font-bold text-[#0C2472] dark:text-white">
              {widget.title}
            </span>
          </Tooltip>
          {widget.description ? (
            <Tooltip title={widget.description}>
              <Info size={13} weight="bold" color="#94A3B8" className="flex-shrink-0 cursor-help" />
            </Tooltip>
          ) : null}
        </div>
        <div className="widget-no-drag ml-auto flex items-center gap-1">
          {componentFilterFields.length > 0 ? (
            <ComponentFiltersButton
              fields={componentFilterFields}
              values={runtimeFilters}
              onApply={setRuntimeFilters}
            />
          ) : null}
          {!readOnly ? (
            <WidgetToolbar
              compact
              onRefresh={onRefresh}
              onFullscreen={onFullscreen}
              onEdit={onEdit}
              onRemove={onRemove}
            />
          ) : null}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <WidgetRenderer widget={widget} loading={loading} runtimeFilters={runtimeFilters} />
      </div>
      {sourceReportName ? (
        <div className="flex w-full items-center justify-center gap-1.5 border-t border-[#E3ECFC] px-5 py-2 text-[11px] font-semibold text-[#4A5675] dark:border-[#27272A] dark:text-[#71717A]">
          <FileText size={12} weight="duotone" className="flex-shrink-0" />
          <span className="truncate">Source Report: {sourceReportName}</span>
          <ArrowSquareOut size={11} weight="bold" className="flex-shrink-0" />
        </div>
      ) : null}
    </div>
  )
}

export const WidgetCard = memo(WidgetCardInner)
