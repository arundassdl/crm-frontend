'use client'

import { useQueryClient } from '@tanstack/react-query'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  IconButton,
  Link,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material'
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'

import type { ChartKind, WidgetCatalogItem } from '../../../types'
import { DEFAULT_QUICK_CHART_FORM, type QuickChartFormState } from '../../../types/quickChart'
import { dashboardComponentKeys } from '../../../hooks/useDashboardComponents'
import { useQuickChartModuleFields } from '../../../hooks/useQuickChartModuleFields'
import {
  EMPTY_MODULE_LIST,
  EMPTY_RELATED_MODULE_LIST,
  useQuickChartModuleListing,
  useQuickChartRelatedModules,
} from '../../../hooks/useQuickChartModules'
import type { AggregateOption } from '../../../utils/buildAggregateOptions'
import { QuickChartCriteriaFilterSection } from '../../quick-chart/QuickChartCriteriaFilter'
import { ChartPreviewPanel } from '../../ChartPreviewPanel'
import { saveReport } from '@/services/api/report-addon/save-report-api'

import { quickChartConfigToCatalogItem } from '../../../utils/addComponentCatalog'
import { buildQuickChartReportDefinition } from '../../../utils/buildQuickChartReportDefinition'
import { readAccessTokenString } from '@/utils/accessTokenDataStorage'

import { createEmptyQuickChartFilter } from '../../../utils/report-filters/quick-chart-filter-default'
import {
  getFilledMeasureIds,
  getMeasureDisplayParts,
  isGroupingDisabledByMeasures,
} from '../../../utils/measureGroupingRules'

export type QuickChartConfigPanelProps = {
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

const MEASURE_MODULE_COLOR = '#0d9488'

function MeasureOptionLabel({ option }: { option: AggregateOption }) {
  const { title, moduleLabel } = getMeasureDisplayParts(option)
  return (
    <Box component="span" sx={{ fontSize: '0.875rem' }}>
      {title}
      {moduleLabel ? (
        <>
          {' - '}
          <Box component="span" sx={{ color: MEASURE_MODULE_COLOR, fontWeight: 500 }}>
            {moduleLabel}
          </Box>
        </>
      ) : null}
    </Box>
  )
}

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

function QuickChartConfigPanelInner({
  active,
  onClose,
  onDone,
  controlledChartKind,
}: QuickChartConfigPanelProps) {
  const [form, setForm] = useState<QuickChartFormState>(DEFAULT_QUICK_CHART_FORM)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | undefined>()
  const queryClient = useQueryClient()
  const userToken = readAccessTokenString()

  const { data: moduleOptions, isLoading: modulesLoading } =
    useQuickChartModuleListing(active)
  const moduleOptionsList = moduleOptions ?? EMPTY_MODULE_LIST

  const primaryModuleForApi = useMemo(() => {
    const opt = moduleOptionsList.find(
      o => o.value === form.primaryModule || o.label === form.primaryModule
    )
    return (opt?.label ?? form.primaryModule).trim()
  }, [form.primaryModule, moduleOptionsList])

  const { data: relatedOptions = EMPTY_RELATED_MODULE_LIST, isLoading: relatedLoading } =
    useQuickChartRelatedModules(
      primaryModuleForApi,
      active && Boolean(primaryModuleForApi)
    )

  const moduleOrder = useMemo(() => {
    const order: { value: string; label: string }[] = []
    const primaryOpt = moduleOptionsList.find(
      o => o.value === form.primaryModule || o.label === form.primaryModule
    )
    if (form.primaryModule) {
      order.push({
        value: form.primaryModule,
        label: primaryOpt?.label ?? primaryModuleForApi ?? form.primaryModule,
      })
    }
    if (form.relatedModule) {
      const relOpt = relatedOptions.find(
        o => o.value === form.relatedModule || o.label === form.relatedModule
      )
      order.push({
        value: form.relatedModule,
        label: relOpt?.label ?? form.relatedModule,
      })
    }
    return order
  }, [
    form.primaryModule,
    form.relatedModule,
    moduleOptionsList,
    primaryModuleForApi,
    relatedOptions,
  ])

  const {
    catalogByModule,
    layoutByModule,
    picklistModuleByModule,
    aggregateOptions: measureOptions,
    aggregateOptionsById: measureOptionsById,
    groupingOptions,
    groupingOptionsById,
    isLoading: fieldsCatalogLoading,
  } = useQuickChartModuleFields({
    moduleOrder,
    enabled: active && moduleOrder.length > 0,
  })

  const measuresLoading = fieldsCatalogLoading
  const groupingLoading = fieldsCatalogLoading

  useEffect(() => {
    if (active) {
      setForm(DEFAULT_QUICK_CHART_FORM)
    }
  }, [active])

  // Drive the chart kind from the external type cards when controlled.
  useEffect(() => {
    if (!controlledChartKind) return
    setForm(prev =>
      prev.chartKind === controlledChartKind ? prev : { ...prev, chartKind: controlledChartKind }
    )
  }, [controlledChartKind])

  useEffect(() => {
    if (!active || modulesLoading || moduleOptionsList.length === 0) return
    if (!form.primaryModule) {
      setForm(prev => ({ ...prev, primaryModule: moduleOptionsList[0].value }))
    }
  }, [form.primaryModule, moduleOptionsList, modulesLoading, active])

  useEffect(() => {
    if (!form.relatedModule) return
    const stillValid = relatedOptions.some(
      o => o.value === form.relatedModule || o.label === form.relatedModule
    )
    if (!relatedLoading && !stillValid) {
      setForm(prev => ({ ...prev, relatedModule: '' }))
    }
  }, [form.relatedModule, relatedLoading, relatedOptions])

  const filledMeasureIds = useMemo(
    () => getFilledMeasureIds(form.measures),
    [form.measures]
  )

  const selectedMeasureOptions = useMemo(
    () =>
      filledMeasureIds
        .map(id => measureOptionsById.get(id))
        .filter((o): o is AggregateOption => Boolean(o)),
    [filledMeasureIds, measureOptionsById]
  )

  const selectedGroupingLabel = groupingOptionsById.get(form.grouping)?.label
  const primaryMeasureLabel = selectedMeasureOptions[0]?.label

  const patch = (partial: Partial<QuickChartFormState>) => {
    setForm(prev => {
      const next = { ...prev, ...partial }
      if (partial.primaryModule != null && partial.primaryModule !== prev.primaryModule) {
        next.relatedModule = ''
        next.measures = ['']
        next.grouping = ''
      }
      if (partial.relatedModule != null && partial.relatedModule !== prev.relatedModule) {
        next.measures = ['']
        next.grouping = ''
      }
      return next
    })
  }

  const setMeasureAt = (index: number, value: string) => {
    setForm(prev => {
      const nextMeasures = [...prev.measures]
      nextMeasures[index] = value
      let nextGrouping = prev.grouping
      if (value && nextGrouping) {
        const groupingOpt = groupingOptionsById.get(nextGrouping)
        if (
          groupingOpt &&
          isGroupingDisabledByMeasures(groupingOpt, nextMeasures, measureOptionsById)
        ) {
          nextGrouping = ''
        }
      }
      return { ...prev, measures: nextMeasures, grouping: nextGrouping }
    })
  }

  const addMeasureRow = () => {
    setForm(prev => ({ ...prev, measures: [...prev.measures, ''] }))
  }

  const removeMeasureRow = (index: number) => {
    setForm(prev => {
      if (prev.measures.length <= 1) {
        return { ...prev, measures: [''] }
      }
      return {
        ...prev,
        measures: prev.measures.filter((_, i) => i !== index),
      }
    })
  }

  const isMeasureOptionTaken = (optionId: string, rowIndex: number) =>
    form.measures.some((id, i) => i !== rowIndex && id === optionId)

  const measureOptionIdsKey = useMemo(
    () => measureOptions.map(o => o.id).join('|'),
    [measureOptions]
  )

  const groupingOptionIdsKey = useMemo(
    () => groupingOptions.map(o => o.id).join('|'),
    [groupingOptions]
  )

  useEffect(() => {
    if (!active || measuresLoading) return

    setForm(prev => {
      let nextMeasures = prev.measures.map(id =>
        id && measureOptions.some(o => o.id === id) ? id : ''
      )
      const hasValid = nextMeasures.some(Boolean)
      if (!hasValid && measureOptions.length > 0) {
        const defaultOpt =
          measureOptions.find(
            o =>
              o.module === prev.primaryModule &&
              o.fieldname === '*' &&
              o.aggregation === 'count_unique'
          ) ?? measureOptions[0]
        if (defaultOpt) nextMeasures = [defaultOpt.id]
      }
      if (!nextMeasures.length) nextMeasures = ['']

      const measuresUnchanged =
        nextMeasures.length === prev.measures.length &&
        nextMeasures.every((id, i) => id === prev.measures[i])

      if (measuresUnchanged) return prev
      return { ...prev, measures: nextMeasures }
    })
  }, [active, measuresLoading, measureOptionIdsKey])

  useEffect(() => {
    if (!active || !form.grouping || groupingLoading) return

    setForm(prev => {
      if (!prev.grouping) return prev
      const groupingOpt = groupingOptionsById.get(prev.grouping)
      const shouldClear =
        (groupingOpt &&
          isGroupingDisabledByMeasures(
            groupingOpt,
            prev.measures,
            measureOptionsById
          )) ||
        !groupingOptions.some(o => o.id === prev.grouping)
      if (!shouldClear) return prev
      return { ...prev, grouping: '' }
    })
  }, [active, form.grouping, groupingLoading, groupingOptionIdsKey])

  const canSubmit =
    Boolean(form.componentName.trim()) &&
    Boolean(form.primaryModule) &&
    filledMeasureIds.length > 0 &&
    Boolean(form.grouping) &&
    Boolean(form.chartKind)

  const selectedRelatedOption = useMemo(
    () =>
      relatedOptions.find(
        o => o.value === form.relatedModule || o.label === form.relatedModule
      ) ?? null,
    [form.relatedModule, relatedOptions]
  )

  const handleDone = useCallback(async () => {
    if (!canSubmit || !userToken) return
    setSaving(true)
    setSaveError(undefined)
    try {
      const groupingOption = groupingOptionsById.get(form.grouping)
      if (!groupingOption) {
        setSaveError('Select a valid grouping field.')
        return
      }
      const { reportname, json } = buildQuickChartReportDefinition({
        form,
        moduleOptions: moduleOptionsList,
        measureOptions: selectedMeasureOptions,
        groupingOption,
        relatedModuleOption: selectedRelatedOption,
      })
      const saveReportPayload = {
        reportname,
        jsonobject: json,
        name: null as string | null,
        is_report: 0,
      }

      const result = await saveReport(userToken, saveReportPayload)
      if (!result.ok) {
        setSaveError(result.error ?? 'Failed to save chart.')
        return
      }
      await queryClient.invalidateQueries({ queryKey: dashboardComponentKeys.all })
      onDone(
        quickChartConfigToCatalogItem(
          form,
          selectedMeasureOptions,
          groupingOption,
          { savedReportName: result.documentName }
        )
      )
      onClose()
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save chart.')
    } finally {
      setSaving(false)
    }
  }, [
    canSubmit,
    form,
    groupingOptionsById,
    moduleOptionsList,
    onClose,
    onDone,
    queryClient,
    selectedMeasureOptions,
    selectedRelatedOption,
    userToken,
  ])

  useEffect(() => {
    if (!active) {
      setSaveError(undefined)
      setSaving(false)
    }
  }, [active])

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
              onChange={e => patch({ componentName: e.target.value })}
            />
          </FormRow>

          <FormRow label={<Typography variant="body2">Module(s)</Typography>} alignTop>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <FormControl fullWidth size="small" disabled={modulesLoading}>
                <Select
                  value={form.primaryModule}
                  displayEmpty
                  onChange={e => patch({ primaryModule: e.target.value })}
                >
                  <MenuItem value="" disabled>
                    <em>{modulesLoading ? 'Loading modules…' : 'Select module'}</em>
                  </MenuItem>
                  {moduleOptionsList.map(m => (
                    <MenuItem key={m.value} value={m.value}>
                      {m.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl
                fullWidth
                size="small"
                disabled={!form.primaryModule || relatedLoading}
              >
                <Select
                  value={form.relatedModule}
                  displayEmpty
                  onChange={e => patch({ relatedModule: e.target.value })}
                >
                  <MenuItem value="">
                    <em>
                      {!form.primaryModule
                        ? 'Select primary module first'
                        : relatedLoading
                          ? 'Loading related modules…'
                          : 'Select Related Module'}
                    </em>
                  </MenuItem>
                  {relatedOptions.map(m => (
                    <MenuItem key={m.value} value={m.value}>
                      {m.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {primaryModuleForApi && relatedOptions.length === 0 && !relatedLoading ? (
                <Typography variant="caption" color="text.secondary">
                  No related modules for {primaryModuleForApi}
                </Typography>
              ) : null}
            </Box>
          </FormRow>

          <FormRow label={<Typography variant="body2">Measure (y-axis)</Typography>} alignTop>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {form.measures.map((measureId, index) => {
                const isLastRow = index === form.measures.length - 1
                return (
                  <Box
                    key={`measure-row-${index}`}
                    sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                  >
                    <FormControl
                      fullWidth
                      size="small"
                      disabled={!form.primaryModule || measuresLoading}
                    >
                      <Select
                        value={measureId}
                        displayEmpty
                        onChange={e => setMeasureAt(index, e.target.value)}
                        renderValue={value => {
                          if (!value) {
                            return (
                              <Typography variant="body2" color="text.secondary" component="em">
                                {!form.primaryModule
                                  ? 'Select primary module first'
                                  : measuresLoading
                                    ? 'Loading measures…'
                                    : 'Select measure'}
                              </Typography>
                            )
                          }
                          const opt = measureOptionsById.get(value)
                          return opt ? <MeasureOptionLabel option={opt} /> : value
                        }}
                      >
                        <MenuItem value="" disabled>
                          <em>Select measure</em>
                        </MenuItem>
                        {measureOptions.map(opt => (
                          <MenuItem
                            key={opt.id}
                            value={opt.id}
                            disabled={isMeasureOptionTaken(opt.id, index)}
                          >
                            <MeasureOptionLabel option={opt} />
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <IconButton
                      size="small"
                      aria-label="Remove measure"
                      onClick={() => removeMeasureRow(index)}
                      sx={{ color: 'error.main' }}
                    >
                      <RemoveCircleOutlineIcon fontSize="small" />
                    </IconButton>
                    {isLastRow ? (
                      <IconButton
                        size="small"
                        aria-label="Add measure"
                        onClick={addMeasureRow}
                        disabled={!form.primaryModule || measuresLoading}
                        sx={{ color: 'success.main' }}
                      >
                        <AddCircleOutlineIcon fontSize="small" />
                      </IconButton>
                    ) : (
                      <Box sx={{ width: 34, flexShrink: 0 }} />
                    )}
                  </Box>
                )
              })}
            </Box>
          </FormRow>

          <FormRow label={<Typography variant="body2">Grouping</Typography>}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FormControl
                fullWidth
                size="small"
                disabled={!form.primaryModule || groupingLoading}
              >
                <Select
                  value={form.grouping}
                  displayEmpty
                  onChange={e => patch({ grouping: e.target.value })}
                >
                  <MenuItem value="" disabled>
                    <em>
                      {!form.primaryModule
                        ? 'Select primary module first'
                        : groupingLoading
                          ? 'Loading grouping fields…'
                          : 'Select grouping'}
                    </em>
                  </MenuItem>
                  {groupingOptions.map(opt => {
                    const disabledByMeasure = isGroupingDisabledByMeasures(
                      opt,
                      form.measures,
                      measureOptionsById
                    )
                    return (
                      <MenuItem
                        key={opt.id}
                        value={opt.id}
                        disabled={disabledByMeasure}
                      >
                        {opt.label}
                      </MenuItem>
                    )
                  })}
                </Select>
              </FormControl>
              <IconButton
                size="small"
                aria-label="Remove grouping"
                onClick={() => patch({ grouping: '' })}
                disabled={!form.grouping}
                sx={{ color: 'error.main' }}
              >
                <RemoveCircleOutlineIcon fontSize="small" />
              </IconButton>
            </Box>
          </FormRow>

          {form.showCriteriaFilter ? (
            <Box sx={{ pl: { md: '200px' }, mb: 2 }}>
              <QuickChartCriteriaFilterSection
                filters={form.criteriaFilters}
                moduleOrder={moduleOrder}
                catalogByModule={catalogByModule}
                layoutByModule={layoutByModule}
                picklistModuleByModule={picklistModuleByModule}
                catalogLoading={fieldsCatalogLoading}
                disabled={!form.primaryModule}
                defaultModule={form.primaryModule}
                userToken={userToken || undefined}
                onChange={criteriaFilters => patch({ criteriaFilters })}
                onRemoveSection={() =>
                  patch({ showCriteriaFilter: false, criteriaFilters: [] })
                }
              />
            </Box>
          ) : (
            <Box sx={{ pl: { md: '200px' }, mb: 2 }}>
              <Link
                component="button"
                type="button"
                variant="body2"
                underline="hover"
                onClick={() => {
                  const initial = form.criteriaFilters.length
                    ? form.criteriaFilters
                    : [createEmptyQuickChartFilter(form.primaryModule)]
                  patch({
                    showCriteriaFilter: true,
                    criteriaFilters: initial,
                  })
                }}
                disabled={!form.primaryModule}
              >
                + Criteria filter
              </Link>
            </Box>
          )}

          <Box sx={{ mb: 2.5 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.showComponentFilters}
                  onChange={e => patch({ showComponentFilters: e.target.checked })}
                />
              }
              label={<Typography variant="body2">Display Component Filters</Typography>}
              sx={{ m: 0, alignItems: 'center' }}
            />
            {form.showComponentFilters && (
              <Box sx={{ pl: 4, mt: 1 }}>
                <FormControl fullWidth size="small">
                  <Select
                    value={form.filterField}
                    displayEmpty
                    onChange={e => patch({ filterField: e.target.value })}
                  >
                    <MenuItem value="">
                      <em>Select field</em>
                    </MenuItem>
                    <MenuItem value="owner">Owner</MenuItem>
                    <MenuItem value="stage">Stage</MenuItem>
                    <MenuItem value="created_on">Created On</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            )}
          </Box>
        </Box>

        <ChartPreviewPanel
          chartKind={form.chartKind}
          onChartKindChange={chartKind => patch({ chartKind })}
          measureLabel={primaryMeasureLabel}
          groupingLabel={selectedGroupingLabel}
          hideSelector={Boolean(controlledChartKind)}
        />
      </Box>

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
          disabled={!canSubmit || saving || !userToken}
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

export const QuickChartConfigPanel = memo(QuickChartConfigPanelInner)
