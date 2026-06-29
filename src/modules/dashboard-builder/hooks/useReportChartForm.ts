'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { fetchReportsForChart, fetchReportForEdit } from '@/services/api/report-addon/report-for-chart-api'
import type { ReportTableRef, ReportJoin, ReportColumn, ReportEditDetail } from '@/services/api/report-addon/report-for-chart-api'
import { readAccessTokenString } from '@/utils/accessTokenDataStorage'

import type { ChartKind } from '../types'
import type { GroupedReportOption } from '../components/report-chart/GroupedReportSelect'
import { useReportChartFilterFields } from './useReportChartFilterFields'

export type ReportMeasureOption = { value: string; label: string }
export type ReportGroupingOption = { value: string; label: string }
export type ComponentFilterRow = { id: number; field: string }

export type ReportChartFormErrors = Partial<
  Record<
    | 'componentName'
    | 'report'
    | 'measure'
    | 'grouping'
    | 'maxGrouping'
    | 'benchmarkValue',
    string
  >
>

const NUMERIC_FIELDTYPES = new Set([
  'int', 'integer', 'float', 'decimal', 'currency', 'percent',
  'number', 'check', 'checkbox', 'boolean',
])

function isNumericColumn(col: ReportColumn): boolean {
  const ft = col.fieldtype.trim().toLowerCase().replace(/\s+/g, '_')
  if (!ft) return false
  if (NUMERIC_FIELDTYPES.has(ft)) return true
  if (ft.includes('currency') || ft.includes('float') || ft.includes('percent') || ft.includes('decimal') || ft.includes('int')) return true
  return false
}

type FallbackAggregation = { key: string; label: string }

const TEXT_AGGREGATIONS: FallbackAggregation[] = [
  { key: 'count', label: 'Count of' },
  { key: 'count_unique', label: 'Count of Unique' },
]

const NUMERIC_AGGREGATIONS: FallbackAggregation[] = [
  { key: 'count', label: 'Count of' },
  { key: 'avg', label: 'Avg of' },
  { key: 'sum', label: 'Sum of' },
  { key: 'min', label: 'Min of' },
  { key: 'max', label: 'Max of' },
]

function buildFallbackMeasureOptions(columns: ReportColumn[]): ReportMeasureOption[] {
  const options: ReportMeasureOption[] = []
  for (const col of columns) {
    const numeric = isNumericColumn(col)
    const aggregations = numeric ? NUMERIC_AGGREGATIONS : TEXT_AGGREGATIONS
    console.log('[Measure] column:', col.label, '| type:', col.fieldtype, '| numeric:', numeric)
    const moduleSuffix = col.module_label ? ` - ${col.module_label}` : ''
    for (const agg of aggregations) {
      options.push({
        value: `${col.field}::${agg.key}`,
        label: `${agg.label} ${col.label}${moduleSuffix}`,
      })
    }
  }
  console.log('[Measure] Generated options:', options.map(o => o.label))
  return options
}

export const REPORT_CHART_SORT_OPTIONS = [
  { value: '', label: 'Default' },
  { value: 'value_desc', label: 'Value (Highest First)' },
  { value: 'value_asc', label: 'Value (Lowest First)' },
  { value: 'label_asc', label: 'Label (A → Z)' },
  { value: 'label_desc', label: 'Label (Z → A)' },
]

export const REPORT_CHART_MAX_GROUPING_OPTIONS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75].map(
  n => ({ value: String(n), label: String(n) })
)

export const SHORT_NUMBER_FORMAT_OPTIONS = [
  { value: 'K',     label: 'K (Thousands)' },
  { value: 'M',     label: 'M (Millions)' },
  { value: 'B',     label: 'B (Billions)' },
  { value: 'L',     label: 'L (Lakhs)' },
  { value: 'C',     label: 'C (Crores)' },
  { value: 'K-M-B', label: 'K (Thousands) - M (Millions) - B (Billions)' },
  { value: 'K-L-C', label: 'K (Thousands) - L (Lakhs) - C (Crores)' },
]

export const DECIMAL_PLACES_OPTIONS = [
  { value: '0', label: '0' },
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
]

const MAX_GROUPING_LIMIT = 75
const FALLBACK_GROUP = 'General Reports'

const SHORT_NUMBER_SAMPLE: Record<string, number> = {
  K:     1_600,
  M:     1_500_000,
  B:     2_500_000_000,
  L:     150_000,
  C:     25_000_000,
  'K-M-B': 1_500_000,
  'K-L-C': 150_000,
}

function applyShortFormat(value: number, format: string, decimals: number): string {
  const fmt = (n: number, suffix: string) => `${n.toFixed(decimals)}${suffix}`
  switch (format) {
    case 'K': return fmt(value / 1_000, 'K')
    case 'M': return fmt(value / 1_000_000, 'M')
    case 'B': return fmt(value / 1_000_000_000, 'B')
    case 'L': return fmt(value / 100_000, 'L')
    case 'C': return fmt(value / 10_000_000, 'C')
    case 'K-M-B':
      if (value >= 1_000_000_000) return fmt(value / 1_000_000_000, 'B')
      if (value >= 1_000_000)     return fmt(value / 1_000_000, 'M')
      if (value >= 1_000)         return fmt(value / 1_000, 'K')
      return String(value)
    case 'K-L-C':
      if (value >= 10_000_000) return fmt(value / 10_000_000, 'C')
      if (value >= 100_000)    return fmt(value / 100_000, 'L')
      if (value >= 1_000)      return fmt(value / 1_000, 'K')
      return String(value)
    default:
      return String(value)
  }
}

export type UseReportChartFormOptions = {
  open: boolean
}

export function useReportChartForm({ open }: UseReportChartFormOptions) {
  const token = readAccessTokenString()

  // Collection filter
  const [selectedCollection, setSelectedCollection] = useState('All')

  // Core fields
  const [componentName, setComponentName] = useState('')
  const [selectedReport, setSelectedReport] = useState('')
  const [selectedMeasure, setSelectedMeasure] = useState('')
  const [selectedGrouping, setSelectedGrouping] = useState('')
  const [sortBy, setSortBy] = useState('')
  const [maxGrouping, setMaxGrouping] = useState('75')
  const [chartKind, setChartKind] = useState<ChartKind>('column')
  const [submitted, setSubmitted] = useState(false)

  // Benchmark for Y-Axis
  const [benchmarkEnabled, setBenchmarkEnabled] = useState(false)
  const [benchmarkValue, setBenchmarkValue] = useState('')

  // Display as Shortened Numbers
  const [shortNumberEnabled, setShortNumberEnabled] = useState(false)
  const [shortNumberFormat, setShortNumberFormat] = useState('K')
  const [decimalPlaces, setDecimalPlaces] = useState('1')

  // Display Total Summary
  const [displayTotalSummary, setDisplayTotalSummary] = useState(false)

  // Display Component Filters
  const [displayComponentFilters, setDisplayComponentFilters] = useState(false)
  const [componentFilters, setComponentFilters] = useState<ComponentFilterRow[]>([])

  // Table and joins — stored explicitly from the selected report object at selection time
  const [reportTable, setReportTable] = useState<ReportTableRef | null>(null)
  const [reportJoins, setReportJoins] = useState<ReportJoin[]>([])

  // Filter row actions
  const addComponentFilter = useCallback(() => {
    setComponentFilters(prev => [...prev, { id: Date.now(), field: '' }])
  }, [])

  const removeComponentFilter = useCallback((id: number) => {
    setComponentFilters(prev => prev.filter(r => r.id !== id))
  }, [])

  const updateComponentFilter = useCallback((id: number, field: string) => {
    setComponentFilters(prev => prev.map(r => r.id === id ? { ...r, field } : r))
  }, [])

  // Reset all state when modal closes
  useEffect(() => {
    if (!open) {
      setSelectedCollection('All')
      setComponentName('')
      setSelectedReport('')
      setSelectedMeasure('')
      setSelectedGrouping('')
      setSortBy('')
      setMaxGrouping('75')
      setChartKind('column')
      setSubmitted(false)
      setBenchmarkEnabled(false)
      setBenchmarkValue('')
      setShortNumberEnabled(false)
      setShortNumberFormat('K')
      setDecimalPlaces('1')
      setDisplayTotalSummary(false)
      setDisplayComponentFilters(false)
      setComponentFilters([])
      setReportTable(null)
      setReportJoins([])
    }
  }, [open])

  // Load reports — includes row_groups, aggregate_columns, table, and joins
  const { data: rawReports, isLoading: reportsLoading } = useQuery({
    queryKey: ['report-chart-modal', 'report-for-chart'],
    queryFn: async () => {
      if (!token) throw new Error('Not authenticated')
      return fetchReportsForChart(token)
    },
    enabled: open && Boolean(token),
    staleTime: 5 * 60_000,
  })

  // Collection options built from unique collection values
  const collectionOptions: string[] = useMemo(() => {
    const set = new Set<string>()
    for (const r of rawReports ?? []) {
      const c = r.collection || FALLBACK_GROUP
      set.add(c)
    }
    const sorted = Array.from(set).sort((a, b) => a.localeCompare(b))
    return ['All', ...sorted]
  }, [rawReports])

  // Grouped dropdown options filtered by selected collection
  const reportOptions: GroupedReportOption[] = useMemo(() => {
    const all = (rawReports ?? []).map(r => ({
      value: r.name,
      label: r.title || r.name,
      group: r.collection || FALLBACK_GROUP,
    }))
    if (selectedCollection === 'All') return all
    return all.filter(r => r.group === selectedCollection)
  }, [rawReports, selectedCollection])

  const selectedReportLabel = reportOptions.find(r => r.value === selectedReport)?.label ?? ''

  // List-level metadata for the selected report (title, collection)
  const selectedRawReport = useMemo(
    () => (rawReports ?? []).find(r => r.name === selectedReport) ?? null,
    [rawReports, selectedReport]
  )

  // Full report configuration loaded on demand when a report is selected
  const { data: reportDetail, isLoading: reportDetailLoading } = useQuery({
    queryKey: ['report-chart-modal', 'report-for-edit', selectedReport],
    queryFn: async () => {
      if (!token || !selectedReport) throw new Error('Missing params')
      return fetchReportForEdit(token, selectedReport)
    },
    enabled: open && Boolean(token) && Boolean(selectedReport),
    staleTime: 5 * 60_000,
  })

  const isFallbackMode = Boolean(
    reportDetail &&
    reportDetail.aggregate_columns.length === 0 &&
    reportDetail.row_groups.length === 0
  )

  // Sync table/joins from the full report config
  useEffect(() => {
    if (reportDetail) {
      setReportTable(reportDetail.table)
      setReportJoins(reportDetail.joins)
    } else {
      setReportTable(null)
      setReportJoins([])
    }
  }, [reportDetail])

  // Measure options derived from full report config
  const measureOptions: ReportMeasureOption[] = useMemo(() => {
    if (!reportDetail) return []
    if (isFallbackMode) {
      return buildFallbackMeasureOptions(reportDetail.columns)
    }
    return reportDetail.aggregate_columns.map(c => ({
      label: c.label,
      value: `${c.fieldname}::${c.aggregation}`,
    }))
  }, [reportDetail, isFallbackMode])

  // Grouping options derived from full report config
  const groupingOptions: ReportGroupingOption[] = useMemo(() => {
    if (!reportDetail) return []
    if (isFallbackMode) {
      return reportDetail.columns.map(c => ({
        label: c.module_label ? `${c.label} - ${c.module_label}` : c.label,
        value: c.field,
      }))
    }
    return reportDetail.row_groups.map(g => ({
      label: g.module_label ? `${g.label} - ${g.module_label}` : g.label,
      value: g.field,
    }))
  }, [reportDetail, isFallbackMode])

  // Filter fields loaded from stored table/joins state (not re-derived from rawReports)
  const { flatFieldOptions, filterFieldsLoading } = useReportChartFilterFields({
    table: reportTable,
    joins: reportJoins,
    enabled: open && Boolean(selectedReport) && displayComponentFilters,
  })

  // Live example text — updates when format or decimal places changes
  const shortNumberExample = useMemo(() => {
    const d = parseInt(decimalPlaces, 10)
    const sample = SHORT_NUMBER_SAMPLE[shortNumberFormat] ?? 1_600
    return `Example: ${applyShortFormat(sample, shortNumberFormat, d)}`
  }, [shortNumberFormat, decimalPlaces])

  // Clear dependent fields when the selected collection changes
  const prevCollectionRef = useRef(selectedCollection)
  useEffect(() => {
    if (prevCollectionRef.current === selectedCollection) return
    prevCollectionRef.current = selectedCollection
    setSelectedReport('')
    setSelectedMeasure('')
    setSelectedGrouping('')
    setSortBy('')
    setComponentFilters([])
    setReportTable(null)
    setReportJoins([])
  }, [selectedCollection])

  // Clear dependent fields when the selected report changes
  const prevReportRef = useRef(selectedReport)
  useEffect(() => {
    if (prevReportRef.current === selectedReport) return
    prevReportRef.current = selectedReport
    setSelectedMeasure('')
    setSelectedGrouping('')
    setSortBy('')
    setComponentFilters([])
  }, [selectedReport])

  // Auto-select the first option when options first load
  useEffect(() => {
    if (!selectedMeasure && measureOptions.length > 0) {
      setSelectedMeasure(measureOptions[0].value)
    }
  }, [measureOptions, selectedMeasure])

  useEffect(() => {
    if (!selectedGrouping && groupingOptions.length > 0) {
      setSelectedGrouping(groupingOptions[0].value)
    }
  }, [groupingOptions, selectedGrouping])

  const errors: ReportChartFormErrors = useMemo(() => {
    const next: ReportChartFormErrors = {}
    if (!componentName.trim()) next.componentName = 'Component Name is required.'
    if (!selectedReport) next.report = 'Report is required.'
    if (!selectedMeasure) next.measure = 'Measure (Y-Axis) is required.'
    if (!selectedGrouping) next.grouping = 'Grouping is required.'
    if (parseInt(maxGrouping, 10) > MAX_GROUPING_LIMIT) {
      next.maxGrouping = `Maximum Grouping cannot exceed ${MAX_GROUPING_LIMIT}.`
    }
    if (benchmarkEnabled) {
      const v = parseFloat(benchmarkValue)
      if (!benchmarkValue.trim() || isNaN(v)) {
        next.benchmarkValue = 'Benchmark Value must be a valid number.'
      }
    }
    return next
  }, [componentName, selectedReport, selectedMeasure, selectedGrouping, maxGrouping, benchmarkEnabled, benchmarkValue])

  const displayErrors: ReportChartFormErrors = submitted ? errors : {}
  const canSubmit = Object.keys(errors).length === 0

  return {
    // Collection
    selectedCollection, setSelectedCollection,
    collectionOptions,

    // Core
    componentName, setComponentName,
    selectedReport, setSelectedReport,
    selectedReportLabel,
    selectedMeasure, setSelectedMeasure,
    selectedGrouping, setSelectedGrouping,
    sortBy, setSortBy,
    maxGrouping, setMaxGrouping,
    chartKind, setChartKind,

    // Fallback mode
    isFallbackMode,

    // Benchmark
    benchmarkEnabled, setBenchmarkEnabled,
    benchmarkValue, setBenchmarkValue,

    // Short numbers
    shortNumberEnabled, setShortNumberEnabled,
    shortNumberFormat, setShortNumberFormat,
    decimalPlaces, setDecimalPlaces,
    shortNumberExample,

    // Total summary
    displayTotalSummary, setDisplayTotalSummary,

    // Component filters
    displayComponentFilters, setDisplayComponentFilters,
    componentFilters,
    addComponentFilter,
    removeComponentFilter,
    updateComponentFilter,
    flatFieldOptions,
    filterFieldsLoading,

    // Report metadata (stored explicitly at selection time)
    reportTable,
    reportJoins,

    // Options
    reportOptions, reportsLoading,
    measureOptions, groupingOptions,
    selectedRawReport,
    reportDetail: reportDetail ?? null,
    docLoading: reportDetailLoading,

    // Form state
    errors: displayErrors,
    canSubmit,
    submitted, setSubmitted,
  }
}
