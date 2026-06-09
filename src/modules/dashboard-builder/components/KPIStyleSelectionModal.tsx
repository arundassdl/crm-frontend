'use client'

import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
    Autocomplete,
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

import {
    EMPTY_MODULE_LIST,
    EMPTY_RELATED_MODULE_LIST,
    useQuickChartModuleListing,
    useQuickChartRelatedModules,
} from '../hooks/useQuickChartModules'
import { useQuickChartModuleFields } from '../hooks/useQuickChartModuleFields'
import { getMeasureDisplayParts } from '../utils/measureGroupingRules'
import type { AggregateOption } from '../utils/buildAggregateOptions'
import { QuickChartCriteriaFilterSection } from './quick-chart/QuickChartCriteriaFilter'
import { getFieldFilterCategory } from '../utils/report-filters/field-category'
import { flattenCatalogFields } from '../utils/report-filters/flatten-catalog-fields'
import { kpiStyleToCatalogItem } from '../utils/addComponentCatalog'
import type { WidgetCatalogItem } from '../types'
import { createEmptyQuickChartFilter } from '../utils/report-filters/quick-chart-filter-default'
import { readAccessTokenString } from '@/utils/accessTokenDataStorage'
import { saveReport } from '@/services/api/report-addon/save-report-api'
import { buildKpiReportDefinition } from '../utils/buildKpiReportDefinition'
import { QUICK_CHART_DASHBOARDS } from '../utils/quickChartPreview'
import { dashboardComponentKeys } from '../hooks/useDashboardComponents'

export type KPIStyle = 'standard' | 'growth_index' | 'basic' | 'scorecard' | 'rankings'

interface KPIStyleOption {
    id: KPIStyle
    label: string
    renderPreview: () => React.ReactNode
}

const KPI_STYLES: KPIStyleOption[] = [
    {
        id: 'standard',
        label: 'Standard',
        renderPreview: () => (
            <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm">
                <p className="text-xs font-semibold text-slate-800">Revenue This Month</p>
                <div className="flex items-center gap-2">
                    <p className="text-xl font-bold text-slate-900">$300</p>
                    <span className="flex items-center gap-0.5 text-xs font-medium text-emerald-500">
                        <i className="ri-arrow-up-s-fill" /> 3.09%
                    </span>
                </div>
                <p className="text-[10px] text-slate-400">Last Month: $291</p>
            </div>
        ),
    },
    {
        id: 'growth_index',
        label: 'Growth Index',
        renderPreview: () => (
            <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm">
                <p className="text-xs font-semibold text-slate-800">Revenue This Month</p>
                <div className="flex items-center gap-2">
                    <p className="text-xl font-bold text-slate-900">$391</p>
                    <span className="flex items-center gap-0.5 text-xs font-medium text-red-500">
                        13.11%
                    </span>
                </div>
                <p className="text-[10px] text-slate-400">Last Month: $450</p>
            </div>
        ),
    },
    {
        id: 'basic',
        label: 'Basic',
        renderPreview: () => (
            <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white text-left shadow-sm">
                <p className="border-b border-slate-100 px-4 py-2 text-sm font-semibold text-slate-800">
                    Overdue Tasks
                </p>
                <p className="px-4 py-3 text-3xl font-bold leading-none tracking-tight text-slate-800">40</p>
            </div>
        ),
    },
    {
        id: 'scorecard',
        label: 'Scorecard',
        renderPreview: () => (
            <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm">
                <p className="text-xs font-semibold text-slate-800">Top Leads Sources</p>
                <div className="flex flex-col gap-1.5 overflow-hidden text-[10px]">
                    <div className="flex justify-between border-b border-slate-100 pb-1 font-medium text-slate-400 uppercase tracking-tight">
                        <span>Lead Source</span>
                        <span>Amount</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                        <span>Advertisement</span>
                        <span className="flex items-center gap-1">$550 <span className="text-emerald-500 font-medium">14%</span></span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                        <span>Google+</span>
                        <span className="flex items-center gap-1">$550 <span className="text-red-500 font-medium">22%</span></span>
                    </div>
                    <p className="text-[8px] text-slate-300 mt-1 italic">* Compared with Last year</p>
                </div>
            </div>
        ),
    },
    {
        id: 'rankings',
        label: 'Rankings',
        renderPreview: () => (
            <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm">
                <p className="text-xs font-semibold text-slate-800">Top 5 Deals owners</p>
                <div className="flex flex-col gap-1 overflow-hidden text-[10px]">
                    <div className="flex justify-between border-b border-slate-100 pb-1 font-medium text-slate-400 uppercase tracking-tight">
                        <span>Deal Owner</span>
                        <span>Amount</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                        <span>1. Mark</span>
                        <span>$1280</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                        <span>2. Jason</span>
                        <span>$1010</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                        <span>3. Michael</span>
                        <span>$777</span>
                    </div>
                </div>
            </div>
        ),
    },
]

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
                gap: { xs: 0.5, md: 1 },
                mb: 2,
                alignItems: alignTop ? 'flex-start' : { md: 'center' },
            }}
        >
            <Box sx={{ ...labelCellSx, pt: alignTop ? 1.25 : 1 }}>{label}</Box>
            <Box sx={fieldCellSx}>{children}</Box>
        </Box>
    )
}

export type KPIStyleSelectionModalProps = {
    open: boolean
    onClose: () => void
    onDone: (item: WidgetCatalogItem) => void
}


function KPIStyleSelectionModalInner({ open, onClose, onDone }: KPIStyleSelectionModalProps) {
    const [view, setView] = useState<'selection' | 'config'>('selection')
    const [selectedStyle, setSelectedStyle] = useState<KPIStyle | null>(null)
    const userToken = readAccessTokenString()

    const [form, setForm] = useState({
        name: 'Revenue This Month',
        primaryModule: '',
        relatedModule: '',
        measure: '',
        durationField: '',
        durationValue: 'Select duration',
        shortened: false,
        showComponentFilters: false,
        filterField: '',
        displayRecordCount: false,
        showCriteriaFilter: false,
        criteriaFilters: [] as any[],
    })

    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState<string | undefined>()
    const queryClient = useQueryClient()

    // Data fetching hooks (same as QuickChartModal)
    const { data: moduleOptions, isLoading: modulesLoading } = useQuickChartModuleListing(open)
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
            open && Boolean(primaryModuleForApi)
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
    }, [form.primaryModule, form.relatedModule, moduleOptionsList, primaryModuleForApi, relatedOptions])

    const {
        catalogByModule,
        layoutByModule,
        picklistModuleByModule,
        aggregateOptions: measureOptions,
        aggregateOptionsById: measureOptionsById,
        isLoading: fieldsCatalogLoading,
    } = useQuickChartModuleFields({
        moduleOrder,
        enabled: open && moduleOrder.length > 0,
    })

    const dateFieldOptions = useMemo(() => {
        const all = flattenCatalogFields(moduleOrder, catalogByModule)
        return all.filter(opt => {
            const cat = getFieldFilterCategory(opt.field.fieldtype, opt.field.frontendFieldtype)
            return cat === 'date' || cat === 'datetime'
        })
    }, [catalogByModule, moduleOrder])

    const measuresLoading = fieldsCatalogLoading

    useEffect(() => {
        if (!open) {
            setView('selection')
            setSelectedStyle(null)
            return
        }
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [open, onClose])

    useEffect(() => {
        if (!open || modulesLoading || moduleOptionsList.length === 0) return
        if (!form.primaryModule) {
            setForm(prev => ({ ...prev, primaryModule: moduleOptionsList[0].value }))
        }
    }, [form.primaryModule, moduleOptionsList, modulesLoading, open])

    useEffect(() => {
        if (!form.relatedModule) return
        const stillValid = relatedOptions.some(
            o => o.value === form.relatedModule || o.label === form.relatedModule
        )
        if (!relatedLoading && !stillValid) {
            setForm(prev => ({ ...prev, relatedModule: '' }))
        }
    }, [form.relatedModule, relatedLoading, relatedOptions])

    const patch = (partial: Partial<typeof form>) => {
        setForm(prev => {
            const next = { ...prev, ...partial }
            if (partial.primaryModule != null && partial.primaryModule !== prev.primaryModule) {
                next.relatedModule = ''
                next.measure = ''
            }
            if (partial.relatedModule != null && partial.relatedModule !== prev.relatedModule) {
                next.measure = ''
            }
            return next
        })
    }

    const handleStyleClick = (styleId: KPIStyle) => {
        setSelectedStyle(styleId)
        setView('config')
    }

    const handleBack = () => {
        setView('selection')
    }

    const canSubmit =
        Boolean(form.name.trim()) &&
        Boolean(form.primaryModule) &&
        Boolean(form.measure) &&
        (!form.durationField || form.durationValue !== 'Select duration')

    const isDoneDisabled = !canSubmit || saving

    const handleDone = useCallback(async () => {
        if (!canSubmit || !userToken || !selectedStyle) return
        setSaving(true)
        setSaveError(undefined)
        try {
            const selectedMeasureOption = measureOptionsById.get(form.measure)
            if (!selectedMeasureOption) {
                setSaveError('Select a valid measure.')
                return
            }

            const catalogFields = flattenCatalogFields(moduleOrder, catalogByModule)

            const { reportname, json } = buildKpiReportDefinition({
                form,
                moduleOptions: moduleOptionsList,
                measureOption: selectedMeasureOption,
                relatedModuleOption: relatedOptions.find(o => o.value === form.relatedModule) || null,
                catalogFields,
                kpiStyle: selectedStyle,
            })

            const saveReportPayload = {
                reportname,
                jsonobject: json,
                name: null as string | null,
                is_report: 0,
            }

            const result = await saveReport(userToken, saveReportPayload)
            if (!result.ok) {
                setSaveError(result.error ?? 'Failed to save KPI.')
                return
            }

            await queryClient.invalidateQueries({ queryKey: dashboardComponentKeys.all })
            onDone(kpiStyleToCatalogItem(selectedStyle, { ...form, savedReportName: result.documentName }))
            onClose()
        } catch (err: unknown) {
            setSaveError(err instanceof Error ? err.message : 'Failed to save KPI.')
        } finally {
            setSaving(false)
        }
    }, [
        canSubmit,
        userToken,
        selectedStyle,
        measureOptionsById,
        moduleOrder,
        catalogByModule,
        form,
        moduleOptionsList,
        relatedOptions,
        queryClient,
        onDone,
        onClose,
    ])
    const selectedMeasureOption = measureOptionsById.get(form.measure)
    const primaryMeasureLabel = selectedMeasureOption?.label
    const isCountMeasure = selectedMeasureOption?.aggregation === 'count' || selectedMeasureOption?.aggregation === 'count_unique'

    if (!open) return null

    return (
        <Box
            className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto bg-black/40 px-4 py-6"
            role="presentation"
            onClick={onClose}
        >
            <Box
                role="dialog"
                aria-modal="true"
                aria-labelledby="kpi-style-title"
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    maxWidth: 1080,
                    borderRadius: 2,
                    maxHeight: '88vh',
                    bgcolor: 'background.paper',
                    boxShadow: 24,
                    overflow: 'hidden',
                }}
                onClick={e => e.stopPropagation()}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        px: 3,
                        py: 2,
                        borderBottom: 1,
                        borderColor: 'divider',
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {view === 'config' && (
                            <IconButton onClick={handleBack} size="small" sx={{ mr: 1 }}>
                                <i className="ri-arrow-left-line text-xl" />
                            </IconButton>
                        )}
                        <Typography variant="h6" component="h2" sx={{ fontWeight: 600, fontSize: '1.125rem' }}>
                            {view === 'config' ? 'Configure KPI' : 'Choose KPI Style'}
                        </Typography>
                    </Box>
                    <IconButton aria-label="Close" onClick={onClose} size="small">
                        <i className="ri-close-line text-xl" aria-hidden />
                    </IconButton>
                </Box>

                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', lg: 'row' },
                        alignItems: { lg: 'stretch' },
                        minHeight: 0,
                        flex: 1,
                        overflow: 'hidden',
                    }}
                >
                    <Box
                        sx={{
                            flex: 1,
                            minWidth: 0,
                            overflowY: 'auto',
                            px: 3,
                            py: 2.5,
                            borderRight: { lg: view === 'config' ? 1 : 0 },
                            borderColor: { lg: 'divider' },
                        }}
                    >
                        {view === 'selection' ? (
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {KPI_STYLES.map(style => (
                                    <button
                                        key={style.id}
                                        type="button"
                                        onClick={() => handleStyleClick(style.id)}
                                        className="group flex flex-col items-center gap-3"
                                    >
                                        <div className={`w-full transition-all group-hover:scale-[1.02] ${selectedStyle === style.id ? 'ring-2 ring-[var(--mui-palette-primary-main)]' : ''}`}>
                                            {style.renderPreview()}
                                        </div>
                                        <span className="text-sm font-medium text-[var(--mui-palette-text-secondary)] group-hover:text-[var(--mui-palette-text-primary)]">
                                            {style.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <Box>
                                <FormRow label={<Typography variant="body2">Component Name</Typography>}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        value={form.name}
                                        onChange={e => patch({ name: e.target.value })}
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
                                    </Box>
                                </FormRow>

                                <FormRow label={<Typography variant="body2">Measure</Typography>}>
                                    <FormControl
                                        fullWidth
                                        size="small"
                                        disabled={!form.primaryModule || measuresLoading}
                                    >
                                        <Select
                                            value={form.measure}
                                            displayEmpty
                                            onChange={e => patch({ measure: e.target.value })}
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
                                                <MenuItem key={opt.id} value={opt.id}>
                                                    <MeasureOptionLabel option={opt} />
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </FormRow>

                                <Box sx={{ pl: { md: '200px' }, mb: 2 }}>
                                    {!isCountMeasure && (
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    size="small"
                                                    checked={form.displayRecordCount}
                                                    onChange={e => patch({ displayRecordCount: e.target.checked })}
                                                />
                                            }
                                            label={<Typography variant="body2">Display record count</Typography>}
                                        />
                                    )}
                                </Box>

                                <FormRow label={<Typography variant="body2">Duration</Typography>}>
                                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                                        <Autocomplete
                                            fullWidth
                                            size="small"
                                            options={dateFieldOptions}
                                            getOptionLabel={opt => opt.displayLabel}
                                            value={dateFieldOptions.find(o => o.key === form.durationField) || null}
                                            onChange={(_, next) => patch({ durationField: next?.key ?? '' })}
                                            renderInput={params => (
                                                <TextField
                                                    {...params}
                                                    placeholder="Search date fields…"
                                                    sx={{
                                                        '& .MuiOutlinedInput-root': {
                                                            borderRadius: 1.5,
                                                            fontSize: '0.875rem',
                                                            bgcolor: 'background.paper',
                                                        },
                                                    }}
                                                />
                                            )}
                                            ListboxProps={{ sx: { maxHeight: 220, fontSize: '0.875rem' } }}
                                        />
                                        <FormControl fullWidth size="small">
                                            <Select
                                                value={form.durationValue}
                                                disabled={!form.durationField}
                                                onChange={e => patch({ durationValue: e.target.value })}
                                            >
                                                <MenuItem value="Select duration" disabled>
                                                    <em>Select duration</em>
                                                </MenuItem>
                                                <MenuItem value="Today">Today</MenuItem>
                                                <MenuItem value="Yesterday">Yesterday</MenuItem>
                                                <MenuItem value="This Week">This Week</MenuItem>
                                                <MenuItem value="Last Week">Last Week</MenuItem>
                                                <MenuItem value="This Month">This Month</MenuItem>
                                                <MenuItem value="Last Month">Last Month</MenuItem>
                                                <MenuItem value="This Quarter">This Quarter</MenuItem>
                                                <MenuItem value="Last Quarter">Last Quarter</MenuItem>
                                                <MenuItem value="This Year">This Year</MenuItem>
                                                <MenuItem value="Last Year">Last Year</MenuItem>
                                                <MenuItem value="Custom Range">Custom Range</MenuItem>
                                            </Select>
                                        </FormControl>
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
                                            onRemoveSection={() => patch({ showCriteriaFilter: false, criteriaFilters: [] })}
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

                    {selectedStyle !== 'basic' && (
                        <>
                            <Box sx={{ pl: { md: '200px' }, mb: 2 }}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            size="small"
                                            checked={form.shortened}
                                            onChange={e => patch({ shortened: e.target.checked })}
                                        />
                                    }
                                    label={<Typography variant="body2">Display as shortened numbers</Typography>}
                                />
                            </Box>

                            <FormRow
                                label={
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                size="small"
                                                checked={form.showComponentFilters}
                                                onChange={e => patch({ showComponentFilters: e.target.checked })}
                                            />
                                        }
                                        label={<Typography variant="body2">Display Component Filters</Typography>}
                                        sx={{ m: 0, mr: 0 }}
                                    />
                                }
                            >
                                <FormControl fullWidth size="small" disabled={!form.showComponentFilters}>
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
                            </FormRow>
                        </>
                    )}
                </Box>
                        )}
            </Box>

            {view === 'config' && (
                <Box
                    sx={{
                        width: { lg: 380 },
                        bgcolor: 'grey.50',
                        display: 'flex',
                        flexDirection: 'column',
                        borderLeft: { lg: 1 },
                        borderColor: { lg: 'divider' },
                    }}
                >
                    <Box sx={{ p: 3, flex: 1 }}>
                        <Box
                            sx={{
                                bgcolor: 'background.paper',
                                borderRadius: 2,
                                border: 1,
                                borderColor: 'divider',
                                p: 3,
                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                minHeight: 160,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                            }}
                        >
                            {selectedStyle === 'basic' ? (
                                <Typography
                                    sx={{
                                        fontWeight: 700,
                                        fontSize: '1.875rem',
                                        lineHeight: 1,
                                        letterSpacing: '-0.02em',
                                        color: '#1e293b',
                                    }}
                                >
                                    40
                                </Typography>
                            ) : (
                                <>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b', mb: 1.5, minHeight: '1.25rem' }}>
                                        {form.name || 'Untitled'}
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="h3" sx={{ fontWeight: 700, color: '#0f172a' }}>
                                            $2000
                                        </Typography>
                                        {form.displayRecordCount && !isCountMeasure && (
                                            <Box
                                                sx={{
                                                    px: 0.75,
                                                    py: 0.25,
                                                    borderRadius: 1,
                                                    bgcolor: 'grey.100',
                                                    border: 1,
                                                    borderColor: 'divider',
                                                    fontSize: '1rem',
                                                    fontWeight: 600,
                                                    color: 'text.secondary',
                                                }}
                                            >
                                                3
                                            </Box>
                                        )}
                                    </Box>
                                    {primaryMeasureLabel && (
                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                                            Measure: {primaryMeasureLabel}
                                        </Typography>
                                    )}
                                </>
                            )}
                        </Box>
                    </Box>
                    <Box
                        sx={{
                            p: 2.5,
                            borderTop: 1,
                            borderColor: 'divider',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: 1.5,
                            bgcolor: 'background.paper',
                        }}
                    >
                        {saveError && (
                            <Typography variant="caption" color="error" sx={{ flex: 1, minWidth: 0, mr: 2 }}>
                                {saveError}
                            </Typography>
                        )}
                        <Button
                            variant="outlined"
                            onClick={onClose}
                            disabled={saving}
                            size="small"
                            sx={{ color: 'text.primary', borderColor: 'divider', px: 2 }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            disabled={isDoneDisabled}
                            onClick={() => void handleDone()}
                            size="small"
                            sx={{ bgcolor: 'primary.main', px: 3 }}
                        >
                            {saving ? 'Saving...' : 'Done'}
                        </Button>
                    </Box>
                </Box>
            )}
        </Box>
            </Box>
        </Box>
    )
}

export const KPIStyleSelectionModal = memo(KPIStyleSelectionModalInner)
