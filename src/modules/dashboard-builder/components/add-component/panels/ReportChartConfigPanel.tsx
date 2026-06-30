'use client'

import { memo, useCallback, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormHelperText,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material'

import type { ChartKind, WidgetCatalogItem } from '../../../types'
import { reportChartConfigToCatalogItem } from '../../../utils/addComponentCatalog'
import { ChartPreviewPanel } from '../../ChartPreviewPanel'
import {
  useReportChartForm,
  REPORT_CHART_SORT_OPTIONS,
  REPORT_CHART_MAX_GROUPING_OPTIONS,
  SHORT_NUMBER_FORMAT_OPTIONS,
  DECIMAL_PLACES_OPTIONS,
} from '../../../hooks/useReportChartForm'
import type { ReportChartAdditionalConfig } from '../../../utils/addComponentCatalog'
import type { ComponentFilterFieldConfig } from '../../../types/componentFilters'
import { GroupedReportSelect } from '../../report-chart/GroupedReportSelect'
import { saveReport } from '@/services/api/report-addon/save-report-api'
import { buildReportChartDefinition } from '../../../utils/buildReportChartDefinition'
import { readAccessTokenString } from '@/utils/accessTokenDataStorage'
import { dashboardComponentKeys } from '../../../hooks/useDashboardComponents'

export type ReportChartConfigPanelProps = {
  /** Whether the panel is mounted/active — gates data fetching and form reset. */
  active: boolean
  onClose: () => void
  onDone: (item: WidgetCatalogItem) => void
  /** When provided, the chart kind is driven externally (type cards) and the dropdown is hidden. */
  controlledChartKind?: ChartKind
}

const labelCellSx = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'flex-end',
  pt: 1,
  pr: 1,
  minWidth: { xs: '100%', md: 200 },
  flexShrink: 0,
}

const fieldCellSx = { flex: 1, minWidth: 0 }

function FormRow({
  label,
  children,
  alignTop,
}: {
  label: React.ReactNode
  children: React.ReactNode
  alignTop?: boolean
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: { xs: 0.5, md: 1.5 },
        mb: 2.5,
        alignItems: alignTop ? 'flex-start' : { md: 'center' },
      }}
    >
      <Box sx={{ ...labelCellSx, pt: alignTop ? 1.25 : 1 }}>{label}</Box>
      <Box sx={fieldCellSx}>{children}</Box>
    </Box>
  )
}

function ReportChartConfigPanelInner({
  active,
  onClose,
  onDone,
  controlledChartKind,
}: ReportChartConfigPanelProps) {
  const form = useReportChartForm({ open: active })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | undefined>()
  const queryClient = useQueryClient()
  const userToken = readAccessTokenString()

  useEffect(() => {
    if (!active) {
      setSaveError(undefined)
      setSaving(false)
    }
  }, [active])

  // Drive the chart kind from the external type cards when controlled.
  useEffect(() => {
    if (!controlledChartKind) return
    if (form.chartKind !== controlledChartKind) {
      form.setChartKind(controlledChartKind)
    }
  }, [controlledChartKind, form])

  const previewMeasureLabel = form.measureOptions.find(
    o => o.value === form.selectedMeasure
  )?.label
  const previewGroupingLabel = form.groupingOptions.find(
    o => o.value === form.selectedGrouping
  )?.label

  const handleDone = useCallback(async () => {
    form.setSubmitted(true)
    if (!form.canSubmit || !userToken) return
    if (!form.reportDetail) {
      setSaveError('Report configuration is not loaded. Please reselect the report.')
      return
    }
    if (!form.reportTable?.table) {
      setSaveError('Report table metadata is missing. Please reselect the report.')
      return
    }

    setSaving(true)
    setSaveError(undefined)

    try {
      const { reportname, json } = buildReportChartDefinition(
        form.reportDetail,
        form.reportTable,
        form.reportJoins,
        form.selectedMeasure,
        form.selectedGrouping,
        form.chartKind,
        form.componentName
      )

      const savePayload = {
        reportname,
        jsonobject: json,
        name: null as string | null,
        is_report: 0,
      }

      const result = await saveReport(userToken, savePayload)

      if (!result.ok) {
        setSaveError(result.error ?? 'Failed to save chart.')
        return
      }

      await queryClient.invalidateQueries({ queryKey: dashboardComponentKeys.all })

      const measureLabel = form.measureOptions.find(o => o.value === form.selectedMeasure)?.label
      const groupingLabel = form.groupingOptions.find(o => o.value === form.selectedGrouping)?.label

      const additionalConfig: ReportChartAdditionalConfig = {
        sortBy: form.sortBy || undefined,
        maxGrouping: parseInt(form.maxGrouping, 10),
        benchmarkEnabled: form.benchmarkEnabled,
        benchmarkValue: form.benchmarkEnabled && form.benchmarkValue
          ? parseFloat(form.benchmarkValue)
          : undefined,
        shortNumberEnabled: form.shortNumberEnabled,
        shortNumberFormat: form.shortNumberEnabled ? form.shortNumberFormat : undefined,
        decimalPlaces: form.shortNumberEnabled ? parseInt(form.decimalPlaces, 10) : undefined,
        displayTotalSummary: form.displayTotalSummary,
        displayComponentFilters: form.displayComponentFilters,
        componentFilters: form.displayComponentFilters
          ? form.componentFilters
              .map(r => form.flatFieldOptions.find(o => o.key === r.field))
              .filter((opt): opt is NonNullable<typeof opt> => Boolean(opt))
              .slice(0, 2)
              .map((opt): ComponentFilterFieldConfig => ({
                fieldname: opt.field.fieldName,
                label: opt.field.label,
                module: opt.moduleLabel,
                moduleValue: opt.moduleValue,
                fieldtype: opt.field.fieldtype,
                frontendFieldtype: opt.field.frontendFieldtype,
                options: opt.field.options,
                layoutName: opt.field.layoutName,
                picklistModule: opt.field.picklistModule,
                linkDoctype: opt.field.linkDoctype,
              }))
          : undefined,
        table: form.reportTable ?? undefined,
        joins: form.reportJoins.length ? form.reportJoins : undefined,
      }

      const item = reportChartConfigToCatalogItem(
        form.componentName,
        form.selectedReport,
        form.selectedReportLabel,
        form.chartKind,
        measureLabel,
        groupingLabel,
        additionalConfig,
        result.documentName
      )
      onDone(item)
      onClose()
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save chart.')
    } finally {
      setSaving(false)
    }
  }, [form, onDone, onClose, queryClient, userToken])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', lg: 'row' },
          alignItems: { lg: 'flex-start' },
          minHeight: 0,
          flex: 1,
          overflow: 'hidden',
        }}
      >
        {/* Left: form */}
        <Box
          sx={{
            flex: { lg: '1 1 65%' },
            minWidth: 0,
            overflowY: 'auto',
            px: 3,
            py: 2,
            borderRight: { lg: 1 },
            borderColor: { lg: 'divider' },
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(0,0,0,0.2) transparent',
            '&::-webkit-scrollbar': { width: 6 },
            '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: 'rgba(0,0,0,0.18)',
              borderRadius: 3,
              '&:hover': { bgcolor: 'rgba(0,0,0,0.3)' },
            },
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, fontSize: '0.9375rem', color: 'text.primary', mb: 2 }}
          >
            Configuration
          </Typography>

          <FormRow label={<Typography variant="body2">Component Name</Typography>}>
            <TextField
              fullWidth
              size="small"
              value={form.componentName}
              onChange={e => form.setComponentName(e.target.value)}
              placeholder="e.g. Leads by Industry"
              error={Boolean(form.errors.componentName)}
              helperText={form.errors.componentName}
            />
          </FormRow>

          <FormRow label={<Typography variant="body2">Collection</Typography>}>
            <FormControl fullWidth size="small" disabled={form.reportsLoading}>
              <Select
                value={form.selectedCollection}
                onChange={e => form.setSelectedCollection(e.target.value)}
              >
                {form.collectionOptions.map(opt => (
                  <MenuItem key={opt} value={opt}>
                    {opt}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </FormRow>

          <FormRow label={<Typography variant="body2">Report</Typography>}>
            <GroupedReportSelect
              options={form.reportOptions}
              value={form.selectedReport}
              onChange={form.setSelectedReport}
              loading={form.reportsLoading}
              error={Boolean(form.errors.report)}
              placeholder="Select a report"
            />
            {form.errors.report && (
              <p className="mt-1 text-xs text-red-500">{form.errors.report}</p>
            )}
          </FormRow>

          <FormRow label={<Typography variant="body2">Measure (Y-Axis)</Typography>}>
            <FormControl
              fullWidth
              size="small"
              error={Boolean(form.errors.measure)}
              disabled={!form.selectedReport || form.docLoading}
            >
              <Select
                value={form.selectedMeasure}
                displayEmpty
                onChange={e => form.setSelectedMeasure(e.target.value)}
                endAdornment={
                  form.docLoading && form.selectedReport ? (
                    <CircularProgress size={16} sx={{ mr: 3 }} />
                  ) : null
                }
              >
                <MenuItem value="" disabled>
                  <em>
                    {!form.selectedReport
                      ? 'Select a report first'
                      : form.docLoading
                        ? 'Loading measures…'
                        : form.measureOptions.length === 0
                          ? 'No measures available'
                          : 'Select measure'}
                  </em>
                </MenuItem>
                {form.measureOptions.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
              {form.errors.measure && <FormHelperText>{form.errors.measure}</FormHelperText>}
            </FormControl>
          </FormRow>

          <FormRow label={<Typography variant="body2">Grouping</Typography>}>
            <FormControl
              fullWidth
              size="small"
              error={Boolean(form.errors.grouping)}
              disabled={!form.selectedReport || form.docLoading}
            >
              <Select
                value={form.selectedGrouping}
                displayEmpty
                onChange={e => form.setSelectedGrouping(e.target.value)}
              >
                <MenuItem value="" disabled>
                  <em>
                    {!form.selectedReport
                      ? 'Select a report first'
                      : form.docLoading
                        ? 'Loading groupings…'
                        : form.groupingOptions.length === 0
                          ? 'No grouping fields available'
                          : 'Select grouping'}
                  </em>
                </MenuItem>
                {form.groupingOptions.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
              {form.errors.grouping && <FormHelperText>{form.errors.grouping}</FormHelperText>}
            </FormControl>
          </FormRow>

          <FormRow label={<Typography variant="body2">Sort By</Typography>}>
            <FormControl fullWidth size="small" disabled={!form.selectedReport}>
              <Select
                value={form.sortBy}
                displayEmpty
                onChange={e => form.setSortBy(e.target.value)}
              >
                {REPORT_CHART_SORT_OPTIONS.map(opt => (
                  <MenuItem key={opt.value || 'default'} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </FormRow>

          <FormRow label={<Typography variant="body2">Maximum Grouping</Typography>}>
            <FormControl
              fullWidth
              size="small"
              error={Boolean(form.errors.maxGrouping)}
              disabled={!form.selectedReport}
            >
              <Select
                value={form.maxGrouping}
                onChange={e => form.setMaxGrouping(e.target.value)}
              >
                {REPORT_CHART_MAX_GROUPING_OPTIONS.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
              {form.errors.maxGrouping && (
                <FormHelperText>{form.errors.maxGrouping}</FormHelperText>
              )}
            </FormControl>
          </FormRow>

          {/* Display options */}
          <Box sx={{ mt: 1, pt: 2.5, borderTop: 1, borderColor: 'divider' }}>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                mb: 1.5,
                display: 'block',
              }}
            >
              Display Options
            </Typography>

            {/* Benchmark for Y-Axis */}
            <Box sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.benchmarkEnabled}
                    onChange={e => form.setBenchmarkEnabled(e.target.checked)}
                  />
                }
                label={<Typography variant="body2">Benchmark for Y-Axis</Typography>}
                sx={{ m: 0 }}
              />
              {form.benchmarkEnabled && (
                <Box sx={{ pl: 4, mt: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    value={form.benchmarkValue}
                    onChange={e => form.setBenchmarkValue(e.target.value)}
                    placeholder="Benchmark Value"
                    error={Boolean(form.errors.benchmarkValue)}
                    helperText={form.errors.benchmarkValue}
                    inputProps={{ step: 'any' }}
                  />
                </Box>
              )}
            </Box>

            {/* Display as Shortened Numbers */}
            <Box sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.shortNumberEnabled}
                    onChange={e => form.setShortNumberEnabled(e.target.checked)}
                  />
                }
                label={<Typography variant="body2">Display as Shortened Numbers</Typography>}
                sx={{ m: 0 }}
              />
              {form.shortNumberEnabled && (
                <Box sx={{ pl: 4, mt: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ minWidth: 110, color: 'text.secondary' }}>
                      Format
                    </Typography>
                    <FormControl size="small" sx={{ flex: 1 }}>
                      <Select
                        value={form.shortNumberFormat}
                        onChange={e => form.setShortNumberFormat(e.target.value)}
                      >
                        {SHORT_NUMBER_FORMAT_OPTIONS.map(opt => (
                          <MenuItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ minWidth: 110, color: 'text.secondary' }}>
                      Decimal Places
                    </Typography>
                    <FormControl size="small" sx={{ flex: 1 }}>
                      <Select
                        value={form.decimalPlaces}
                        onChange={e => form.setDecimalPlaces(e.target.value)}
                      >
                        {DECIMAL_PLACES_OPTIONS.map(opt => (
                          <MenuItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {form.shortNumberExample}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Display Total Summary */}
            <Box sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.displayTotalSummary}
                    onChange={e => form.setDisplayTotalSummary(e.target.checked)}
                  />
                }
                label={<Typography variant="body2">Display Total Summary</Typography>}
                sx={{ m: 0 }}
              />
            </Box>

            {/* Display Component Filters */}
            <Box sx={{ mb: 0.5 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.displayComponentFilters}
                    onChange={e => {
                      form.setDisplayComponentFilters(e.target.checked)
                      if (e.target.checked && form.componentFilters.length === 0) {
                        form.addComponentFilter()
                      }
                    }}
                  />
                }
                label={<Typography variant="body2">Display Component Filters</Typography>}
                sx={{ m: 0 }}
              />
              {form.displayComponentFilters && (() => {
                const MAX_FILTERS = 2
                const canAdd = form.componentFilters.length < MAX_FILTERS
                const canRemove = form.componentFilters.length > 1
                return (
                  <Box sx={{ pl: 4, mt: 1, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    {form.componentFilters.map((row, idx) => {
                      const isLast = idx === form.componentFilters.length - 1
                      const selectedFields = form.componentFilters
                        .filter(r => r.id !== row.id && r.field)
                        .map(r => r.field)
                      const availableOptions = form.flatFieldOptions.filter(
                        o => !selectedFields.includes(o.key)
                      )
                      return (
                        <Box key={row.id} sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                          <FormControl fullWidth size="small" disabled={form.filterFieldsLoading}>
                            <Select
                              value={row.field}
                              displayEmpty
                              onChange={e => form.updateComponentFilter(row.id, e.target.value)}
                            >
                              <MenuItem value="" disabled>
                                <em>
                                  {form.filterFieldsLoading ? 'Loading fields…' : 'Select field'}
                                </em>
                              </MenuItem>
                              {row.field && !availableOptions.some(o => o.key === row.field) && (
                                <MenuItem value={row.field}>
                                  {form.flatFieldOptions.find(o => o.key === row.field)?.displayLabel ?? row.field}
                                </MenuItem>
                              )}
                              {availableOptions.map(opt => (
                                <MenuItem key={opt.key} value={opt.key}>
                                  {opt.displayLabel}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>

                          <Box
                            component="button"
                            type="button"
                            onClick={() => form.removeComponentFilter(row.id)}
                            disabled={!canRemove}
                            className={[
                              'flex h-7 w-7 shrink-0 items-center justify-center rounded transition',
                              canRemove
                                ? 'text-[var(--mui-palette-error-main)] hover:bg-[var(--mui-palette-error-main)]/8 cursor-pointer'
                                : 'cursor-not-allowed text-[var(--mui-palette-action-disabled)]',
                            ].join(' ')}
                            aria-label="Remove filter"
                          >
                            <i className="ri-subtract-line text-base" aria-hidden />
                          </Box>

                          <Box
                            component="button"
                            type="button"
                            onClick={form.addComponentFilter}
                            style={{ visibility: isLast && canAdd ? 'visible' : 'hidden' }}
                            className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded text-[var(--mui-palette-success-main)] transition hover:bg-[var(--mui-palette-success-main)]/8"
                            aria-label="Add filter"
                          >
                            <i className="ri-add-line text-base" aria-hidden />
                          </Box>
                        </Box>
                      )
                    })}
                  </Box>
                )
              })()}
            </Box>
          </Box>
        </Box>

        {/* Right: chart type + preview (shared with Add Chart Component) */}
        <ChartPreviewPanel
          chartKind={form.chartKind}
          onChartKindChange={form.setChartKind}
          measureLabel={previewMeasureLabel}
          groupingLabel={previewGroupingLabel}
          hideSelector={Boolean(controlledChartKind)}
        />
      </Box>

      {/* Footer */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 3,
          py: 2,
          borderTop: 1,
          borderColor: 'divider',
          flexShrink: 0,
        }}
      >
        {saveError ? (
          <Typography variant="body2" color="error" sx={{ flex: 1, minWidth: 0 }}>
            {saveError}
          </Typography>
        ) : (
          <Box sx={{ flex: 1 }} />
        )}
        <Button
          variant="outlined"
          color="inherit"
          onClick={onClose}
          disabled={saving}
          sx={{ textTransform: 'none' }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => void handleDone()}
          disabled={!form.canSubmit || saving || !userToken}
          sx={{
            textTransform: 'none',
            bgcolor: '#4c6fff',
            '&:hover': { bgcolor: '#3957d5' },
          }}
        >
          {saving ? 'Saving…' : 'Done'}
        </Button>
      </Box>
    </Box>
  )
}

export const ReportChartConfigPanel = memo(ReportChartConfigPanelInner)
