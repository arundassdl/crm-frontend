/** Ported from reports-app — parses Insights Query Result documents for chart/grid data. */

export type ReportRowVariant = 'data' | 'subtotal' | 'grand_total'

function tryParseJson(value: unknown): unknown {
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value) as unknown
  } catch {
    return null
  }
}

function columnKeyFromSpec(c: unknown): string | null {
  if (typeof c === 'string' && c.trim() !== '') return c
  if (c && typeof c === 'object') {
    const o = c as Record<string, unknown>
    const field = o.fieldname ?? o.field ?? o.name
    if (typeof field === 'string' && field.trim() !== '') return field
    const label = o.label
    if (typeof label === 'string' && label.trim() !== '') return label
  }
  return null
}

function classifyRow(row: Record<string, unknown>, keys: string[]): ReportRowVariant {
  const pick =
    keys
      .map(k => row[k])
      .find(v => v !== undefined && v !== null && String(v).trim() !== '') ?? null
  const s = pick != null ? String(pick).toLowerCase() : ''
  if (s.includes('grand total')) return 'grand_total'
  if (s.includes('subtotal') || s.includes('sub total')) return 'subtotal'
  return 'data'
}

function normalizeKeys(keys: string[]): string[] {
  return keys.filter(k => k && !k.startsWith('__') && k !== 'id' && k !== '_reportRowVariant')
}

export type ReportColumnMeta = {
  field: string
  label: string
  type: string
}

export type ParsedReportGrid = {
  columnFields: string[]
  columnMeta: ReportColumnMeta[]
  rows: Record<string, unknown>[]
}

function parseAddonInsightsResultsMatrix(matrix: unknown[]): ParsedReportGrid | null {
  const headerRow = matrix[0]
  if (!Array.isArray(headerRow) || headerRow.length === 0) return null

  const hasObjectMeta = headerRow.some(
    col => Boolean(col) && typeof col === 'object' && !Array.isArray(col) && 'label' in (col as Record<string, unknown>)
  )
  const hasStringHeader = headerRow.every(col => typeof col === 'string' && col.trim() !== '')
  if (!hasObjectMeta && !hasStringHeader) return null

  const columnFields: string[] = []
  const columnMeta: ReportColumnMeta[] = []
  const used = new Set<string>()
  headerRow.forEach((col, i) => {
    let key = `col_${i}`
    let label = ''
    let type = ''
    if (col && typeof col === 'object' && col !== null) {
      const meta = col as Record<string, unknown>
      if ('label' in meta) {
        label = String(meta.label).trim()
        const slug = label
          .replace(/\s+/g, '_')
          .replace(/[^a-zA-Z0-9_]/g, '')
          .slice(0, 80)
        key = slug || `col_${i}`
      }
      if ('type' in meta) {
        type = String(meta.type).trim()
      }
    } else if (typeof col === 'string') {
      label = col.trim()
      const slug = label
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_]/g, '')
        .slice(0, 80)
      key = slug || `col_${i}`
    }
    let final = key
    let n = 0
    while (used.has(final)) {
      final = `${key}_${++n}`
    }
    used.add(final)
    columnFields.push(final)
    columnMeta.push({
      field: final,
      label: label || final,
      type,
    })
  })

  const rows: Record<string, unknown>[] = []
  for (let r = 1; r < matrix.length; r++) {
    const cells = matrix[r]
    if (!Array.isArray(cells)) continue
    const row: Record<string, unknown> = {}
    columnFields.forEach((field, i) => {
      row[field] = cells[i]
    })
    const variant = classifyRow(row, columnFields)
    rows.push({
      ...row,
      id: `rpt-${r - 1}`,
      _reportRowVariant: variant,
    })
  }

  return columnFields.length ? { columnFields, columnMeta, rows } : null
}

export function parseInsightsQueryResultTable(
  doc: Record<string, unknown>
): ParsedReportGrid | null {
  const rawResults = doc.results
  const matrix = typeof rawResults === 'string' ? tryParseJson(rawResults) : rawResults
  if (Array.isArray(matrix) && matrix.length >= 2 && Array.isArray(matrix[0])) {
    const fromAddon = parseAddonInsightsResultsMatrix(matrix)
    if (fromAddon) return fromAddon
  }

  let rawRows: unknown[] | null = null
  let columnHints: string[] | null = null

  const candidates: unknown[] = [
    tryParseJson(doc.result),
    doc.result,
    tryParseJson(doc.data),
    doc.data,
    doc.rows,
    doc.table_data,
    doc.table,
  ].filter(c => c != null)

  for (const c of candidates) {
    if (Array.isArray(c)) {
      rawRows = c
      break
    }
    if (c && typeof c === 'object' && !Array.isArray(c)) {
      const o = c as Record<string, unknown>
      if (Array.isArray(o.rows)) {
        rawRows = o.rows as unknown[]
      }
      if (Array.isArray(o.columns)) {
        const hints = (o.columns as unknown[])
          .map(columnKeyFromSpec)
          .filter((x): x is string => typeof x === 'string')
        if (hints.length > 0) columnHints = hints
      }
      if (Array.isArray(o.data) && !rawRows) {
        rawRows = o.data as unknown[]
      }
      if (rawRows) break
    }
  }

  if (!rawRows?.length) {
    return null
  }

  const objectRows = rawRows.filter(
    (r): r is Record<string, unknown> =>
      r != null && typeof r === 'object' && !Array.isArray(r)
  )

  if (!objectRows.length) {
    return null
  }

  const keySet = new Set<string>()
  objectRows.forEach(r => {
    Object.keys(r).forEach(k => keySet.add(k))
  })

  const firstRowKeys = normalizeKeys(Object.keys(objectRows[0]))

  let columnFields =
    columnHints && columnHints.length > 0 ? columnHints.filter(h => keySet.has(h)) : []

  const keyList = Array.from(keySet)

  if (!columnFields.length) {
    columnFields = firstRowKeys.length > 0 ? firstRowKeys : normalizeKeys(keyList)
  } else {
    columnFields = normalizeKeys(columnFields)
  }

  if (!columnFields.length) {
    columnFields = normalizeKeys(keyList)
  }

  let columnMeta: ReportColumnMeta[] = columnFields.map(field => ({
    field,
    label: field.replace(/_/g, ' '),
    type: '',
  }))

  const knownFields = new Set(columnFields)
  for (const k of normalizeKeys(keyList)) {
    if (knownFields.has(k)) continue
    knownFields.add(k)
    columnFields.push(k)
    columnMeta.push({
      field: k,
      label: k.replace(/_/g, ' '),
      type: '',
    })
  }

  const rows: Record<string, unknown>[] = objectRows.map((r, idx) => {
    const variant = classifyRow(r, columnFields)
    return {
      ...r,
      id: `rpt-${idx}-${String(r.name ?? idx)}`,
      _reportRowVariant: variant,
    }
  })

  return { columnFields, columnMeta, rows }
}

export function guessAmountColumn(columnFields: string[]): string | null {
  const scores = columnFields.map(f => {
    const u = f.toLowerCase()
    let s = 0
    if (u.includes('count')) s += 4
    if (u.includes('amount')) s += 3
    if (u.includes('value') || u.includes('deal')) s += 2
    if (u.includes('sum')) s += 2
    if (u.includes('total') && u.includes('sum')) s += 2
    return { f, s }
  })
  scores.sort((a, b) => b.s - a.s)
  return scores[0]?.s > 0 ? scores[0].f : null
}

function parseCellNumber(value: unknown): number | null {
  if (typeof value === 'number' && !Number.isNaN(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const compact = value.replace(/[^0-9.-]/g, '')
    if (compact === '' || compact === '-' || compact === '.') return null
    const parsed = Number(compact)
    return Number.isNaN(parsed) ? null : parsed
  }
  return null
}

export function extractChartSeriesFromGrid(
  parsed: ParsedReportGrid
): { categories: string[]; values: number[]; categoryLabel: string; valueLabel: string } | null {
  const dataRows = parsed.rows.filter(r => r._reportRowVariant === 'data')
  if (!dataRows.length) return null

  const valueField =
    guessAmountColumn(parsed.columnFields) ??
    parsed.columnFields.find(f => {
      const sample = dataRows.find(r => parseCellNumber(r[f]) != null)
      return Boolean(sample)
    }) ??
    null

  if (!valueField) return null

  const categoryField =
    parsed.columnFields.find(f => f !== valueField) ?? parsed.columnFields[0]
  if (!categoryField) return null

  const categories: string[] = []
  const values: number[] = []

  for (const row of dataRows) {
    const rawCat = row[categoryField]
    const cat =
      rawCat != null && String(rawCat).trim() !== '' ? String(rawCat) : '—'
    const num = parseCellNumber(row[valueField])
    if (num == null) continue
    categories.push(cat)
    values.push(num)
  }

  if (!categories.length) return null

  const categoryMeta = parsed.columnMeta.find(m => m.field === categoryField)
  const valueMeta = parsed.columnMeta.find(m => m.field === valueField)

  return {
    categories,
    values,
    categoryLabel: categoryMeta?.label ?? categoryField,
    valueLabel: valueMeta?.label ?? valueField,
  }
}
