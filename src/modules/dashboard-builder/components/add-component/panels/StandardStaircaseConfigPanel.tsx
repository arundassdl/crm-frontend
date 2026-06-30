'use client'

import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  FormControl,
  Link,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'

import type { WidgetCatalogItem } from '../../../types'
import type { QuickChartCriteriaFilter } from '../../../types/quickChartFilter'
import { addComponentToCatalogItem } from '../../../utils/addComponentCatalog'
import { EMPTY_MODULE_LIST, useQuickChartModuleListing } from '../../../hooks/useQuickChartModules'
import { useQuickChartModuleFields } from '../../../hooks/useQuickChartModuleFields'
import { dashboardComponentKeys } from '../../../hooks/useDashboardComponents'
import { flattenCatalogFields } from '../../../utils/report-filters/flatten-catalog-fields'
import { getFieldFilterCategory } from '../../../utils/report-filters/field-category'
import { isStageField } from '../../../utils/report-filters/select-field'
import { createEmptyQuickChartFilter } from '../../../utils/report-filters/quick-chart-filter-default'
import { QuickChartCriteriaFilterSection } from '../../quick-chart/QuickChartCriteriaFilter'
import { buildStaircaseReportDefinition } from '../../../utils/buildStaircaseReportDefinition'
import { saveReport } from '@/services/api/report-addon/save-report-api'
import { DurationFields, FormRow, type DurationFormState } from '../../kpi/kpiFormShared'
import { StaircasePreview } from '../../stage/StaircasePreview'
import { readAccessTokenString } from '@/utils/accessTokenDataStorage'

export type StandardStaircaseConfigPanelProps = {
  /** Whether the panel is mounted/active — gates data fetching and form reset. */
  active: boolean
  onClose: () => void
  onDone: (item: WidgetCatalogItem) => void
}

const SHORTENED_FORMATS: { value: string; label: string }[] = [
  { value: 'K', label: 'Thousands (K)' },
  { value: 'M', label: 'Millions (M)' },
  { value: 'B', label: 'Billions (B)' },
]

const EMPTY_DURATION: DurationFormState = {
  durationField: '',
  durationValue: 'Select duration',
  durationLastValue: '',
  durationLastUnit: 'day',
  durationFromDate: '',
  durationToDate: '',
}

/** The Standard Staircase always counts records in the Deals module. */
function findDealsModule(options: { value: string; label: string }[]) {
  const norm = (s: string) => s.trim().toLowerCase()
  return (
    options.find(o => norm(o.value) === 'deals' || norm(o.label) === 'deals') ??
    options.find(o => norm(o.value).includes('deal') || norm(o.label).includes('deal'))
  )
}

/**
 * Standard Staircase configuration screen (Component Name, "Define Count Of",
 * Duration, Criteria Filter, shortened-number formatting, and Won/Lost target
 * stages) with a live mock staircase preview.
 *
 * The module is fixed to Deals, the Stage Field offers the Deals module's
 * Stage-type fields, and the Won/Lost target stages are read-only values derived
 * from the selected Stage Field.
 *
 * On Done, calls `save_report` to create an Insights Query (same flow as Basic
 * KPI), then hands the saved document name to the parent via `onDone` so the
 * widget can fetch live query results via `useInsightsQueryResult`.
 */
function StandardStaircaseConfigPanelInner({ active, onClose, onDone }: StandardStaircaseConfigPanelProps) {
  const userToken = readAccessTokenString()
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | undefined>()

  // Define Count Of — module is fixed to Deals; only the Stage Field is selectable.
  const [stageField, setStageField] = useState('')

  // Duration (same component + behaviour as Basic KPI).
  const [duration, setDuration] = useState<DurationFormState>(EMPTY_DURATION)

  // Criteria Filter (same multi-row component as Basic KPI).
  const [showCriteriaFilter, setShowCriteriaFilter] = useState(false)
  const [criteriaFilters, setCriteriaFilters] = useState<QuickChartCriteriaFilter[]>([])

  // Shortened numbers
  const [shortened, setShortened] = useState(false)
  const [shortenedFormat, setShortenedFormat] = useState('K')
  const [shortenedDecimals, setShortenedDecimals] = useState(0)

  const { data: moduleOptions } = useQuickChartModuleListing(active)
  const moduleOptionsList = moduleOptions ?? EMPTY_MODULE_LIST
  const dealsModule = useMemo(() => findDealsModule(moduleOptionsList), [moduleOptionsList])
  const dealsModuleLabel = dealsModule?.label ?? 'Deals'

  const moduleOrder = useMemo(
    () => (dealsModule ? [{ value: dealsModule.value, label: dealsModule.label }] : []),
    [dealsModule]
  )
  const {
    catalogByModule,
    layoutByModule,
    picklistModuleByModule,
    isLoading: fieldsLoading,
  } = useQuickChartModuleFields({
    moduleOrder,
    enabled: active && moduleOrder.length > 0,
  })

  const dealsFields = useMemo(
    () => flattenCatalogFields(moduleOrder, catalogByModule),
    [moduleOrder, catalogByModule]
  )

  // Stage Field dropdown — only Deals fields whose type is "Stage".
  const stageFieldOptions = useMemo(
    () =>
      dealsFields
        .filter(o => isStageField(o.field))
        .map(o => ({ value: o.field.fieldName, label: o.field.label })),
    [dealsFields]
  )
  const stageFieldOption = stageFieldOptions.find(o => o.value === stageField)

  // Duration date-field options (Basic KPI Duration) — Deals date/datetime fields.
  const dateFieldOptions = useMemo(
    () =>
      dealsFields.filter(o => {
        const cat = getFieldFilterCategory(o.field.fieldtype, o.field.frontendFieldtype)
        return cat === 'date' || cat === 'datetime'
      }),
    [dealsFields]
  )

  // Target Stages are read-only values derived from the selected Stage Field.
  const wonStageValue = stageField ? 'All Closed Won Stages' : ''
  const lostStageValue = stageField ? 'All Closed Lost Stages' : ''

  // Reset the form whenever the panel is (re)activated.
  useEffect(() => {
    if (!active) return
    setName('')
    setSubmitted(false)
    setSaving(false)
    setSaveError(undefined)
    setStageField('')
    setDuration(EMPTY_DURATION)
    setShowCriteriaFilter(false)
    setCriteriaFilters([])
    setShortened(false)
    setShortenedFormat('K')
    setShortenedDecimals(0)
  }, [active])

  // Auto-select the Stage Field when the Deals module exposes exactly one.
  useEffect(() => {
    if (!stageField && stageFieldOptions.length === 1) {
      setStageField(stageFieldOptions[0].value)
    }
  }, [stageFieldOptions, stageField])

  const nameError = submitted && !name.trim() ? 'Component Name is required.' : ''

  const patchDuration = (partial: Partial<DurationFormState>) =>
    setDuration(prev => ({ ...prev, ...partial }))

  const handleDone = useCallback(async () => {
    setSubmitted(true)
    if (!name.trim() || !userToken) return

    setSaving(true)
    setSaveError(undefined)

    try {
      const title = name.trim()

      const { reportname, json } = buildStaircaseReportDefinition({
        name: title,
        moduleValue: dealsModule?.value ?? '',
        moduleLabel: dealsModuleLabel,
        stageField,
        stageFieldLabel: stageFieldOption?.label ?? stageField,
        durationField: duration.durationField,
        durationValue: duration.durationValue,
        durationLastValue: duration.durationLastValue,
        durationLastUnit: duration.durationLastUnit,
        durationFromDate: duration.durationFromDate,
        durationToDate: duration.durationToDate,
        criteriaFilters: showCriteriaFilter ? criteriaFilters : [],
        catalogFields: dealsFields,
      })

      const result = await saveReport(userToken, {
        reportname,
        jsonobject: json,
        name: null,
        is_report: 0,
      })

      if (!result.ok) {
        setSaveError(result.error ?? 'Failed to save Standard Staircase.')
        return
      }

      const savedReportName = result.documentName ?? ''

      await queryClient.invalidateQueries({ queryKey: dashboardComponentKeys.all })

      const base = addComponentToCatalogItem({
        kind: 'stage',
        label: 'Standard Staircase',
        icon: 'ri-stairs-line',
      })

      onDone({
        ...base,
        id: savedReportName || base.id,
        title,
        description: 'Standard Staircase dashboard component',
        config: {
          ...base.config,
          componentKind: 'staircase',
          component_name: title,
          chartType: 'Standard Staircase',
          queryName: savedReportName,
          savedReportName,
          module: dealsModule?.value ?? undefined,
          module_label: dealsModuleLabel,
          stage_field: stageField || undefined,
          stage_field_label: stageFieldOption?.label,
          duration_field: duration.durationField || undefined,
          period_type:
            duration.durationValue && duration.durationValue !== 'Select duration'
              ? duration.durationValue
              : undefined,
          period_last_value: duration.durationLastValue !== '' ? duration.durationLastValue : undefined,
          period_last_unit: duration.durationLastUnit || undefined,
          period_from_date: duration.durationFromDate || undefined,
          period_to_date: duration.durationToDate || undefined,
          shortened,
          ...(shortened ? { format: shortenedFormat, decimal_places: shortenedDecimals } : {}),
          won_stage: wonStageValue || undefined,
          lost_stage: lostStageValue || undefined,
        },
      })
      onClose()
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save Standard Staircase.')
    } finally {
      setSaving(false)
    }
  }, [
    name,
    userToken,
    dealsModule,
    dealsModuleLabel,
    stageField,
    stageFieldOption,
    duration,
    showCriteriaFilter,
    criteriaFilters,
    dealsFields,
    shortened,
    shortenedFormat,
    shortenedDecimals,
    wonStageValue,
    lostStageValue,
    queryClient,
    onDone,
    onClose,
  ])

  const rowLabel = (text: string) => <Typography variant="body2">{text}</Typography>

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', lg: 'row' },
          alignItems: { lg: 'flex-start' },
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        {/* Configuration */}
        <Box
          sx={{
            flex: { lg: '1 1 0' },
            minWidth: 0,
            overflowY: 'auto',
            px: 3,
            py: 2.5,
            borderRight: { lg: 1 },
            borderColor: { lg: 'divider' },
          }}
        >
          <Box sx={{ maxWidth: 640 }}>
            <FormRow label={rowLabel('Component Name')}>
              <TextField
                fullWidth
                size="small"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter Component Name"
                error={Boolean(nameError)}
                helperText={nameError}
              />
            </FormRow>

            <FormRow label={rowLabel('Define Count Of')}>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <FormControl size="small" sx={{ flex: 1, minWidth: 0 }}>
                  <Select value={dealsModule?.value ?? ''} readOnly>
                    {dealsModule && (
                      <MenuItem value={dealsModule.value}>{dealsModuleLabel}</MenuItem>
                    )}
                  </Select>
                </FormControl>
                <Autocomplete
                  size="small"
                  sx={{ flex: 1, minWidth: 0 }}
                  options={stageFieldOptions}
                  getOptionLabel={o => o.label}
                  value={stageFieldOption ?? null}
                  loading={fieldsLoading}
                  disabled={!dealsModule}
                  isOptionEqualToValue={(o, v) => o.value === v.value}
                  onChange={(_, next) => setStageField(next?.value ?? '')}
                  renderInput={params => (
                    <TextField
                      {...params}
                      placeholder={fieldsLoading ? 'Loading fields…' : 'Select stage field'}
                    />
                  )}
                />
              </Box>
            </FormRow>

            <DurationFields form={duration} patch={patchDuration} dateFieldOptions={dateFieldOptions} />

            {showCriteriaFilter ? (
              <Box sx={{ mb: 2 }}>
                <QuickChartCriteriaFilterSection
                  filters={criteriaFilters}
                  moduleOrder={moduleOrder}
                  catalogByModule={catalogByModule}
                  layoutByModule={layoutByModule}
                  picklistModuleByModule={picklistModuleByModule}
                  catalogLoading={fieldsLoading}
                  disabled={!dealsModule}
                  defaultModule={dealsModule?.value ?? ''}
                  userToken={userToken || undefined}
                  onChange={setCriteriaFilters}
                  onRemoveSection={() => {
                    setShowCriteriaFilter(false)
                    setCriteriaFilters([])
                  }}
                />
              </Box>
            ) : (
              <Box sx={{ mb: 2 }}>
                <Link
                  component="button"
                  type="button"
                  variant="body2"
                  underline="hover"
                  onClick={() => {
                    const initial = criteriaFilters.length
                      ? criteriaFilters
                      : [createEmptyQuickChartFilter(dealsModule?.value ?? '')]
                    setShowCriteriaFilter(true)
                    setCriteriaFilters(initial)
                  }}
                  disabled={!dealsModule}
                >
                  + Criteria filter
                </Link>
              </Box>
            )}

            <FormRow alignTop label={rowLabel('Display as Shortened Numbers')}>
              <Box>
                <Switch checked={shortened} onChange={e => setShortened(e.target.checked)} />
                {shortened && (
                  <Box sx={{ display: 'flex', gap: 1.5, mt: 1 }}>
                    <FormControl size="small" sx={{ flex: 1, minWidth: 0 }}>
                      <Select value={shortenedFormat} onChange={e => setShortenedFormat(e.target.value)}>
                        {SHORTENED_FORMATS.map(f => (
                          <MenuItem key={f.value} value={f.value}>
                            {f.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ flex: 1, minWidth: 0 }}>
                      <Select
                        value={shortenedDecimals}
                        onChange={e => setShortenedDecimals(Number(e.target.value))}
                      >
                        {[0, 1, 2].map(d => (
                          <MenuItem key={d} value={d}>
                            {d} decimal{d === 1 ? '' : 's'}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                )}
              </Box>
            </FormRow>

            <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 1, mb: 2 }}>
              Target Stages
            </Typography>

            <FormRow label={rowLabel('Won Stage')}>
              <TextField
                fullWidth
                size="small"
                value={wonStageValue}
                placeholder="All Closed Won Stages"
                InputProps={{ readOnly: true }}
                helperText="Auto-populated from the selected Stage Field (read-only)"
                FormHelperTextProps={{ sx: { mx: 0 } }}
              />
            </FormRow>

            <FormRow label={rowLabel('Lost Stage')}>
              <TextField
                fullWidth
                size="small"
                value={lostStageValue}
                placeholder="All Closed Lost Stages"
                InputProps={{ readOnly: true }}
                helperText="Auto-populated from the selected Stage Field (read-only)"
                FormHelperTextProps={{ sx: { mx: 0 } }}
              />
            </FormRow>
          </Box>
        </Box>

        {/* Preview */}
        <Box
          sx={{
            flex: { lg: '0 0 360px' },
            width: { lg: 360 },
            maxWidth: { lg: 360 },
            p: 2,
            minHeight: { xs: 260 },
            bgcolor: 'action.hover',
          }}
        >
          <StaircasePreview title={name} />
        </Box>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          px: 3,
          py: 2,
          borderTop: 1,
          borderColor: 'divider',
          flexShrink: 0,
          gap: 1,
        }}
      >
        {saveError && (
          <Alert severity="error" onClose={() => setSaveError(undefined)}>
            {saveError}
          </Alert>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1.5 }}>
          <Button variant="outlined" color="inherit" onClick={onClose} disabled={saving} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleDone}
            disabled={saving}
            sx={{ textTransform: 'none', bgcolor: '#4c6fff', '&:hover': { bgcolor: '#3957d5' } }}
          >
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Done'}
          </Button>
        </Box>
      </Box>
    </Box>
  )
}

export const StandardStaircaseConfigPanel = memo(StandardStaircaseConfigPanelInner)
