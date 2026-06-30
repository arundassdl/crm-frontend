'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Autocomplete,
  Box,
  Button,
  FormControl,
  IconButton,
  MenuItem,
  Popover,
  Select,
  Stack,
  TextField,
  Typography,
  type SelectChangeEvent,
} from '@mui/material'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline'

import {
  fetchComponentPicklistOptions,
  fetchStageProbabilityOptions,
  type FilterPicklistOption,
} from '@/services/api/report-addon/filter-picklist-api'
import { fetchLinkSearch, type LinkSearchOption } from '@/services/api/report-addon/filter-link-search-api'
import { readAccessTokenString } from '@/utils/accessTokenDataStorage'

import type { DashboardWidget } from '../types'
import type { ComponentFilterFieldConfig, RuntimeFilterRow } from '../types/componentFilters'
import { getFieldFilterCategory } from '../utils/report-filters/field-category'
import { isStageField } from '../utils/report-filters/select-field'
import { getRuntimeFilterOperators } from '../utils/runtimeFilterOperators'

function readConfigValue(widget: DashboardWidget, key: string): unknown {
  const fromConfig = widget.config?.[key]
  if (fromConfig !== undefined && fromConfig !== null) return fromConfig
  return (widget.properties as Record<string, unknown> | undefined)?.[key]
}

/** Reads the widget's "Display Component Filters" configuration, if any. */
export function readComponentFilters(widget: DashboardWidget): ComponentFilterFieldConfig[] {
  const enabled = readConfigValue(widget, 'display_component_filters') === true
  if (!enabled) return []
  const raw = readConfigValue(widget, 'component_filters')
  if (!Array.isArray(raw)) return []
  return raw.filter(
    (f): f is ComponentFilterFieldConfig =>
      Boolean(f) && typeof f === 'object' && typeof (f as ComponentFilterFieldConfig).fieldname === 'string'
  )
}

function parseSelectOptions(options?: string): string[] {
  if (!options?.trim()) return []
  return options
    .split('\n')
    .map(o => o.trim())
    .filter(Boolean)
}

let rowIdCounter = 0
function nextRowId(): number {
  rowIdCounter += 1
  return rowIdCounter
}

type FilterRowState = {
  id: number
  fieldname: string
  operator: string
  value: string
  valueTo: string
}

function createRow(field?: ComponentFilterFieldConfig): FilterRowState {
  const category = field ? getFieldFilterCategory(field.fieldtype, field.frontendFieldtype) : 'data'
  const operator = getRuntimeFilterOperators(category)[0]?.value ?? 'is'
  return { id: nextRowId(), fieldname: field?.fieldname ?? '', operator, value: '', valueTo: '' }
}

type RuntimeFilterValueControlProps = {
  field: ComponentFilterFieldConfig
  isRange: boolean
  noValue: boolean
  value: string
  valueTo: string
  onChangeValue: (value: string) => void
  onChangeValueTo: (value: string) => void
}

/** Value control rendered per field type: Text Field / Dropdown / Date Picker / User Selector. */
function RuntimeFilterValueControl({
  field,
  isRange,
  noValue,
  value,
  valueTo,
  onChangeValue,
  onChangeValueTo,
}: RuntimeFilterValueControlProps) {
  const userToken = readAccessTokenString()
  const category = getFieldFilterCategory(field.fieldtype, field.frontendFieldtype)
  const staticOptions = useMemo(() => parseSelectOptions(field.options), [field.options])
  const [dynamicOptions, setDynamicOptions] = useState<FilterPicklistOption[]>([])
  const [loadingOptions, setLoadingOptions] = useState(false)

  const usesDynamicPicklist = category === 'select' && Boolean(field.picklistModule && field.layoutName)

  useEffect(() => {
    if (!usesDynamicPicklist || !userToken || !field.picklistModule || !field.layoutName) return
    const ac = new AbortController()
    setLoadingOptions(true)
    const params = { module: field.picklistModule, layoutName: field.layoutName, fieldName: field.fieldname }
    const loader = isStageField({ fieldtype: field.fieldtype, frontendFieldtype: field.frontendFieldtype })
      ? fetchStageProbabilityOptions(userToken, params)
      : fetchComponentPicklistOptions(userToken, params)
    void loader
      .then(rows => {
        if (!ac.signal.aborted) setDynamicOptions(rows)
      })
      .catch(() => {
        if (!ac.signal.aborted) setDynamicOptions([])
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoadingOptions(false)
      })
    return () => ac.abort()
  }, [usesDynamicPicklist, userToken, field.picklistModule, field.layoutName, field.fieldname, field.fieldtype, field.frontendFieldtype])

  if (noValue) return null

  if (category === 'link' && field.linkDoctype) {
    return (
      <UserSelectorInput
        doctype={field.linkDoctype}
        value={value}
        onChange={onChangeValue}
        userToken={userToken}
      />
    )
  }

  if (category === 'select') {
    const options: FilterPicklistOption[] = usesDynamicPicklist
      ? dynamicOptions
      : staticOptions.map(o => ({ value: o, label: o }))

    return (
      <FormControl fullWidth size="small">
        <Select
          value={value}
          displayEmpty
          onChange={(e: SelectChangeEvent) => onChangeValue(e.target.value)}
        >
          <MenuItem value="">
            <em>{loadingOptions ? 'Loading…' : 'Select value'}</em>
          </MenuItem>
          {options.map(o => (
            <MenuItem key={o.value} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    )
  }

  if (category === 'date' || category === 'datetime') {
    const type = category === 'datetime' ? 'datetime-local' : 'date'
    if (isRange) {
      return (
        <Stack direction="row" spacing={1} sx={{ flex: 1, minWidth: 0 }}>
          <TextField
            size="small"
            fullWidth
            type={type}
            value={value}
            onChange={e => onChangeValue(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            size="small"
            fullWidth
            type={type}
            value={valueTo}
            onChange={e => onChangeValueTo(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Stack>
      )
    }
    return (
      <TextField
        size="small"
        fullWidth
        type={type}
        value={value}
        onChange={e => onChangeValue(e.target.value)}
        InputLabelProps={{ shrink: true }}
      />
    )
  }

  if (category === 'number') {
    if (isRange) {
      return (
        <Stack direction="row" spacing={1} sx={{ flex: 1, minWidth: 0 }}>
          <TextField
            size="small"
            fullWidth
            type="number"
            placeholder="From"
            value={value}
            onChange={e => onChangeValue(e.target.value)}
          />
          <TextField
            size="small"
            fullWidth
            type="number"
            placeholder="To"
            value={valueTo}
            onChange={e => onChangeValueTo(e.target.value)}
          />
        </Stack>
      )
    }
    return (
      <TextField
        size="small"
        fullWidth
        type="number"
        value={value}
        onChange={e => onChangeValue(e.target.value)}
      />
    )
  }

  return (
    <TextField
      size="small"
      fullWidth
      value={value}
      onChange={e => onChangeValue(e.target.value)}
      placeholder="Value"
    />
  )
}

type UserSelectorInputProps = {
  doctype: string
  value: string
  onChange: (value: string) => void
  userToken?: string
}

/** "User Selector" value control for Link-type fields (e.g. Deal Owner). */
function UserSelectorInput({ doctype, value, onChange, userToken }: UserSelectorInputProps) {
  const [options, setOptions] = useState<LinkSearchOption[]>([])
  const [inputValue, setInputValue] = useState(value)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setInputValue(value)
  }, [value])

  useEffect(() => {
    if (!userToken) return
    const ac = new AbortController()
    const t = window.setTimeout(() => {
      setLoading(true)
      void fetchLinkSearch(userToken, { doctype, txt: inputValue }, ac.signal)
        .then(rows => {
          if (!ac.signal.aborted) setOptions(rows)
        })
        .catch(() => {
          if (!ac.signal.aborted) setOptions([])
        })
        .finally(() => {
          if (!ac.signal.aborted) setLoading(false)
        })
    }, 300)
    return () => {
      window.clearTimeout(t)
      ac.abort()
    }
  }, [userToken, doctype, inputValue])

  return (
    <Autocomplete
      size="small"
      fullWidth
      loading={loading}
      options={options}
      getOptionLabel={o => (typeof o === 'string' ? o : o.label)}
      isOptionEqualToValue={(a, b) => (typeof a === 'string' ? a : a.value) === (typeof b === 'string' ? b : b.value)}
      value={options.find(o => o.value === value) ?? (value ? { value, label: value } : null)}
      inputValue={inputValue}
      onInputChange={(_, next) => setInputValue(next)}
      onChange={(_, opt) => onChange(typeof opt === 'string' ? opt : opt?.value ?? '')}
      renderInput={params => <TextField {...params} placeholder="Search…" />}
      sx={{ flex: 1, minWidth: 0 }}
    />
  )
}

type FilterRowProps = {
  rowNumber: number
  fields: ComponentFilterFieldConfig[]
  row: FilterRowState
  isLast: boolean
  canRemove: boolean
  onChange: (next: FilterRowState) => void
  onRemove: () => void
  onAdd: () => void
}

function FilterRow({ rowNumber, fields, row, isLast, canRemove, onChange, onRemove, onAdd }: FilterRowProps) {
  const field = fields.find(f => f.fieldname === row.fieldname)
  const category = field ? getFieldFilterCategory(field.fieldtype, field.frontendFieldtype) : 'data'
  const operators = getRuntimeFilterOperators(category)
  const activeOperator = operators.find(o => o.value === row.operator) ?? operators[0]

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Box sx={{ width: 20, flexShrink: 0, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          {rowNumber}
        </Typography>
      </Box>

      <FormControl size="small" sx={{ flex: 1.1, minWidth: 0 }}>
        <Select
          value={row.fieldname}
          displayEmpty
          onChange={(e: SelectChangeEvent) => {
            const nextField = fields.find(f => f.fieldname === e.target.value)
            const nextOperator = getRuntimeFilterOperators(
              nextField ? getFieldFilterCategory(nextField.fieldtype, nextField.frontendFieldtype) : 'data'
            )[0]?.value
            onChange({ ...row, fieldname: e.target.value, operator: nextOperator ?? 'is', value: '', valueTo: '' })
          }}
        >
          <MenuItem value="">
            <em>Select field</em>
          </MenuItem>
          {fields.map(f => (
            <MenuItem key={f.fieldname} value={f.fieldname}>
              {f.module} - {f.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ flex: 0.8, minWidth: 0 }} disabled={!field}>
        <Select
          value={row.operator}
          onChange={(e: SelectChangeEvent) => onChange({ ...row, operator: e.target.value, value: '', valueTo: '' })}
        >
          {operators.map(o => (
            <MenuItem key={o.value} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Box sx={{ flex: 1.4, minWidth: 0 }}>
        {field ? (
          <RuntimeFilterValueControl
            field={field}
            isRange={Boolean(activeOperator?.isRange)}
            noValue={Boolean(activeOperator?.noValue)}
            value={row.value}
            valueTo={row.valueTo}
            onChangeValue={v => onChange({ ...row, value: v })}
            onChangeValueTo={v => onChange({ ...row, valueTo: v })}
          />
        ) : (
          <TextField size="small" fullWidth disabled placeholder="Value" />
        )}
      </Box>

      <Stack direction="row" spacing={0.25} sx={{ flexShrink: 0 }}>
        <IconButton size="small" aria-label="Remove filter row" onClick={onRemove} disabled={!canRemove}>
          <RemoveCircleOutlineIcon fontSize="small" />
        </IconButton>
        {isLast ? (
          <IconButton size="small" aria-label="Add filter row" onClick={onAdd} sx={{ color: 'success.main' }}>
            <AddCircleOutlineIcon fontSize="small" />
          </IconButton>
        ) : null}
      </Stack>
    </Stack>
  )
}

export type ComponentFiltersButtonProps = {
  fields: ComponentFilterFieldConfig[]
  values: RuntimeFilterRow[]
  onApply: (values: RuntimeFilterRow[]) => void
}

/** Filter icon shown on a KPI widget header; opens a compact inline "Filter By" row builder. */
export function ComponentFiltersButton({ fields, values, onApply }: ComponentFiltersButtonProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [rows, setRows] = useState<FilterRowState[]>([])

  if (fields.length === 0) return null

  const open = Boolean(anchorEl)
  const hasActiveFilters = values.length > 0

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    setRows(
      values.length > 0
        ? values.map(v => ({
            id: nextRowId(),
            fieldname: v.fieldname,
            operator: v.operator,
            value: v.value,
            valueTo: v.valueTo ?? '',
          }))
        : [createRow(fields[0])]
    )
    setAnchorEl(e.currentTarget)
  }

  const handleClose = () => setAnchorEl(null)

  const handleApply = () => {
    const next: RuntimeFilterRow[] = rows
      .filter(r => {
        if (!r.fieldname) return false
        const field = fields.find(f => f.fieldname === r.fieldname)
        const category = field ? getFieldFilterCategory(field.fieldtype, field.frontendFieldtype) : 'data'
        const operator = getRuntimeFilterOperators(category).find(o => o.value === r.operator)
        if (operator?.noValue) return true
        if (operator?.isRange) return Boolean(r.value.trim() || r.valueTo.trim())
        return Boolean(r.value.trim())
      })
      .map(r => ({
        fieldname: r.fieldname,
        operator: r.operator,
        value: r.value.trim(),
        ...(r.valueTo.trim() ? { valueTo: r.valueTo.trim() } : {}),
      }))

    onApply(next)
    setAnchorEl(null)
  }

  return (
    <>
      <IconButton
        size="small"
        title="Filter"
        onClick={handleOpen}
        className={`inline-flex h-7 w-7 items-center justify-center rounded-md transition hover:bg-slate-100 ${
          hasActiveFilters ? 'text-blue-600' : 'text-slate-400 hover:text-slate-700'
        }`}
      >
        <i className="ri-filter-3-line text-sm" aria-hidden />
      </IconButton>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ p: 2, width: 460, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Filter By
          </Typography>
          {rows.map((row, idx) => (
            <FilterRow
              key={row.id}
              rowNumber={idx + 1}
              fields={fields}
              row={row}
              isLast={idx === rows.length - 1}
              canRemove={rows.length > 1}
              onChange={next => setRows(prev => prev.map(r => (r.id === row.id ? next : r)))}
              onRemove={() => setRows(prev => prev.filter(r => r.id !== row.id))}
              onAdd={() => {
                const usedFieldnames = new Set(rows.map(r => r.fieldname))
                const nextField = fields.find(f => !usedFieldnames.has(f.fieldname)) ?? fields[0]
                setRows(prev => [...prev, createRow(nextField)])
              }}
            />
          ))}
          <Button variant="contained" size="small" onClick={handleApply} sx={{ alignSelf: 'flex-end' }}>
            Apply
          </Button>
        </Box>
      </Popover>
    </>
  )
}
