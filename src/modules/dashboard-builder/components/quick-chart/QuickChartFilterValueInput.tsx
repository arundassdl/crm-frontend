'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Autocomplete,
  Box,
  Checkbox,
  Chip,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
  Stack,
  TextField,
  type TextFieldProps,
} from '@mui/material'

import {
  fetchComponentPicklistOptions,
  fetchStageProbabilityOptions,
  type FilterPicklistOption,
} from '@/services/api/report-addon/filter-picklist-api'
import { fetchLinkSearch } from '@/services/api/report-addon/filter-link-search-api'
import type { ReportFormFieldCatalogEntry } from '@/services/api/report-addon/report-fields-api'

import type { QuickChartFilterValue } from '../../types/quickChartFilter'
import { getFieldFilterCategory } from '../../utils/report-filters/field-category'
import { operatorRequiresRange } from '../../utils/report-filters/operators'
import {
  coercePicklistValueToArray,
  isDynamicMultiSelectField,
  isLookupField,
  isMultiSelectPicklistField,
  isMultiSelectStageField,
  resolveDynamicFieldApiContext,
  type FilterModuleOption,
} from '../../utils/report-filters/select-field'
import { isBetweenValue } from '../../utils/report-filters/serialize-filter-value'

const filterControlSx: TextFieldProps['sx'] = {
  flex: 1,
  minWidth: 0,
  '& .MuiOutlinedInput-root': {
    borderRadius: 1.5,
    fontSize: '0.875rem',
    bgcolor: 'background.paper',
  },
}

function parseSelectOptions(options?: string): string[] {
  if (!options?.trim()) return []
  return options
    .split('\n')
    .map(o => o.trim())
    .filter(Boolean)
}

export type QuickChartFilterValueInputProps = {
  field: ReportFormFieldCatalogEntry | null
  module?: string
  moduleOrder?: FilterModuleOption[]
  layoutByModule?: Record<string, string>
  picklistModuleByModule?: Record<string, string>
  operator: string
  value: QuickChartFilterValue
  onChange: (value: QuickChartFilterValue) => void
  disabled?: boolean
  userToken?: string
}

export function QuickChartFilterValueInput({
  field,
  module,
  moduleOrder,
  layoutByModule = {},
  picklistModuleByModule = {},
  operator,
  value,
  onChange,
  disabled = false,
  userToken,
}: QuickChartFilterValueInputProps) {
  const category = useMemo(
    () =>
      getFieldFilterCategory(field?.fieldtype ?? 'Data', field?.frontendFieldtype),
    [field]
  )

  if (!field) {
    return (
      <TextField
        size="small"
        fullWidth
        disabled
        placeholder="Select a field"
        sx={filterControlSx}
      />
    )
  }

  if (operatorRequiresRange(operator)) {
    const between = isBetweenValue(value) ? value : { from: '', to: '' }
    const inputType =
      category === 'datetime'
        ? 'datetime-local'
        : category === 'date'
          ? 'date'
          : 'text'
    return (
      <Stack direction="row" spacing={1} sx={{ flex: 1, minWidth: 0 }}>
        <TextField
          size="small"
          fullWidth
          type={inputType}
          label="From"
          disabled={disabled}
          value={between.from}
          onChange={e => onChange({ ...between, from: e.target.value })}
          InputLabelProps={inputType !== 'text' ? { shrink: true } : undefined}
          sx={filterControlSx}
        />
        <TextField
          size="small"
          fullWidth
          type={inputType}
          label="To"
          disabled={disabled}
          value={between.to}
          onChange={e => onChange({ ...between, to: e.target.value })}
          InputLabelProps={inputType !== 'text' ? { shrink: true } : undefined}
          sx={filterControlSx}
        />
      </Stack>
    )
  }

  if (category === 'check') {
    const checked = value === true || value === 1 || value === '1'
    return (
      <FormControlLabel
        control={
          <Checkbox
            checked={checked}
            disabled={disabled}
            onChange={e => onChange(e.target.checked)}
          />
        }
        label="Checked"
        sx={{ flex: 1, minWidth: 0, m: 0 }}
      />
    )
  }

  if (category === 'select') {
    const apiContext = resolveDynamicFieldApiContext(
      field,
      module,
      moduleOrder ?? [],
      layoutByModule,
      picklistModuleByModule
    )
    const usesMultiStage = isMultiSelectStageField(
      field,
      module,
      moduleOrder ?? [],
      layoutByModule,
      picklistModuleByModule
    )
    const usesMultiPicklist = isMultiSelectPicklistField(
      field,
      module,
      moduleOrder ?? [],
      layoutByModule,
      picklistModuleByModule
    )

    if (apiContext && (usesMultiStage || usesMultiPicklist) && userToken) {
      return (
        <DynamicApiMultiSelectInput
          fieldName={field.fieldName}
          apiContext={apiContext}
          usesStageApi={usesMultiStage}
          value={coercePicklistValueToArray(value)}
          onChange={onChange}
          disabled={disabled}
          staticOptions={field.options}
          userToken={userToken}
        />
      )
    }

    const opts = parseSelectOptions(field.options)
    return (
      <FormControl size="small" fullWidth disabled={disabled} sx={filterControlSx}>
        <InputLabel>Value</InputLabel>
        <Select
          label="Value"
          value={typeof value === 'string' ? value : ''}
          onChange={(e: SelectChangeEvent) => onChange(e.target.value)}
        >
          {opts.map(o => (
            <MenuItem key={o} value={o}>
              {o}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    )
  }

  if (category === 'link' && field.linkDoctype && userToken) {
    if (isLookupField(field)) {
      return (
        <MultiSelectLinkInput
          doctype={field.linkDoctype}
          value={coercePicklistValueToArray(value)}
          onChange={onChange}
          disabled={disabled}
          userToken={userToken}
        />
      )
    }

    return (
      <LinkAutocompleteInput
        doctype={field.linkDoctype}
        value={typeof value === 'string' ? value : ''}
        onChange={onChange}
        disabled={disabled}
        userToken={userToken}
      />
    )
  }

  if (category === 'date') {
    return (
      <TextField
        size="small"
        fullWidth
        type="date"
        disabled={disabled}
        value={typeof value === 'string' ? value : ''}
        onChange={e => onChange(e.target.value)}
        InputLabelProps={{ shrink: true }}
        sx={filterControlSx}
      />
    )
  }

  if (category === 'datetime') {
    return (
      <TextField
        size="small"
        fullWidth
        type="datetime-local"
        disabled={disabled}
        value={typeof value === 'string' ? value : ''}
        onChange={e => onChange(e.target.value)}
        InputLabelProps={{ shrink: true }}
        sx={filterControlSx}
      />
    )
  }

  if (category === 'number') {
    return (
      <TextField
        size="small"
        fullWidth
        type="number"
        disabled={disabled}
        value={value === null || value === undefined ? '' : String(value)}
        onChange={e => onChange(e.target.value)}
        sx={filterControlSx}
      />
    )
  }

  return (
    <TextField
      size="small"
      fullWidth
      disabled={disabled}
      value={typeof value === 'string' ? value : ''}
      onChange={e => onChange(e.target.value)}
      placeholder="Value"
      sx={filterControlSx}
    />
  )
}

type DynamicApiMultiSelectInputProps = {
  fieldName: string
  apiContext: { layoutName: string; moduleName: string }
  usesStageApi: boolean
  value: string[]
  onChange: (value: QuickChartFilterValue) => void
  disabled?: boolean
  staticOptions?: string
  userToken: string
}

function DynamicApiMultiSelectInput({
  fieldName,
  apiContext,
  usesStageApi,
  value,
  onChange,
  disabled,
  staticOptions,
  userToken,
}: DynamicApiMultiSelectInputProps) {
  const loadOptions = useCallback(
    (signal: AbortSignal) => {
      const params = {
        module: apiContext.moduleName,
        layoutName: apiContext.layoutName,
        fieldName,
      }
      return usesStageApi
        ? fetchStageProbabilityOptions(userToken, params)
        : fetchComponentPicklistOptions(userToken, params)
    },
    [
      userToken,
      apiContext.moduleName,
      apiContext.layoutName,
      fieldName,
      usesStageApi,
    ]
  )

  return (
    <MultiSelectDynamicInput
      value={value}
      onChange={onChange}
      disabled={disabled}
      staticOptions={staticOptions}
      loadOptions={loadOptions}
    />
  )
}

type MultiSelectDynamicInputProps = {
  value: string[]
  onChange: (value: QuickChartFilterValue) => void
  disabled?: boolean
  staticOptions?: string
  loadOptions: (signal: AbortSignal) => Promise<FilterPicklistOption[]>
}

function MultiSelectDynamicInput({
  value,
  onChange,
  disabled,
  staticOptions,
  loadOptions,
}: MultiSelectDynamicInputProps) {
  const fallbackOptions = useMemo((): FilterPicklistOption[] => {
    return parseSelectOptions(staticOptions).map(optionValue => ({
      value: optionValue,
      label: optionValue,
    }))
  }, [staticOptions])
  const [options, setOptions] = useState(fallbackOptions)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setOptions(fallbackOptions)
  }, [fallbackOptions])

  useEffect(() => {
    const ac = new AbortController()
    setLoading(true)
    void loadOptions(ac.signal)
      .then(rows => {
        setOptions(rows.length > 0 ? rows : fallbackOptions)
      })
      .catch(() => {
        setOptions(fallbackOptions)
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false)
      })
    return () => ac.abort()
  }, [loadOptions, fallbackOptions])

  return (
    <FilterMultiSelectAutocomplete
      value={value}
      onChange={onChange}
      options={options}
      loading={loading}
      disabled={disabled}
    />
  )
}

type FilterMultiSelectAutocompleteProps = {
  value: string[]
  onChange: (value: QuickChartFilterValue) => void
  options: FilterPicklistOption[]
  loading?: boolean
  disabled?: boolean
  inputValue?: string
  onInputChange?: (value: string) => void
  searchPlaceholder?: string
}

function FilterMultiSelectAutocomplete({
  value,
  onChange,
  options,
  loading = false,
  disabled = false,
  inputValue,
  onInputChange,
  searchPlaceholder = 'Search options…',
}: FilterMultiSelectAutocompleteProps) {
  const optionByValue = useMemo(() => {
    const map = new Map<string, FilterPicklistOption>()
    for (const opt of options) {
      map.set(opt.value, opt)
    }
    return map
  }, [options])

  const selectedOptions = useMemo(() => {
    return value.map(v => optionByValue.get(v) ?? { value: v, label: v })
  }, [value, optionByValue])

  const autocompleteOptions = useMemo(() => {
    const merged = new Map<string, FilterPicklistOption>()
    for (const opt of options) merged.set(opt.value, opt)
    for (const opt of selectedOptions) merged.set(opt.value, opt)
    return Array.from(merged.values())
  }, [options, selectedOptions])

  return (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Autocomplete
        multiple
        size="small"
        fullWidth
        disabled={disabled || loading}
        loading={loading}
        options={autocompleteOptions}
        value={selectedOptions}
        getOptionLabel={option => option.label}
        isOptionEqualToValue={(a, b) => a.value === b.value}
        filterSelectedOptions={false}
        disableCloseOnSelect
        inputValue={inputValue}
        onInputChange={onInputChange ? (_, next) => onInputChange(next) : undefined}
        onChange={(_, next) => {
          onChange(next.map(opt => opt.value))
        }}
        sx={{
          '& .MuiAutocomplete-inputRoot': {
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 0.5,
            py: 0.5,
          },
        }}
        ListboxProps={{ style: { maxHeight: 220 } }}
        renderTags={(tagValue, getTagProps) =>
          tagValue.map((option, index) => {
            const { key, ...chipProps } = getTagProps({ index })
            return (
              <Chip
                key={key}
                {...chipProps}
                label={option.label}
                size="small"
                sx={{
                  height: 24,
                  maxWidth: '100%',
                  '& .MuiChip-label': {
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  },
                }}
              />
            )
          })
        }
        renderOption={(props, option, { selected }) => (
          <Box
            component="li"
            {...props}
            sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.75 }}
          >
            <Checkbox size="small" checked={selected} sx={{ p: 0.25 }} />
            <Box component="span" sx={{ minWidth: 0, wordBreak: 'break-word' }}>
              {option.label}
            </Box>
          </Box>
        )}
        renderInput={params => (
          <TextField
            {...params}
            label="Value"
            placeholder={value.length === 0 ? searchPlaceholder : ''}
            sx={filterControlSx}
          />
        )}
        noOptionsText={loading ? 'Loading…' : 'No options available'}
      />
    </Box>
  )
}

type MultiSelectLinkInputProps = {
  doctype: string
  value: string[]
  onChange: (value: QuickChartFilterValue) => void
  disabled?: boolean
  userToken: string
}

function MultiSelectLinkInput({
  doctype,
  value,
  onChange,
  disabled,
  userToken,
}: MultiSelectLinkInputProps) {
  const [options, setOptions] = useState<FilterPicklistOption[]>([])
  const [loading, setLoading] = useState(false)
  const [inputValue, setInputValue] = useState('')

  const searchLinks = useCallback(
    async (txt: string, signal?: AbortSignal) => {
      setLoading(true)
      try {
        const rows = await fetchLinkSearch(
          userToken,
          { doctype, txt, limit: 30 },
          signal
        )
        setOptions(rows)
      } catch {
        setOptions([])
      } finally {
        setLoading(false)
      }
    },
    [userToken, doctype]
  )

  useEffect(() => {
    const ac = new AbortController()
    const t = window.setTimeout(() => {
      void searchLinks(inputValue, ac.signal)
    }, 300)
    return () => {
      window.clearTimeout(t)
      ac.abort()
    }
  }, [inputValue, searchLinks])

  return (
    <FilterMultiSelectAutocomplete
      value={value}
      onChange={onChange}
      options={options}
      loading={loading}
      disabled={disabled}
      inputValue={inputValue}
      onInputChange={setInputValue}
      searchPlaceholder="Search records…"
    />
  )
}

type LinkAutocompleteInputProps = {
  doctype: string
  value: string
  onChange: (value: QuickChartFilterValue) => void
  disabled?: boolean
  userToken: string
}

function LinkAutocompleteInput({
  doctype,
  value,
  onChange,
  disabled,
  userToken,
}: LinkAutocompleteInputProps) {
  const [options, setOptions] = useState<FilterPicklistOption[]>([])
  const [loading, setLoading] = useState(false)
  const [inputValue, setInputValue] = useState(value)

  useEffect(() => {
    setInputValue(value)
  }, [value])

  const loadOptions = useCallback(
    async (txt: string) => {
      setLoading(true)
      try {
        const rows = await fetchLinkSearch(userToken, { doctype, txt })
        setOptions(rows)
      } catch {
        setOptions([])
      } finally {
        setLoading(false)
      }
    },
    [userToken, doctype]
  )

  useEffect(() => {
    const t = window.setTimeout(() => {
      void loadOptions(inputValue)
    }, 300)
    return () => window.clearTimeout(t)
  }, [inputValue, loadOptions])

  return (
    <Autocomplete
      size="small"
      fullWidth
      disabled={disabled}
      loading={loading}
      options={options}
      getOptionLabel={o => o.label}
      isOptionEqualToValue={(a, b) => a.value === b.value}
      value={options.find(o => o.value === value) ?? null}
      inputValue={inputValue}
      onInputChange={(_, v) => setInputValue(v)}
      onChange={(_, opt) => {
        const next = opt?.value ?? ''
        onChange(next)
        setInputValue(next)
      }}
      sx={{ flex: 1, minWidth: 0 }}
      renderInput={params => (
        <TextField {...params} placeholder="Search…" sx={filterControlSx} />
      )}
    />
  )
}
