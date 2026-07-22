'use client'

import { memo, useMemo } from 'react'

import type { ColDef } from 'ag-grid-community'

import { DashboardAgGrid } from '../components/DashboardAgGrid'
import type { DashboardWidget } from '../types'
import { useInsightsQueryResult } from '../hooks/useInsightsQueryResult'
import { buildTableGridFromParsed } from '../utils/buildTableGridFromParsed'
import { resolveWidgetQueryName } from '../utils/resolveWidgetQueryName'

type TableWidgetProps = {
  widget: DashboardWidget
  loading?: boolean
}

const SAMPLE_ROWS = [
  { name: 'Acme Corp', stage: 'Proposal', owner: 'Alex', amount: 12000 },
  { name: 'Globex', stage: 'Negotiation', owner: 'Sam', amount: 8400 },
  { name: 'Initech', stage: 'Qualification', owner: 'Jordan', amount: 5200 },
  { name: 'Umbrella', stage: 'Closed Won', owner: 'Alex', amount: 22000 },
]

const SAMPLE_COLUMN_DEFS: ColDef[] = [
  { field: 'name', headerName: 'Name', flex: 1, minWidth: 120 },
  { field: 'stage', headerName: 'Stage', width: 130 },
  { field: 'owner', headerName: 'Owner', width: 110 },
  {
    field: 'amount',
    headerName: 'Amount',
    width: 110,
    valueFormatter: (p: { value: number }) =>
      p.value != null ? `$${Number(p.value).toLocaleString()}` : '',
  },
]

function TableWidgetInner({ widget, loading: loadingProp }: TableWidgetProps) {
  const queryName = resolveWidgetQueryName(widget)
  const useLiveData = Boolean(queryName)

  const { parsed, isLoading, isSuccess, error } = useInsightsQueryResult({
    queryName,
    enabled: useLiveData,
  })

  const gridDataKey = useMemo(() => {
    if (!parsed) return ''
    return `${parsed.columnFields.join('|')}:${parsed.rows.length}:${JSON.stringify(widget.properties?.columns)}`
  }, [parsed, widget.properties?.columns])

  const { columnDefs, rowData } = useMemo(() => {
    if (useLiveData && parsed) {
      const result = buildTableGridFromParsed(parsed)
      const allowedColumns = widget.properties?.columns
      if (allowedColumns && allowedColumns.length > 0) {
        const allowedSet = new Set(allowedColumns)
        result.columnDefs = result.columnDefs.filter(c => c.field && allowedSet.has(c.field))
      }
      return result
    }
    if (!useLiveData) {
      return { columnDefs: SAMPLE_COLUMN_DEFS, rowData: SAMPLE_ROWS }
    }
    return { columnDefs: [], rowData: [] }
  }, [gridDataKey, parsed, useLiveData, widget.properties?.columns])

  const loading = loadingProp || (useLiveData && isLoading && !isSuccess)

  if (loading) {
    return <div className="h-full min-h-[160px] animate-pulse bg-slate-50" />
  }

  if (useLiveData && error) {
    return (
      <div className="flex h-full min-h-[160px] flex-col items-center justify-center gap-1 px-3 text-center">
        <span className="text-xs font-medium text-red-600">Failed to load table data</span>
        <span className="text-[11px] text-slate-500">
          {error instanceof Error ? error.message : 'Unknown error'}
        </span>
      </div>
    )
  }

  if (useLiveData && isSuccess && !parsed) {
    return (
      <div className="flex h-full min-h-[160px] items-center justify-center px-3 text-center text-xs text-slate-500">
        Report data loaded but could not be displayed as a table. Check the query result format.
      </div>
    )
  }

  if (useLiveData && isSuccess && columnDefs.length === 0) {
    return (
      <div className="flex h-full min-h-[160px] items-center justify-center text-xs text-slate-500">
        No columns in report result
      </div>
    )
  }

  if (useLiveData && isSuccess && rowData.length === 0) {
    return (
      <div className="flex h-full min-h-[160px] items-center justify-center text-xs text-slate-500">
        No Data Found
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-[160px] w-full flex-col overflow-hidden px-1 pb-1 pt-0">
      <div className="ag-theme-alpine min-h-0 flex-1 text-[13px] [&_.ag-root-wrapper]:h-full [&_.ag-root-wrapper]:rounded-xl [&_.ag-root-wrapper]:border [&_.ag-root-wrapper]:border-[#E3ECFC] dark:[&_.ag-root-wrapper]:!border-[#27272A] [&_.ag-header]:!bg-[#EFF6FF] dark:[&_.ag-header]:!bg-[#111113] [&_.ag-header]:!border-b-[#E3ECFC] dark:[&_.ag-header]:!border-b-[#27272A] [&_.ag-header-cell-text]:!text-[#0C2472] dark:[&_.ag-header-cell-text]:!text-[#9CA3AF] [&_.ag-header-cell-text]:!font-bold [&_.ag-header-cell-text]:!uppercase [&_.ag-header-cell-text]:!tracking-wider [&_.ag-row]:!border-[#EFF6FF] dark:[&_.ag-row]:!border-[#27272A] [&_.ag-cell]:!text-slate-700 dark:[&_.ag-cell]:!text-[#D4D4D8]">
        <DashboardAgGrid
          rowData={rowData}
          columnDefs={columnDefs}
          domLayout="normal"
          headerHeight={34}
          rowHeight={36}
          suppressCellFocus
          animateRows={false}
          minHeight={160}
        />
      </div>
    </div>
  )
}

export const TableWidget = memo(TableWidgetInner)
