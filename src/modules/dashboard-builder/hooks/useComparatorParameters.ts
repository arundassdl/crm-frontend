'use client'

import { useEffect, useMemo, useState } from 'react'

import type { ModuleListingOption } from '@/services/api/sdl-metadata/modules-api'

import { buildComparisonBasedOnOptions } from '../utils/comparisonBasedOnOptions'
import { createWidgetId } from '../utils/layoutHelpers'
import { getFieldFilterCategory } from '../utils/report-filters/field-category'
import { flattenCatalogFields } from '../utils/report-filters/flatten-catalog-fields'
import type { ComparatorParameter } from '../types/comparatorParameter'
import { useQuickChartModuleFields } from './useQuickChartModuleFields'
import { EMPTY_RELATED_MODULE_LIST, useQuickChartRelatedModules } from './useQuickChartModules'

export type ComparatorParameterErrors = Partial<
  Record<'parameter_name' | 'module' | 'measure' | 'comparison_based_on' | 'associated_date_field', string>
>

export type UseComparatorParametersOptions = {
  open: boolean
  moduleOptionsList: ModuleListingOption[]
  compareAmongType?: string
  /** Module locked to the Compare Among picklist selection (picklist_values mode only). */
  picklistModuleValue?: string
  picklistModuleLabel?: string
}

function emptyDraft(): ComparatorParameter {
  return {
    id: createWidgetId('param'),
    parameter_name: '',
    module: '',
    module_label: '',
    measure: '',
    measure_label: '',
    comparison_based_on: 'owner',
    duration_field: '',
    duration_value: 'Select duration',
    duration_last_value: '',
    duration_last_unit: 'day',
    duration_from_date: '',
    duration_to_date: '',
    trend_up_is_positive: true,
  }
}

/** Manages the list of Comparison Parameters and the inline add/edit form state. */
export function useComparatorParameters({ open, moduleOptionsList, compareAmongType, picklistModuleValue, picklistModuleLabel }: UseComparatorParametersOptions) {
  const isTimePeriod = compareAmongType === 'time_period'
  const isPicklistValues = compareAmongType === 'picklist_values'
  const [parameters, setParameters] = useState<ComparatorParameter[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<ComparatorParameter | null>(null)
  const [paramSubmitted, setParamSubmitted] = useState(false)

  const draftModuleOption = moduleOptionsList.find(o => o.value === draft?.module)

  const relatedModulesEnabled = open && editingId !== null && Boolean(draftModuleOption)
  const { data: relatedModuleData, isLoading: relatedModulesLoading } = useQuickChartRelatedModules(
    draftModuleOption?.value ?? '',
    relatedModulesEnabled
  )
  const relatedModuleOptions = relatedModuleData ?? EMPTY_RELATED_MODULE_LIST

  // Measures (and the field catalog for the criteria filter / "Comparison Based On")
  // are scoped to the Related Module when one is selected, otherwise the Metric Module.
  // In time_period mode there is no Related Module, so always use the primary module.
  const measureModuleValue = isTimePeriod
    ? draftModuleOption?.value
    : (draft?.related_module || draftModuleOption?.value)
  const measureModuleLabel = (!isTimePeriod && draft?.related_module)
    ? draft.related_module_label || draft.related_module
    : draftModuleOption?.label

  const measureModuleOrder = useMemo(
    () => (measureModuleValue ? [{ value: measureModuleValue, label: measureModuleLabel ?? measureModuleValue }] : []),
    [measureModuleValue, measureModuleLabel]
  )

  const {
    aggregateOptions: measureOptions,
    catalogByModule,
    isLoading: measuresLoading,
  } = useQuickChartModuleFields({
    moduleOrder: measureModuleOrder,
    enabled: open && editingId !== null && Boolean(measureModuleValue),
  })

  const fieldCatalog = measureModuleValue ? catalogByModule[measureModuleValue] ?? [] : []

  const dateFieldOptions = useMemo(() => {
    const all = flattenCatalogFields(measureModuleOrder, catalogByModule)
    return all.filter(opt => {
      const cat = getFieldFilterCategory(opt.field.fieldtype, opt.field.frontendFieldtype)
      return cat === 'date' || cat === 'datetime'
    })
  }, [catalogByModule, measureModuleOrder])

  const comparisonBasedOnOptions = useMemo(
    () =>
      buildComparisonBasedOnOptions(
        draftModuleOption?.label,
        draft?.related_module ? draft.related_module_label || draft.related_module : undefined
      ),
    [draftModuleOption, draft?.related_module, draft?.related_module_label]
  )

  const paramErrors = useMemo((): ComparatorParameterErrors => {
    if (!draft) return {}
    const next: ComparatorParameterErrors = {}
    if (!draft.parameter_name.trim()) next.parameter_name = 'Parameter name is required.'
    if (!isPicklistValues && !draft.module) next.module = 'Module is required.'
    if (!draft.measure) next.measure = 'Measure is required.'
    if (isTimePeriod) {
      if (!draft.associated_date_field) next.associated_date_field = 'Associated Date Field is required.'
    } else {
      if (!draft.comparison_based_on) next.comparison_based_on = 'Comparison Based On is required.'
    }
    return next
  }, [draft, isTimePeriod, isPicklistValues])

  const displayErrors: ComparatorParameterErrors = paramSubmitted ? paramErrors : {}

  // When the picklist module changes, update every saved parameter's module
  // and reset the open draft's module (and measure) so they stay in sync.
  useEffect(() => {
    if (!isPicklistValues || !picklistModuleValue) return
    setParameters(prev =>
      prev.map(p => ({ ...p, module: picklistModuleValue, module_label: picklistModuleLabel ?? picklistModuleValue, measure: '', measure_label: '' }))
    )
    setDraft(prev =>
      prev ? { ...prev, module: picklistModuleValue, module_label: picklistModuleLabel ?? picklistModuleValue, measure: '', measure_label: '' } : prev
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPicklistValues, picklistModuleValue, picklistModuleLabel])

  // Reset everything when the modal closes.
  useEffect(() => {
    if (!open) {
      setParameters([])
      setDraft(null)
      setEditingId(null)
      setParamSubmitted(false)
    }
  }, [open])

  const startAdd = () => {
    const initial = emptyDraft()
    if (isPicklistValues && picklistModuleValue) {
      initial.module = picklistModuleValue
      initial.module_label = picklistModuleLabel ?? picklistModuleValue
    }
    setDraft(initial)
    setEditingId('new')
    setParamSubmitted(false)
  }

  const startEdit = (id: string) => {
    const existing = parameters.find(p => p.id === id)
    if (!existing) return
    const d = { ...existing }
    if (isPicklistValues && picklistModuleValue) {
      d.module = picklistModuleValue
      d.module_label = picklistModuleLabel ?? picklistModuleValue
    }
    setDraft(d)
    setEditingId(id)
    setParamSubmitted(false)
  }

  const cancel = () => {
    setDraft(null)
    setEditingId(null)
    setParamSubmitted(false)
  }

  const updateDraft = (patch: Partial<ComparatorParameter>) => {
    setDraft(prev => (prev ? { ...prev, ...patch } : prev))
  }

  const save = () => {
    if (!draft) return
    setParamSubmitted(true)
    if (Object.keys(paramErrors).length > 0) return

    const finalized: ComparatorParameter = isTimePeriod
      ? { ...draft, comparison_based_on: undefined, comparison_based_on_label: undefined }
      : { ...draft, comparison_based_on_label: comparisonBasedOnOptions.find(o => o.value === draft.comparison_based_on)?.label }
    setParameters(prev => {
      const exists = prev.some(p => p.id === finalized.id)
      return exists ? prev.map(p => (p.id === finalized.id ? finalized : p)) : [...prev, finalized]
    })
    setDraft(null)
    setEditingId(null)
    setParamSubmitted(false)
  }

  const remove = (id: string) => {
    setParameters(prev => prev.filter(p => p.id !== id))
    if (editingId === id) cancel()
  }

  return {
    parameters,
    editingId,
    draft,
    errors: displayErrors,
    startAdd,
    startEdit,
    cancel,
    updateDraft,
    save,
    remove,

    compareAmongType,
    isTimePeriod,
    isPicklistValues,

    relatedModuleOptions,
    relatedModulesLoading,
    measureOptions,
    measuresLoading,
    fieldCatalog,
    dateFieldOptions,
    comparisonBasedOnOptions,
  }
}
