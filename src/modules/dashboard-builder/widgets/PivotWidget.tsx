'use client'

import dynamic from 'next/dynamic'
import { memo, useMemo } from 'react'

import type { ColDef } from 'ag-grid-community'

import type { DashboardWidget } from '../types'

const AgGridReact = dynamic(
  () => import('ag-grid-react').then(m => m.AgGridReact),
  { ssr: false, loading: () => <div className="h-full animate-pulse bg-slate-50" /> }
)

type PivotWidgetProps = {
  widget: DashboardWidget
  loading?: boolean
}

/** Community AG Grid — grouped table; full pivotMode requires Enterprise license. */
function PivotWidgetInner({ widget, loading }: PivotWidgetProps) {
  const rowData = useMemo(
    () => [
      { owner: 'Alex', stage: 'Proposal', count: 4, amount: 32000 },
      { owner: 'Alex', stage: 'Won', count: 2, amount: 18000 },
      { owner: 'Sam', stage: 'Qualification', count: 3, amount: 9000 },
      { owner: 'Sam', stage: 'Proposal', count: 1, amount: 6000 },
      { owner: 'Jordan', stage: 'Negotiation', count: 2, amount: 11000 },
    ],
    []
  )

  const columnDefs = useMemo<ColDef[]>(
    () => [
      { field: 'owner', rowGroup: true, hide: true },
      { field: 'stage', width: 140 },
      { field: 'count', width: 90, aggFunc: 'sum' },
      {
        field: 'amount',
        width: 120,
        aggFunc: 'sum',
        valueFormatter: (p: { value: number }) =>
          p.value != null ? `$${Number(p.value).toLocaleString()}` : '',
      },
    ],
    []
  )

  if (loading) {
    return <div className="h-full animate-pulse bg-slate-50" />
  }

  return (
    <div className="ag-theme-alpine h-full w-full px-1 pb-1 pt-0 text-[13px] [&_.ag-root-wrapper]:rounded-md [&_.ag-root-wrapper]:border [&_.ag-root-wrapper]:border-slate-200">
      <AgGridReact
        rowData={rowData}
        columnDefs={columnDefs}
        groupDisplayType="groupRows"
        animateRows
        suppressAggFuncInHeader
        headerHeight={34}
        rowHeight={34}
      />
    </div>
  )
}

export const PivotWidget = memo(PivotWidgetInner)
