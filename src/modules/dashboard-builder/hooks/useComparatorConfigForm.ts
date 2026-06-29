'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { readAccessTokenString } from '@/utils/accessTokenDataStorage'
import { saveReport } from '@/services/api/report-addon/save-report-api'

import { comparatorStyleToCatalogItem, type ComparatorStyle } from '../utils/addComponentCatalog'
import { buildComparatorReportDefinition } from '../utils/buildComparatorReportDefinition'
import { TIME_PERIOD_OPTIONS, type TimePeriodLastUnit, type TimePeriodValue } from '../utils/timePeriodOptions'
import type { TimePeriodPickerState } from '../components/kpi/kpiFormShared'
import type { WidgetCatalogItem } from '../types'
import {
  useCompareAmongRoles,
  useCompareAmongUsers,
  usePicklistFieldOptions,
  usePicklistValueOptions,
  type PicklistValueOption,
} from './useCompareAmongOptions'
import { useComparatorParameters } from './useComparatorParameters'
import { dashboardComponentKeys } from './useDashboardComponents'
import { EMPTY_MODULE_LIST, useQuickChartModuleListing } from './useQuickChartModules'

export type CompareAmongType = 'users' | 'time_period' | 'picklist_values'
export type UserCompareSubType = 'custom_users' | 'roles'
export type PicklistMode = 'select_values' | 'group_categories'
export type PicklistCategory = { id: string; label: string; values: string[] }
export type { PicklistValueOption }

export type ComparatorConfigFormErrors = Partial<
  Record<'name' | 'compareAmong' | 'users' | 'parameters' | 'picklistValues', string>
>

export type UseComparatorConfigFormOptions = {
  open: boolean
  comparatorStyle: ComparatorStyle | null
  onDone: (item: WidgetCatalogItem) => void
  onClose: () => void
}

/** Local form state for the Comparator configuration screen, wired to real module fields. */
export function useComparatorConfigForm({ open, comparatorStyle, onDone, onClose }: UseComparatorConfigFormOptions) {
  const userToken = readAccessTokenString()
  const queryClient = useQueryClient()
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | undefined>()
  const [submitted, setSubmitted] = useState(false)
  const [name, setName] = useState('')

  // "Compare Among" — Users / Time Period / Picklist Values.
  const [compareAmongType, setCompareAmongType] = useState<CompareAmongType | ''>('')

  // Users
  const [userType, setUserType] = useState<UserCompareSubType | ''>('')
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([])

  // Time Period
  const [periodValue, setPeriodValue] = useState<TimePeriodValue | ''>('')
  const [periodLastValue, setPeriodLastValue] = useState<number | ''>('')
  const [periodLastUnit, setPeriodLastUnit] = useState<TimePeriodLastUnit>('day')
  const [periodFromDate, setPeriodFromDate] = useState('')
  const [periodToDate, setPeriodToDate] = useState('')

  // Picklist Values
  const [picklistModuleValue, setPicklistModuleValue] = useState('')
  const [picklistField, setPicklistField] = useState('')
  const [picklistMode, setPicklistMode] = useState<PicklistMode>('select_values')
  const [selectedPicklistValues, setSelectedPicklistValues] = useState<string[]>([])
  const [picklistCategories, setPicklistCategories] = useState<PicklistCategory[]>([])

  const { data: moduleOptions, isLoading: modulesLoading } = useQuickChartModuleListing(open)
  const moduleOptionsList = moduleOptions ?? EMPTY_MODULE_LIST

  // Resolved early so it can be forwarded to useComparatorParameters.
  const picklistModuleOption = moduleOptionsList.find(o => o.value === picklistModuleValue)

  const parametersForm = useComparatorParameters({
    open,
    moduleOptionsList,
    compareAmongType: compareAmongType || undefined,
    picklistModuleValue: compareAmongType === 'picklist_values' ? picklistModuleValue : undefined,
    picklistModuleLabel: compareAmongType === 'picklist_values' ? picklistModuleOption?.label : undefined,
  })

  const usersEnabled = open && compareAmongType === 'users' && userType === 'custom_users'
  const rolesEnabled = open && compareAmongType === 'users' && userType === 'roles'
  const {
    data: usersData,
    isLoading: usersLoading,
    isError: usersError,
  } = useCompareAmongUsers(usersEnabled)
  const {
    data: rolesData,
    isLoading: rolesLoading,
    isError: rolesError,
  } = useCompareAmongRoles(rolesEnabled)
  const usersOptions = usersData ?? []
  const rolesOptions = rolesData ?? []
  const picklistFieldsEnabled =
    open && compareAmongType === 'picklist_values' && Boolean(picklistModuleOption)
  const { data: picklistFieldsData, isLoading: picklistFieldsLoading } = usePicklistFieldOptions(
    picklistModuleOption?.value ?? '',
    picklistModuleOption?.label ?? '',
    picklistFieldsEnabled
  )
  const picklistFieldOptions = picklistFieldsData ?? []

  const picklistValuesEnabled =
    open && compareAmongType === 'picklist_values' && Boolean(picklistField) && Boolean(picklistModuleOption)
  const { data: picklistValuesData, isLoading: picklistValuesLoading } = usePicklistValueOptions(
    picklistModuleOption?.value ?? '',
    picklistModuleOption?.label ?? '',
    picklistField,
    picklistValuesEnabled
  )
  const picklistValueOptions = picklistValuesData ?? []

  // Reset the form whenever the modal closes.
  useEffect(() => {
    if (!open) {
      setName('')
      setCompareAmongType('')
      setUserType('')
      setSelectedUserIds([])
      setSelectedRoleIds([])
      setPeriodValue('')
      setPeriodLastValue('')
      setPeriodLastUnit('day')
      setPeriodFromDate('')
      setPeriodToDate('')
      setPicklistModuleValue('')
      setPicklistField('')
      setPicklistMode('select_values')
      setSelectedPicklistValues([])
      setPicklistCategories([])
      setSaveError(undefined)
      setSubmitted(false)
    }
  }, [open])

  // Reset dependent fields when "Compare Among" type changes.
  const prevCompareAmongType = useRef(compareAmongType)
  useEffect(() => {
    if (prevCompareAmongType.current === compareAmongType) return
    prevCompareAmongType.current = compareAmongType
    setUserType(compareAmongType === 'users' ? 'custom_users' : '')
    setSelectedUserIds([])
    setSelectedRoleIds([])
    setPeriodValue('')
    setPeriodLastValue('')
    setPeriodLastUnit('day')
    setPeriodFromDate('')
    setPeriodToDate('')
    setPicklistModuleValue('')
    setPicklistField('')
    setPicklistMode('select_values')
    setSelectedPicklistValues([])
    setPicklistCategories([])
  }, [compareAmongType])

  // Reset selections when the Users sub-type changes.
  const prevUserType = useRef(userType)
  useEffect(() => {
    if (prevUserType.current === userType) return
    prevUserType.current = userType
    setSelectedUserIds([])
    setSelectedRoleIds([])
  }, [userType])

  // Reset the picklist field when the module changes.
  const prevPicklistModule = useRef(picklistModuleValue)
  useEffect(() => {
    if (prevPicklistModule.current === picklistModuleValue) return
    prevPicklistModule.current = picklistModuleValue
    setPicklistField('')
    setSelectedPicklistValues([])
    setPicklistCategories([])
  }, [picklistModuleValue])

  // Reset selected values / categories when the field changes.
  const prevPicklistField = useRef(picklistField)
  useEffect(() => {
    if (prevPicklistField.current === picklistField) return
    prevPicklistField.current = picklistField
    setSelectedPicklistValues([])
    setPicklistCategories([])
  }, [picklistField])

  const selectedUserOptions = useMemo(
    () => usersOptions.filter(o => selectedUserIds.includes(o.value)),
    [usersOptions, selectedUserIds]
  )
  const selectedRoleOptions = useMemo(
    () => rolesOptions.filter(o => selectedRoleIds.includes(o.value)),
    [rolesOptions, selectedRoleIds]
  )
  const picklistFieldOption = picklistFieldOptions.find(o => o.value === picklistField)

  const compareAmongLabel = useMemo(() => {
    if (compareAmongType === 'users') {
      let base: string | undefined
      if (userType === 'custom_users') {
        base =
          selectedUserOptions.length > 0
            ? selectedUserOptions.map(o => o.label).join(', ')
            : 'Custom Users'
      } else if (userType === 'roles') {
        base =
          selectedRoleOptions.length > 0
            ? selectedRoleOptions.map(o => o.label).join(', ')
            : 'Roles'
      }
      return base
    }
    if (compareAmongType === 'time_period') {
      if (!periodValue) return undefined
      if (periodValue === 'Last' && periodLastValue !== '') {
        return `Last ${periodLastValue} ${periodLastUnit}(s)`
      }
      if (periodValue === 'Custom' && periodFromDate && periodToDate) {
        return `${periodFromDate} to ${periodToDate}`
      }
      return TIME_PERIOD_OPTIONS.find(o => o.value === periodValue)?.label
    }
    if (compareAmongType === 'picklist_values') {
      if (!picklistFieldOption) return undefined
      return picklistModuleOption
        ? `${picklistFieldOption.label} (${picklistModuleOption.label})`
        : picklistFieldOption.label
    }
    return undefined
  }, [
    compareAmongType,
    userType,
    selectedUserOptions,
    selectedRoleOptions,
    periodValue,
    periodLastValue,
    periodLastUnit,
    periodFromDate,
    periodToDate,
    picklistFieldOption,
    picklistModuleOption,
  ])

  const errors: ComparatorConfigFormErrors = useMemo(() => {
    const next: ComparatorConfigFormErrors = {}
    if (!name.trim()) next.name = 'Component Name is required.'
    if (!compareAmongType) next.compareAmong = 'Compare Among is required.'
    if (compareAmongType === 'users') {
      const hasUsers = userType === 'custom_users' && selectedUserIds.length > 0
      const hasRoles = userType === 'roles' && selectedRoleIds.length > 0
      if (!hasUsers && !hasRoles) {
        next.users = userType === 'roles' ? 'Please select at least one role.' : 'Please select at least one user.'
      }
    }
    if (compareAmongType === 'time_period' && !periodValue) {
      next.compareAmong = 'Time Period selection is required.'
    }
    if (compareAmongType === 'picklist_values') {
      if (!picklistModuleValue || !picklistField) {
        next.compareAmong = 'Picklist module and field are required.'
      } else if (picklistMode === 'select_values' && selectedPicklistValues.length === 0) {
        next.picklistValues = 'Please select at least one picklist value.'
      } else if (picklistMode === 'group_categories') {
        const valid = picklistCategories.filter(c => c.label.trim() && c.values.length > 0)
        if (valid.length === 0) {
          next.picklistValues = 'Add at least one category with at least one value assigned.'
        }
      }
    }
    if (parametersForm.parameters.length === 0) {
      next.parameters = 'At least one comparison parameter is required.'
    }
    return next
  }, [name, compareAmongType, userType, selectedUserIds, selectedRoleIds, periodValue, picklistModuleValue, picklistField, picklistMode, selectedPicklistValues, picklistCategories, parametersForm.parameters])

  const canSubmit = Object.keys(errors).length === 0
  // Done is only disabled while a save is in flight — validation runs on click.
  const isDoneDisabled = saving

  const displayErrors: ComparatorConfigFormErrors = submitted ? errors : {}

  const periodPickerState: TimePeriodPickerState = useMemo(() => ({
    value: periodValue,
    lastValue: periodLastValue,
    lastUnit: periodLastUnit,
    fromDate: periodFromDate,
    toDate: periodToDate,
  }), [periodValue, periodLastValue, periodLastUnit, periodFromDate, periodToDate])

  const patchPeriod = useCallback((partial: Partial<TimePeriodPickerState>) => {
    if ('value' in partial) setPeriodValue((partial.value ?? '') as TimePeriodValue | '')
    if ('lastValue' in partial) setPeriodLastValue(partial.lastValue ?? '')
    if ('lastUnit' in partial) setPeriodLastUnit(partial.lastUnit ?? 'day')
    if ('fromDate' in partial) setPeriodFromDate(partial.fromDate ?? '')
    if ('toDate' in partial) setPeriodToDate(partial.toDate ?? '')
  }, [])

  const handleDone = useCallback(async () => {
    setSubmitted(true)
    if (!canSubmit || !userToken || !comparatorStyle) return
    setSaving(true)
    setSaveError(undefined)
    try {
      const validCategories = picklistCategories.filter(c => c.label.trim() && c.values.length > 0)
      const { reportname, json } = buildComparatorReportDefinition({
        name,
        comparatorStyle,
        compareAmongType,
        compareAmongLabel,
        userType: userType || undefined,
        selectedUserIds,
        selectedUserLabels: selectedUserOptions.map(o => o.label),
        selectedRoleIds,
        selectedRoleLabels: selectedRoleOptions.map(o => o.label),
        periodType: periodValue || undefined,
        periodLastValue: periodLastValue !== '' ? periodLastValue : undefined,
        periodLastUnit: periodLastUnit,
        periodFromDate: periodFromDate || undefined,
        periodToDate: periodToDate || undefined,
        picklistModuleValue: picklistModuleValue || undefined,
        picklistModuleLabel: picklistModuleOption?.label,
        picklistField: picklistField || undefined,
        picklistFieldLabel: picklistFieldOption?.label,
        picklistMode: compareAmongType === 'picklist_values' ? picklistMode : undefined,
        selectedPicklistValues: compareAmongType === 'picklist_values' && picklistMode === 'select_values' ? selectedPicklistValues : undefined,
        picklistCategories: compareAmongType === 'picklist_values' && picklistMode === 'group_categories' ? validCategories : undefined,
        parameters: parametersForm.parameters,
        moduleOptionsList,
      })

      console.log('[Comparator] save_report request', {
        reportname,
        chart_type: json.chart_type,
        comparator_style: (json as Record<string, unknown>).comparator_style,
        jsonobject: json,
      })
      const result = await saveReport(userToken, {
        reportname,
        jsonobject: json,
        name: null,
        is_report: 0,
      })
      console.log('[Comparator] save_report response', result)
      if (!result.ok) {
        setSaveError(result.error ?? 'Failed to save comparator.')
        return
      }

      await queryClient.invalidateQueries({ queryKey: dashboardComponentKeys.all })
      onDone(
        comparatorStyleToCatalogItem(comparatorStyle, {
          name,
          compare_among: compareAmongType,
          compare_among_label: compareAmongLabel,
          user_type: userType || undefined,
          selected_users: selectedUserIds,
          selected_user_labels: selectedUserOptions.map(o => o.label),
          selected_roles: selectedRoleIds,
          selected_role_labels: selectedRoleOptions.map(o => o.label),
          period_type: periodValue || undefined,
          period_last_value: periodLastValue !== '' ? periodLastValue : undefined,
          period_last_unit: periodLastUnit || undefined,
          period_from_date: periodFromDate || undefined,
          period_to_date: periodToDate || undefined,
          picklist_module: picklistModuleValue || undefined,
          picklist_module_label: picklistModuleOption?.label,
          picklist_field: picklistField || undefined,
          picklist_field_label: picklistFieldOption?.label,
          picklist_mode: compareAmongType === 'picklist_values' ? picklistMode : undefined,
          selected_picklist_values: compareAmongType === 'picklist_values' && picklistMode === 'select_values' ? selectedPicklistValues : undefined,
          picklist_categories: compareAmongType === 'picklist_values' && picklistMode === 'group_categories' ? validCategories : undefined,
          comparison_parameters: parametersForm.parameters,
          savedReportName: result.documentName,
        })
      )
      onClose()
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save comparator.')
    } finally {
      setSaving(false)
    }
  }, [
    canSubmit,
    userToken,
    comparatorStyle,
    name,
    compareAmongType,
    compareAmongLabel,
    userType,
    selectedUserIds,
    selectedUserOptions,
    selectedRoleIds,
    selectedRoleOptions,
    periodValue,
    periodLastValue,
    periodLastUnit,
    periodFromDate,
    periodToDate,
    picklistModuleValue,
    picklistModuleOption,
    picklistField,
    picklistFieldOption,
    picklistMode,
    selectedPicklistValues,
    picklistCategories,
    parametersForm.parameters,
    moduleOptionsList,
    queryClient,
    onDone,
    onClose,
  ])

  return {
    name,
    setName,
    parametersForm,

    compareAmongType,
    setCompareAmongType,
    compareAmongLabel,

    userType,
    setUserType,
    usersOptions,
    usersLoading,
    usersError,
    selectedUserIds,
    setSelectedUserIds,
    selectedUserOptions,
    rolesOptions,
    rolesLoading,
    rolesError,
    selectedRoleIds,
    setSelectedRoleIds,
    selectedRoleOptions,

    periodPickerState,
    patchPeriod,

    moduleOptionsList,
    modulesLoading,
    picklistModuleValue,
    setPicklistModuleValue,
    picklistModuleOption,
    picklistFieldOptions,
    picklistFieldsLoading,
    picklistField,
    setPicklistField,
    picklistFieldOption,
    picklistMode,
    setPicklistMode,
    selectedPicklistValues,
    setSelectedPicklistValues,
    picklistCategories,
    setPicklistCategories,
    picklistValueOptions,
    picklistValuesLoading,

    errors: displayErrors,
    canSubmit,
    isDoneDisabled,
    saving,
    saveError,
    handleDone,

    isLoading: modulesLoading,
  }
}
