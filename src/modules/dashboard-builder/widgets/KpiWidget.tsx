'use client'

import { memo, useMemo } from 'react'

import type { DashboardWidget } from '../types'
import type { RuntimeFilterRow } from '../types/componentFilters'
import { useInsightsQueryResult } from '../hooks/useInsightsQueryResult'
import { extractKpiValue } from '../utils/extractKpiValue'
import { isBasicKpiStyle, resolveKpiStyle } from '../utils/resolveKpiStyle'
import { resolveWidgetQueryName } from '../utils/resolveWidgetQueryName'
import { findCatalogItem } from '../utils/widgetCatalog'

type KpiWidgetProps = {
  widget: DashboardWidget
  loading?: boolean
  runtimeFilters?: RuntimeFilterRow[]
}

function BasicKpiContent({ value }: { value: string }) {
  return (
    <div className="flex h-full flex-col justify-start px-4 pb-4 pt-3">
      <p className="text-[1.875rem] font-bold leading-none tracking-[-0.02em] text-slate-800">
        {value}
      </p>
    </div>
  )
}

function KpiWidgetInner({ widget, loading, runtimeFilters }: KpiWidgetProps) {
  const catalog = widget.catalogId ? findCatalogItem(widget.catalogId) : undefined
  const kpiStyle = resolveKpiStyle(widget, catalog)
  const isBasic = isBasicKpiStyle(kpiStyle)
  const label = widget.title || catalog?.kpiLabel || 'KPI'
  const queryName = resolveWidgetQueryName(widget)

  const { parsed, isLoading: queryLoading } = useInsightsQueryResult({
    queryName,
    enabled: Boolean(queryName),
    runtimeFilters,
  })

  const liveValue = useMemo(() => extractKpiValue(parsed), [parsed])
  const value =
    liveValue ??
    (widget.config?.value as string | undefined) ??
    catalog?.kpiValue ??
    '—'

  const showLoading = loading || (Boolean(queryName) && queryLoading && !liveValue)

  if (showLoading) {
    if (isBasic) {
      return (
        <div className="flex h-full px-4 pb-4 pt-3">
          <div className="h-[1.875rem] w-16 animate-pulse rounded bg-slate-200" />
        </div>
      )
    }
    return (
      <div className="flex h-full animate-pulse flex-col justify-center gap-2 px-4 py-3">
        <div className="h-4 w-32 rounded bg-slate-200" />
        <div className="h-8 w-24 rounded bg-slate-200" />
      </div>
    )
  }

  if (isBasic) {
    return <BasicKpiContent value={value} />
  }

  const renderKPI = () => {
    switch (kpiStyle) {
      case 'scorecard':
        return (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium text-slate-700">{label}</p>
            <div className="flex flex-col gap-2 text-xs">
              <div className="flex justify-between border-b border-slate-100 pb-1 font-semibold uppercase tracking-wider text-slate-400">
                <span>Lead Source</span>
                <span>Amount</span>
              </div>
              {[
                { name: 'Advertisement', amt: '$550', chg: '14%', up: true },
                { name: 'Google+', amt: '$550', chg: '22%', up: false },
                { name: 'Cold Call', amt: '$340', chg: '13%', up: true },
                { name: 'Chat', amt: '$220', chg: '19%', up: false },
              ].map((row, i) => (
                <div key={i} className="flex justify-between text-slate-600">
                  <span>{row.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">{row.amt}</span>
                    <span className={`flex items-center ${row.up ? 'text-emerald-500' : 'text-red-500'}`}>
                      {row.up ? <i className="ri-arrow-up-s-fill" /> : <i className="ri-arrow-down-s-fill" />}
                      {row.chg}
                    </span>
                  </div>
                </div>
              ))}
              <p className="mt-1 text-[10px] italic tracking-tight text-slate-400">
                * Compared with Last year
              </p>
            </div>
          </div>
        )
      case 'rankings':
        return (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium text-slate-700">{label}</p>
            <div className="flex flex-col gap-2 text-xs">
              <div className="flex justify-between border-b border-slate-100 pb-1 font-semibold uppercase tracking-wider text-slate-400">
                <span>Deal Owner</span>
                <span>Amount</span>
              </div>
              {[
                { name: 'Mark', amt: '$1280' },
                { name: 'Jason', amt: '$1010' },
                { name: 'Michael', amt: '$777' },
                { name: 'Steve', amt: '$728' },
                { name: 'David', amt: '$696' },
              ].map((row, i) => (
                <div key={i} className="flex justify-between text-slate-600">
                  <span className="font-medium">
                    {i + 1}. {row.name}
                  </span>
                  <span className="font-semibold text-slate-900">{row.amt}</span>
                </div>
              ))}
            </div>
          </div>
        )
      default:
        return (
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
              <p className="mt-1 text-sm font-medium text-slate-500">{label}</p>
            </div>
            {catalog?.icon ? (
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <i className={`${catalog.icon} text-lg`} aria-hidden />
              </span>
            ) : null}
          </div>
        )
    }
  }

  return <div className="flex h-full flex-col justify-center overflow-hidden px-4 py-3">{renderKPI()}</div>
}

export const KpiWidget = memo(KpiWidgetInner)
