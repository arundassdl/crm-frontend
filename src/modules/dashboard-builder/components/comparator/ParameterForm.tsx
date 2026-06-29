'use client'

import { memo, useState } from 'react'
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormHelperText,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material'

import type { ReportFormFieldCatalogEntry } from '@/services/api/report-addon/report-fields-api'
import type { RelatedModuleOption } from '@/services/api/report-addon/related-module-api'

import type { AggregateOption } from '../../utils/buildAggregateOptions'
import type { ComparisonBasedOnOption } from '../../utils/comparisonBasedOnOptions'
import type { FlatFieldOption } from '../../utils/report-filters/flatten-catalog-fields'
import { getFieldFilterCategory } from '../../utils/report-filters/field-category'
import { getOperatorsForCategory } from '../../utils/report-filters/operators'
import type { ComparatorParameter } from '../../types/comparatorParameter'
import type { ComparatorParameterErrors } from '../../hooks/useComparatorParameters'
import { DurationFields, FormRow, type DurationFormState } from '../kpi/kpiFormShared'

export type ModuleOption = { value: string; label: string }

export type ParameterFormProps = {
  draft: ComparatorParameter
  errors: ComparatorParameterErrors
  moduleOptionsList: ModuleOption[]
  modulesLoading?: boolean
  relatedModuleOptions: RelatedModuleOption[]
  relatedModulesLoading: boolean
  measureOptions: AggregateOption[]
  measuresLoading: boolean
  fieldCatalog: ReportFormFieldCatalogEntry[]
  dateFieldOptions: FlatFieldOption[]
  comparisonBasedOnOptions: ComparisonBasedOnOption[]
  compareAmongType?: string
  onChange: (patch: Partial<ComparatorParameter>) => void
  onSave: () => void
  onCancel: () => void
}

function criteriaValueInputType(fieldtype: string, frontendFieldtype: string): string {
  const category = getFieldFilterCategory(fieldtype, frontendFieldtype)
  if (category === 'number') return 'number'
  if (category === 'date') return 'date'
  if (category === 'datetime') return 'datetime-local'
  return 'text'
}

function ParameterFormInner({
  draft,
  errors,
  moduleOptionsList,
  modulesLoading,
  relatedModuleOptions,
  relatedModulesLoading,
  measureOptions,
  measuresLoading,
  fieldCatalog,
  dateFieldOptions,
  comparisonBasedOnOptions,
  compareAmongType,
  onChange,
  onSave,
  onCancel,
}: ParameterFormProps) {
  const isTimePeriod = compareAmongType === 'time_period'
  const isPicklistValues = compareAmongType === 'picklist_values'
  const [showCriteriaFilter, setShowCriteriaFilter] = useState(Boolean(draft.criteria_field))

  const criteriaFieldEntry = fieldCatalog.find(f => f.fieldName === draft.criteria_field)
  const criteriaOperators = criteriaFieldEntry
    ? getOperatorsForCategory(getFieldFilterCategory(criteriaFieldEntry.fieldtype, criteriaFieldEntry.frontendFieldtype))
    : []
  const criteriaValueType = criteriaFieldEntry
    ? criteriaValueInputType(criteriaFieldEntry.fieldtype, criteriaFieldEntry.frontendFieldtype)
    : 'text'

  const handleModuleChange = (value: string) => {
    const opt = moduleOptionsList.find(o => o.value === value)
    onChange({
      module: value,
      module_label: opt?.label ?? '',
      related_module: undefined,
      related_module_label: undefined,
      measure: '',
      measure_label: '',
      criteria_field: undefined,
      criteria_field_label: undefined,
      criteria_operator: undefined,
      criteria_value: undefined,
      comparison_based_on: isTimePeriod ? undefined : 'owner',
      associated_date_field: undefined,
      associated_date_field_label: undefined,
    })
    setShowCriteriaFilter(false)
  }

  const handleRelatedModuleChange = (value: string) => {
    const opt = relatedModuleOptions.find(o => o.value === value)
    onChange({
      related_module: value || undefined,
      related_module_label: opt?.label,
      measure: '',
      measure_label: '',
      criteria_field: undefined,
      criteria_field_label: undefined,
      criteria_operator: undefined,
      criteria_value: undefined,
      comparison_based_on: 'owner',
    })
    setShowCriteriaFilter(false)
  }

  const handleMeasureChange = (value: string) => {
    onChange({ measure: value, measure_label: measureOptions.find(o => o.id === value)?.label ?? '' })
  }

  const handleCriteriaFieldChange = (value: string) => {
    const entry = fieldCatalog.find(f => f.fieldName === value)
    onChange({
      criteria_field: value || undefined,
      criteria_field_label: entry?.label,
      criteria_operator: undefined,
      criteria_value: undefined,
    })
  }

  const handleAssociatedDateFieldChange = (value: string) => {
    const opt = dateFieldOptions.find(o => o.key === value)
    onChange({
      associated_date_field: value || undefined,
      associated_date_field_label: opt?.displayLabel,
    })
  }

  const durationForm: DurationFormState = {
    durationField: draft.duration_field ?? '',
    durationValue: draft.duration_value ?? 'Select duration',
    durationLastValue: draft.duration_last_value ?? '',
    durationLastUnit: draft.duration_last_unit ?? 'day',
    durationFromDate: draft.duration_from_date ?? '',
    durationToDate: draft.duration_to_date ?? '',
  }

  const patchDuration = (patch: Partial<DurationFormState>) => {
    onChange({
      ...('durationField' in patch && { duration_field: patch.durationField }),
      ...('durationValue' in patch && { duration_value: patch.durationValue }),
      ...('durationLastValue' in patch && { duration_last_value: patch.durationLastValue }),
      ...('durationLastUnit' in patch && { duration_last_unit: patch.durationLastUnit }),
      ...('durationFromDate' in patch && { duration_from_date: patch.durationFromDate }),
      ...('durationToDate' in patch && { duration_to_date: patch.durationToDate }),
    })
  }

  return (
    <Box
      sx={{
        borderRadius: 1.5,
        border: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        p: 2,
      }}
    >
      <FormRow label={<Typography variant="body2">Parameter Name</Typography>}>
        <TextField
          fullWidth
          size="small"
          value={draft.parameter_name}
          onChange={e => onChange({ parameter_name: e.target.value })}
          placeholder="e.g. Revenue Generated"
          error={Boolean(errors.parameter_name)}
          helperText={errors.parameter_name}
        />
      </FormRow>

      <FormRow label={<Typography variant="body2">Metric</Typography>} alignTop>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <FormControl fullWidth size="small" error={Boolean(errors.module)}>
            <Select value={draft.module} onChange={e => handleModuleChange(e.target.value)} displayEmpty disabled={modulesLoading || isPicklistValues}>
              <MenuItem value="" disabled>
                <em>{modulesLoading ? 'Loading modules…' : 'Select module'}</em>
              </MenuItem>
              {moduleOptionsList.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
            {errors.module && <FormHelperText>{errors.module}</FormHelperText>}
          </FormControl>

          {!isTimePeriod && !isPicklistValues && (
            <FormControl fullWidth size="small" disabled={!draft.module || relatedModulesLoading}>
              <Select value={draft.related_module ?? ''} onChange={e => handleRelatedModuleChange(e.target.value)} displayEmpty>
                <MenuItem value="">
                  <em>
                    {!draft.module
                      ? 'Select module first'
                      : relatedModulesLoading
                        ? 'Loading related modules…'
                        : 'Select Related Module'}
                  </em>
                </MenuItem>
                {relatedModuleOptions.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <FormControl fullWidth size="small" error={Boolean(errors.measure)} disabled={!draft.module || measuresLoading}>
            <Select value={draft.measure} onChange={e => handleMeasureChange(e.target.value)} displayEmpty>
              <MenuItem value="" disabled>
                <em>{measuresLoading ? 'Loading measures…' : 'Select measure'}</em>
              </MenuItem>
              {measureOptions.map(opt => (
                <MenuItem key={opt.id} value={opt.id}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
            {errors.measure && <FormHelperText>{errors.measure}</FormHelperText>}
          </FormControl>
        </Box>
      </FormRow>

      <Box sx={{ pl: { md: '200px' }, mb: 2 }}>
        {!showCriteriaFilter ? (
          <Button size="small" variant="text" onClick={() => setShowCriteriaFilter(true)} disabled={!draft.module} sx={{ pl: 0 }}>
            + Criteria Filter
          </Button>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5 }}>
            <FormControl fullWidth size="small" sx={{ flex: 1 }}>
              <Select value={draft.criteria_field ?? ''} onChange={e => handleCriteriaFieldChange(e.target.value)} displayEmpty>
                <MenuItem value="">
                  <em>Field</em>
                </MenuItem>
                {fieldCatalog.map(entry => (
                  <MenuItem key={entry.fieldName} value={entry.fieldName}>
                    {entry.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small" sx={{ flex: 1 }} disabled={!draft.criteria_field}>
              <Select
                value={draft.criteria_operator ?? ''}
                onChange={e => onChange({ criteria_operator: e.target.value || undefined })}
                displayEmpty
              >
                <MenuItem value="">
                  <em>Operator</em>
                </MenuItem>
                {criteriaOperators.map(op => (
                  <MenuItem key={op.value} value={op.value}>
                    {op.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              size="small"
              sx={{ flex: 1 }}
              type={criteriaValueType}
              value={draft.criteria_value ?? ''}
              onChange={e => onChange({ criteria_value: e.target.value })}
              placeholder="Value"
              disabled={!draft.criteria_operator}
              InputLabelProps={criteriaValueType !== 'text' ? { shrink: true } : undefined}
            />
          </Box>
        )}
      </Box>

      {isTimePeriod ? (
        <FormRow label={<Typography variant="body2">Associated Date Field</Typography>}>
          <FormControl fullWidth size="small" error={Boolean(errors.associated_date_field)} disabled={!draft.module}>
            <Select
              value={draft.associated_date_field ?? ''}
              onChange={e => handleAssociatedDateFieldChange(e.target.value)}
              displayEmpty
            >
              <MenuItem value="" disabled>
                <em>{!draft.module ? 'Select module first' : 'Select date field'}</em>
              </MenuItem>
              {dateFieldOptions.map(opt => (
                <MenuItem key={opt.key} value={opt.key}>
                  {opt.displayLabel}
                </MenuItem>
              ))}
            </Select>
            {errors.associated_date_field && <FormHelperText>{errors.associated_date_field}</FormHelperText>}
          </FormControl>
        </FormRow>
      ) : (
        <>
          <FormRow label={<Typography variant="body2">Comparison Based On</Typography>}>
            <FormControl fullWidth size="small" error={Boolean(errors.comparison_based_on)} disabled={!draft.module}>
              <Select value={draft.comparison_based_on ?? ''} onChange={e => onChange({ comparison_based_on: e.target.value })} displayEmpty>
                <MenuItem value="" disabled>
                  <em>Select an option</em>
                </MenuItem>
                {comparisonBasedOnOptions.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
              {errors.comparison_based_on && <FormHelperText>{errors.comparison_based_on}</FormHelperText>}
            </FormControl>
          </FormRow>

          <DurationFields form={durationForm} patch={patchDuration} dateFieldOptions={dateFieldOptions} />

          <FormRow label={<Typography variant="body2">Trend Up/Down</Typography>}>
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={draft.trend_up_is_positive ?? true}
                  onChange={e => onChange({ trend_up_is_positive: e.target.checked })}
                />
              }
              label={<Typography variant="body2">An increasing value is a positive trend</Typography>}
              sx={{ m: 0 }}
            />
          </FormRow>
        </>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        <Button size="small" variant="outlined" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="small" variant="contained" onClick={onSave}>
          Done
        </Button>
      </Box>
    </Box>
  )
}

export const ParameterForm = memo(ParameterFormInner)
