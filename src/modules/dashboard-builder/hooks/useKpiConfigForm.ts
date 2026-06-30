'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import {
    EMPTY_MODULE_LIST,
    EMPTY_RELATED_MODULE_LIST,
    useQuickChartModuleListing,
    useQuickChartRelatedModules,
} from './useQuickChartModules'
import { useQuickChartModuleFields } from './useQuickChartModuleFields'
import { getFieldFilterCategory } from '../utils/report-filters/field-category'
import { flattenCatalogFields } from '../utils/report-filters/flatten-catalog-fields'
import { kpiStyleToCatalogItem } from '../utils/addComponentCatalog'
import { createEmptyQuickChartFilter } from '../utils/report-filters/quick-chart-filter-default'
import { readAccessTokenString } from '@/utils/accessTokenDataStorage'
import { saveReport } from '@/services/api/report-addon/save-report-api'
import { buildKpiReportDefinition } from '../utils/buildKpiReportDefinition'
import { dashboardComponentKeys } from './useDashboardComponents'
import type { WidgetCatalogItem } from '../types'
import type { ComponentFilterFieldConfig } from '../types/componentFilters'
import type { KPIStyle } from '../components/KPIStyleSelectionModal'

export function createDefaultKpiConfigForm() {
    return {
        name: '',
        primaryModule: '',
        relatedModule: '',
        measure: '',
        durationField: '',
        durationValue: 'Select duration',
        durationLastValue: '' as number | '',
        durationLastUnit: 'day' as 'day' | 'week' | 'month',
        durationFromDate: '',
        durationToDate: '',
        shortened: false,
        showComponentFilters: false,
        /** Up to 2 `GroupingOption.id` values, sourced from the selected module + related module. */
        componentFilterFields: [] as string[],
        displayRecordCount: false,
        showCriteriaFilter: false,
        criteriaFilters: [] as any[],
        compareTo: 'Previous Period' as 'Previous Period' | 'Previous Year' | 'Custom' | '',
        objective: 'increase_positive' as 'increase_positive' | 'decrease_positive' | '',
        comparisonFromDate: '',
        comparisonToDate: '',
        rankField: '',
        rankShow: 'Top 5' as 'Top 5' | 'Top 10' | 'Top 20' | 'Bottom 5' | 'Bottom 10' | 'Bottom 20',
        shortenedFormat: 'K' as 'K' | 'M' | 'B',
        shortenedDecimalPlaces: 0 as 0 | 1 | 2,
        shortenedMeasureIds: [] as string[],
    }
}

export type KpiConfigFormState = ReturnType<typeof createDefaultKpiConfigForm>

export type UseKpiConfigFormOptions = {
    open: boolean
    kpiStyle: KPIStyle
    onDone: (item: WidgetCatalogItem) => void
    onClose: () => void
}

/** Shared form state, data fetching, validation and save logic for KPI configuration modals. */
export function useKpiConfigForm({ open, kpiStyle, onDone, onClose }: UseKpiConfigFormOptions) {
    const userToken = readAccessTokenString()

    const [form, setForm] = useState(createDefaultKpiConfigForm)
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState<string | undefined>()
    const queryClient = useQueryClient()

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
        groupingOptions,
        groupingOptionsById,
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
            setForm(createDefaultKpiConfigForm())
            setSaveError(undefined)
        }
    }, [open])

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

    const patch = (partial: Partial<KpiConfigFormState>) => {
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

    const canSubmit =
        Boolean(form.name.trim()) &&
        Boolean(form.primaryModule) &&
        Boolean(form.measure) &&
        (!form.durationField || form.durationValue !== 'Select duration') &&
        (form.durationValue !== 'Last' ||
            (typeof form.durationLastValue === 'number' &&
                form.durationLastValue > 0 &&
                Boolean(form.durationLastUnit))) &&
        (form.durationValue !== 'Custom' ||
            (Boolean(form.durationFromDate) &&
                Boolean(form.durationToDate) &&
                form.durationFromDate <= form.durationToDate)) &&
        ((kpiStyle !== 'growth_index' && kpiStyle !== 'standard' && kpiStyle !== 'scorecard') ||
            (Boolean(form.compareTo) &&
                Boolean(form.objective) &&
                (form.compareTo !== 'Custom' ||
                    (Boolean(form.comparisonFromDate) &&
                        Boolean(form.comparisonToDate) &&
                        form.comparisonFromDate <= form.comparisonToDate)))) &&
        ((kpiStyle !== 'rankings' && kpiStyle !== 'scorecard') || Boolean(form.rankField))

    const isDoneDisabled = !canSubmit || saving

    const handleDone = useCallback(async () => {
        if (!canSubmit || !userToken) return
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
                kpiStyle,
                rankFieldOption: groupingOptionsById.get(form.rankField) || null,
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

            const componentFilters: ComponentFilterFieldConfig[] = form.showComponentFilters
                ? form.componentFilterFields
                    .map(id => groupingOptionsById.get(id))
                    .filter((opt): opt is NonNullable<typeof opt> => Boolean(opt))
                    .slice(0, 2)
                    .map(opt => {
                        const entry = catalogByModule[opt.moduleValue]?.find(
                            e => e.fieldName === opt.fieldName
                        )
                        return {
                            fieldname: opt.fieldName,
                            label: opt.fieldLabel,
                            module: opt.moduleLabel,
                            moduleValue: opt.moduleValue,
                            fieldtype: entry?.fieldtype ?? 'Data',
                            frontendFieldtype: entry?.frontendFieldtype,
                            options: entry?.options,
                            layoutName: entry?.layoutName,
                            picklistModule: entry?.picklistModule,
                            linkDoctype: entry?.linkDoctype,
                        }
                    })
                : []

            await queryClient.invalidateQueries({ queryKey: dashboardComponentKeys.all })
            onDone(
                kpiStyleToCatalogItem(kpiStyle, {
                    ...form,
                    savedReportName: result.documentName,
                    display_component_filters: form.showComponentFilters && componentFilters.length > 0,
                    component_filters: componentFilters,
                })
            )
            onClose()
        } catch (err: unknown) {
            setSaveError(err instanceof Error ? err.message : 'Failed to save KPI.')
        } finally {
            setSaving(false)
        }
    }, [
        canSubmit,
        userToken,
        kpiStyle,
        measureOptionsById,
        groupingOptionsById,
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
    const isCountMeasure =
        selectedMeasureOption?.aggregation === 'count' ||
        selectedMeasureOption?.aggregation === 'count_unique'
    const rankByLabel = groupingOptionsById.get(form.rankField)?.fieldLabel

    return {
        userToken,
        form,
        patch,
        saving,
        saveError,
        modulesLoading,
        moduleOptionsList,
        relatedOptions,
        relatedLoading,
        moduleOrder,
        catalogByModule,
        layoutByModule,
        picklistModuleByModule,
        measureOptions,
        measureOptionsById,
        groupingOptions,
        groupingOptionsById,
        fieldsCatalogLoading,
        measuresLoading,
        dateFieldOptions,
        canSubmit,
        isDoneDisabled,
        handleDone,
        selectedMeasureOption,
        primaryMeasureLabel,
        isCountMeasure,
        rankByLabel,
        createEmptyQuickChartFilter,
    }
}
