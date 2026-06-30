'use client'

import { useId } from 'react'
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  FormControl,
  FormControlLabel,
  FormHelperText,
  IconButton,
  Radio,
  RadioGroup,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'

import type { PicklistCategory, PicklistMode } from '../../hooks/useComparatorConfigForm'
import type { PicklistValueOption } from '../../hooks/useCompareAmongOptions'
import { createWidgetId } from '../../utils/layoutHelpers'

type Props = {
  mode: PicklistMode
  onModeChange: (mode: PicklistMode) => void

  picklistValueOptions: PicklistValueOption[]
  picklistValuesLoading: boolean

  selectedPicklistValues: string[]
  onSelectedChange: (values: string[]) => void

  categories: PicklistCategory[]
  onCategoriesChange: (categories: PicklistCategory[]) => void

  error?: string
}

export function PicklistValuesConfig({
  mode,
  onModeChange,
  picklistValueOptions,
  picklistValuesLoading,
  selectedPicklistValues,
  onSelectedChange,
  categories,
  onCategoriesChange,
  error,
}: Props) {
  const radioGroupId = useId()

  const selectedOptions = picklistValueOptions.filter(o => selectedPicklistValues.includes(o.value))

  const addCategory = () => {
    onCategoriesChange([
      ...categories,
      { id: createWidgetId('cat'), label: '', values: [] },
    ])
  }

  const updateCategory = (id: string, patch: Partial<PicklistCategory>) => {
    onCategoriesChange(categories.map(c => (c.id === id ? { ...c, ...patch } : c)))
  }

  const removeCategory = (id: string) => {
    onCategoriesChange(categories.filter(c => c.id !== id))
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <FormControl component="fieldset">
        <RadioGroup
          id={radioGroupId}
          row
          value={mode}
          onChange={e => onModeChange(e.target.value as PicklistMode)}
        >
          <FormControlLabel
            value="select_values"
            control={<Radio size="small" />}
            label={<Typography variant="body2">Select Values</Typography>}
          />
          <FormControlLabel
            value="group_categories"
            control={<Radio size="small" />}
            label={<Typography variant="body2">Group Related Values into Categories</Typography>}
          />
        </RadioGroup>
      </FormControl>

      {mode === 'select_values' && (
        <Box>
          <Autocomplete
            multiple
            size="small"
            fullWidth
            options={picklistValueOptions}
            getOptionLabel={o => o.label}
            value={selectedOptions}
            isOptionEqualToValue={(o, v) => o.value === v.value}
            onChange={(_, value) => onSelectedChange(value.map(v => v.value))}
            loading={picklistValuesLoading}
            loadingText="Loading values…"
            noOptionsText="No values found."
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip label={option.label} size="small" {...getTagProps({ index })} />
              ))
            }
            renderInput={params => (
              <TextField
                {...params}
                placeholder={selectedPicklistValues.length === 0 ? 'Select picklist values' : undefined}
                error={Boolean(error)}
              />
            )}
          />
          {error && (
            <FormHelperText error sx={{ mx: '14px' }}>
              {error}
            </FormHelperText>
          )}
        </Box>
      )}

      {mode === 'group_categories' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {categories.map(cat => (
            <CategoryRow
              key={cat.id}
              category={cat}
              picklistValueOptions={picklistValueOptions}
              picklistValuesLoading={picklistValuesLoading}
              onChange={patch => updateCategory(cat.id, patch)}
              onRemove={() => removeCategory(cat.id)}
            />
          ))}

          <Button
            size="small"
            variant="text"
            onClick={addCategory}
            sx={{ alignSelf: 'flex-start' }}
          >
            + Add Category
          </Button>

          {error && (
            <FormHelperText error sx={{ mx: '14px' }}>
              {error}
            </FormHelperText>
          )}
        </Box>
      )}
    </Box>
  )
}

type CategoryRowProps = {
  category: PicklistCategory
  picklistValueOptions: PicklistValueOption[]
  picklistValuesLoading: boolean
  onChange: (patch: Partial<PicklistCategory>) => void
  onRemove: () => void
}

function CategoryRow({
  category,
  picklistValueOptions,
  picklistValuesLoading,
  onChange,
  onRemove,
}: CategoryRowProps) {
  const selectedOptions = picklistValueOptions.filter(o => category.values.includes(o.value))

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        alignItems: 'flex-start',
        p: 1.5,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Category name"
          value={category.label}
          onChange={e => onChange({ label: e.target.value })}
        />
        <Autocomplete
          multiple
          size="small"
          fullWidth
          options={picklistValueOptions}
          getOptionLabel={o => o.label}
          value={selectedOptions}
          isOptionEqualToValue={(o, v) => o.value === v.value}
          onChange={(_, value) => onChange({ values: value.map(v => v.value) })}
          loading={picklistValuesLoading}
          loadingText="Loading values…"
          noOptionsText="No values found."
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip label={option.label} size="small" {...getTagProps({ index })} />
            ))
          }
          renderInput={params => (
            <TextField
              {...params}
              placeholder={category.values.length === 0 ? 'Assign picklist values' : undefined}
            />
          )}
        />
      </Box>

      <Tooltip title="Remove category">
        <IconButton size="small" onClick={onRemove} sx={{ mt: 0.25 }}>
          <i className="ri-delete-bin-line" style={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>
    </Box>
  )
}
