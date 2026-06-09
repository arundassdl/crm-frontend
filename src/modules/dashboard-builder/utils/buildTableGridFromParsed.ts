import type { ColDef } from 'ag-grid-community'

import type { ParsedReportGrid } from './parse-insights-query-result'

function isNumericColumnType(type: string): boolean {
  const t = type.toLowerCase()
  return (
    t.includes('int') ||
    t.includes('float') ||
    t.includes('currency') ||
    t.includes('percent') ||
    t === 'number'
  )
}

export function buildTableColumnDefs(parsed: ParsedReportGrid): ColDef[] {
  const metaByField = new Map(parsed.columnMeta.map(c => [c.field, c]))

  return parsed.columnFields.map(field => {
    const meta = metaByField.get(field)
    const headerName = meta?.label?.trim() || field.replace(/_/g, ' ')
    const numeric = isNumericColumnType(meta?.type ?? '')

    const col: ColDef = {
      field,
      headerName,
      flex: 1,
      minWidth: 100,
      sortable: true,
      resizable: true,
    }

    if (numeric) {
      col.type = 'numericColumn'
      col.valueFormatter = (p: { value: unknown }) => {
        if (p.value == null || p.value === '') return ''
        const n = typeof p.value === 'number' ? p.value : Number(String(p.value).replace(/[^0-9.-]/g, ''))
        return Number.isNaN(n) ? String(p.value) : n.toLocaleString()
      }
    }

    return col
  })
}

/** Data rows for the grid (excludes subtotal / grand total rows). */
export function buildTableRowData(parsed: ParsedReportGrid): Record<string, unknown>[] {
  const withoutTotals = parsed.rows.filter(r => {
    const variant = r._reportRowVariant
    return variant !== 'subtotal' && variant !== 'grand_total'
  })
  return withoutTotals.length > 0 ? withoutTotals : parsed.rows
}

export function buildTableGridFromParsed(parsed: ParsedReportGrid | null): {
  columnDefs: ColDef[]
  rowData: Record<string, unknown>[]
} {
  if (!parsed?.columnFields.length) {
    return { columnDefs: [], rowData: [] }
  }
  return {
    columnDefs: buildTableColumnDefs(parsed),
    rowData: buildTableRowData(parsed),
  }
}
