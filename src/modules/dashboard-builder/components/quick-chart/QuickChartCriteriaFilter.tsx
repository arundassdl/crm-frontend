'use client'

import { useMemo } from 'react'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline'
import {
  Box,
  CircularProgress,
  FormControl,
  IconButton,
  InputLabel,
  Link,
  MenuItem,
  Select,
  Stack,
  Typography,
  type SelectChangeEvent,
} from '@mui/material'

import type { ReportFormFieldCatalogEntry } from '@/services/api/report-addon/report-fields-api'

import type { QuickChartCriteriaFilter as QuickChartCriteriaFilterRow } from '../../types/quickChartFilter'
import { buildFieldChangeUpdate } from '../../utils/report-filters/build-field-change-update'
import {
  fieldKeyForFilter,
  flattenCatalogFields,
  type FlatFieldOption,
} from '../../utils/report-filters/flatten-catalog-fields'
import { getFieldFilterCategory } from '../../utils/report-filters/field-category'
import {
  getOperatorsForCategory,
  getOperatorsForDocSelectPicklist,
  operatorUsesMultiValue,
} from '../../utils/report-filters/operators'
import {
  isDynamicMultiSelectField,
  type FilterModuleOption,
} from '../../utils/report-filters/select-field'
import { createEmptyQuickChartFilter } from '../../utils/report-filters/quick-chart-filter-default'
import {
  isBetweenValue,
  isFilterValueArray,
} from '../../utils/report-filters/serialize-filter-value'
import { QuickChartFilterValueInput } from './QuickChartFilterValueInput'

const filterControlSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 1.5,
    fontSize: '0.875rem',
    bgcolor: 'background.paper',
  },
} as const

function FilterRowNumber({ rowNumber }: { rowNumber: number }) {
  return (
    <Box
      sx={{
        width: 28,
        flexShrink: 0,
        display: 'flex',
        justifyContent: 'center',
        pt: 0.75,
      }}
    >
      <Box
        sx={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.75rem',
          fontWeight: 600,
          color: 'text.secondary',
        }}
      >
        {rowNumber}
      </Box>
    </Box>
  )
}

type CriteriaFilterRowProps = {
  filter: QuickChartCriteriaFilterRow
  rowNumber: number
  isLast: boolean
  flatFields: FlatFieldOption[]
  moduleOrder: FilterModuleOption[]
  layoutByModule: Record<string, string>
  picklistModuleByModule: Record<string, string>
  userToken?: string
  disabled?: boolean
  onChange: (next: QuickChartCriteriaFilterRow) => void
  onRemove: () => void
  onAddAfter?: () => void
}

function CriteriaFilterRow({
  filter,
  rowNumber,
  isLast,
  flatFields,
  moduleOrder,
  layoutByModule,
  picklistModuleByModule,
  userToken,
  disabled,
  onChange,
  onRemove,
  onAddAfter,
}: CriteriaFilterRowProps) {
  const fieldKey = fieldKeyForFilter(filter.module, filter.fieldname)
  const selectedFlat =
    flatFields.find(o => o.key === fieldKey) ??
    flatFields.find(
      o =>
        o.field.fieldName.toLowerCase() === filter.fieldname.toLowerCase() &&
        o.moduleValue === filter.module
    )
  const selectedField = selectedFlat?.field ?? null

  const category = getFieldFilterCategory(
    filter.fieldtype,
    selectedField?.frontendFieldtype
  )
  const usesDynamicMultiSelect = isDynamicMultiSelectField(
    selectedField,
    filter.module,
    moduleOrder,
    layoutByModule,
    picklistModuleByModule
  )
  const operators = usesDynamicMultiSelect
    ? getOperatorsForDocSelectPicklist()
    : getOperatorsForCategory(category)

  const picklistContext = { moduleOrder, layoutByModule, picklistModuleByModule }

  const handleFieldKeyChange = (key: string) => {
    const opt = flatFields.find(o => o.key === key)
    if (!opt) return
    onChange(
      buildFieldChangeUpdate(filter, opt.field, opt.moduleValue, picklistContext)
    )
  }

  const handleOperatorChange = (operator: string) => {
    let nextValue = filter.value
    if (operator === 'between' && !isBetweenValue(nextValue)) {
      nextValue = { from: '', to: '' }
    } else if (operator !== 'between' && isBetweenValue(nextValue)) {
      nextValue = ''
    } else if (operatorUsesMultiValue(operator) && !isFilterValueArray(nextValue)) {
      nextValue =
        typeof nextValue === 'string' && nextValue.trim() ? [nextValue.trim()] : []
    } else if (!operatorUsesMultiValue(operator) && isFilterValueArray(nextValue)) {
      nextValue = nextValue[0] ?? ''
    }
    onChange({ ...filter, operator, value: nextValue })
  }

  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
      <FilterRowNumber rowNumber={rowNumber} />
      <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ flex: 1, minWidth: 0 }}>
        <FormControl
          size="small"
          disabled={disabled}
          sx={{ flex: 1.2, minWidth: 0, ...filterControlSx }}
        >
          <InputLabel shrink>Field</InputLabel>
          <Select
            label="Field"
            notched
            value={fieldKey && flatFields.some(o => o.key === fieldKey) ? fieldKey : ''}
            displayEmpty
            onChange={(e: SelectChangeEvent) => handleFieldKeyChange(e.target.value)}
            renderValue={v => {
              if (!v) {
                return (
                  <Typography component="span" variant="body2" color="text.secondary">
                    None
                  </Typography>
                )
              }
              return flatFields.find(o => o.key === v)?.displayLabel ?? v
            }}
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {flatFields.map(o => (
              <MenuItem key={o.key} value={o.key}>
                {o.displayLabel}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl
          size="small"
          disabled={disabled || !filter.fieldname}
          sx={{ flex: 0.85, minWidth: 88, ...filterControlSx }}
        >
          <InputLabel shrink>Operator</InputLabel>
          <Select
            label="Operator"
            notched
            value={filter.operator || ''}
            displayEmpty
            onChange={(e: SelectChangeEvent) => handleOperatorChange(e.target.value)}
            renderValue={v => {
              if (!v) {
                return (
                  <Typography component="span" variant="body2" color="text.secondary">
                    None
                  </Typography>
                )
              }
              return operators.find(o => o.value === v)?.label ?? v
            }}
          >
            {operators.map(o => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <QuickChartFilterValueInput
          field={selectedField}
          module={filter.module}
          moduleOrder={moduleOrder}
          layoutByModule={layoutByModule}
          picklistModuleByModule={picklistModuleByModule}
          operator={filter.operator}
          value={filter.value}
          onChange={value => onChange({ ...filter, value })}
          disabled={disabled || !filter.fieldname}
          userToken={userToken}
        />

        <Stack direction="row" spacing={0.25} sx={{ pt: 0.5, flexShrink: 0 }}>
          <IconButton
            size="small"
            aria-label="Remove condition"
            onClick={onRemove}
            disabled={disabled}
            sx={{ color: 'error.main' }}
          >
            <RemoveCircleOutlineIcon fontSize="small" />
          </IconButton>
          {isLast && onAddAfter ? (
            <IconButton
              size="small"
              aria-label="Add condition"
              onClick={onAddAfter}
              disabled={disabled}
              sx={{ color: 'success.main' }}
            >
              <AddCircleOutlineIcon fontSize="small" />
            </IconButton>
          ) : null}
        </Stack>
      </Stack>
    </Box>
  )
}

export type QuickChartCriteriaFilterSectionProps = {
  filters: QuickChartCriteriaFilterRow[]
  moduleOrder: FilterModuleOption[]
  catalogByModule: Record<string, ReportFormFieldCatalogEntry[]>
  layoutByModule?: Record<string, string>
  picklistModuleByModule?: Record<string, string>
  catalogLoading?: boolean
  disabled?: boolean
  defaultModule: string
  userToken?: string
  onChange: (filters: QuickChartCriteriaFilterRow[]) => void
  onRemoveSection: () => void
}

export function QuickChartCriteriaFilterSection({
  filters,
  moduleOrder,
  catalogByModule,
  layoutByModule = {},
  picklistModuleByModule = {},
  catalogLoading = false,
  disabled = false,
  defaultModule,
  userToken,
  onChange,
  onRemoveSection,
}: QuickChartCriteriaFilterSectionProps) {
  const flatFields = useMemo(
    () => flattenCatalogFields(moduleOrder, catalogByModule),
    [catalogByModule, moduleOrder]
  )

  const addRow = () => {
    onChange([...filters, createEmptyQuickChartFilter(defaultModule)])
  }

  const removeRow = (id: number) => {
    const next = filters.filter(f => f.id !== id)
    onChange(next.length ? next : [createEmptyQuickChartFilter(defaultModule)])
  }

  const patchRow = (id: number, patch: Partial<QuickChartCriteriaFilterRow>) => {
    onChange(filters.map(f => (f.id === id ? { ...f, ...patch } : f)))
  }

  if (filters.length === 0) {
    return null
  }

  return (
    <Box
      sx={{
        mb: 2,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1.5,
        bgcolor: 'background.paper',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.25,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: theme => theme.palette.grey[50],
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          Criteria filter
        </Typography>
        <Link
          component="button"
          type="button"
          variant="body2"
          underline="hover"
          onClick={onRemoveSection}
          sx={{ color: 'error.main', fontWeight: 500, border: 'none', bgcolor: 'transparent' }}
        >
          Remove
        </Link>
      </Box>

      <Box sx={{ px: 2, py: 1.5 }}>
        {catalogLoading ? (
          <Stack direction="row" alignItems="center" spacing={1} sx={{ py: 1 }}>
            <CircularProgress size={18} aria-hidden />
            <Typography variant="body2" color="text.secondary">
              Loading fields…
            </Typography>
          </Stack>
        ) : null}

        {!catalogLoading && flatFields.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
            Select a module to load filter fields.
          </Typography>
        ) : null}

        {!catalogLoading && filters.length > 0
          ? filters.map((f, idx) => (
              <CriteriaFilterRow
                key={f.id}
                filter={f}
                rowNumber={idx + 1}
                isLast={idx === filters.length - 1}
                flatFields={flatFields}
                moduleOrder={moduleOrder}
                layoutByModule={layoutByModule}
                picklistModuleByModule={picklistModuleByModule}
                userToken={userToken}
                disabled={disabled || flatFields.length === 0}
                onChange={next => patchRow(f.id, next)}
                onRemove={() => removeRow(f.id)}
                onAddAfter={idx === filters.length - 1 ? addRow : undefined}
              />
            ))
          : null}
      </Box>
    </Box>
  )
}
