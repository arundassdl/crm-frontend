// React Imports
import React from 'react'

// MUI Imports
import type { Theme } from '@mui/material/styles'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'

// Type Imports
import type { Skin } from '@core/types'

const autocomplete = (skin: Skin): Theme['components'] => ({
  MuiAutocomplete: {
    defaultProps: {
      ...(skin === 'bordered' && {
        slotProps: {
          paper: {
            variant: 'outlined'
          }
        }
      }),
      ChipProps: {
        size: 'small'
      },
      popupIcon: <ArrowDropDownIcon />
    },
    styleOverrides: {
      root: {
        '& .MuiButtonBase-root.Mui-disabled i, & .MuiButtonBase-root.Mui-disabled svg': {
          color: 'var(--mui-palette-action-disabled)'
        },
        '& .MuiOutlinedInput-input': {
          height: '1.4375em'
        }
      },
      input: {
        '& + .MuiAutocomplete-endAdornment': {
          right: '1rem',
          '& i, & svg': {
            fontSize: '1.5rem',
            color: 'var(--mui-palette-text-primary)'
          },
          '& .MuiAutocomplete-clearIndicator': {
            padding: 2
          }
        },
        '&.MuiInputBase-inputSizeSmall + .MuiAutocomplete-endAdornment': {
          '& i, & svg': {
            fontSize: '1.375rem'
          }
        }
      },
      paper: {
        borderRadius: '10px',
        ...(skin !== 'bordered' && {
          boxShadow: 'var(--mui-customShadows-lg)',
          marginBlockStart: '0.25rem'
        })
      },
      listbox: ({ theme }) => ({
        padding: theme.spacing(1),
        '& .MuiAutocomplete-option': {
          padding: theme.spacing(2, 3),
          borderRadius: '8px',
          fontSize: '0.82rem',
          color: 'var(--mui-palette-text-primary)',
          // Neutral (gray) highlight for the active/selected option to match the design.
          '&[aria-selected="true"]': {
            backgroundColor: 'var(--mui-palette-action-selected)',
            color: 'var(--mui-palette-text-primary)',
            '&.Mui-focused, &.Mui-focusVisible': {
              backgroundColor: 'var(--mui-palette-action-hover)'
            }
          }
        },
        '& .MuiAutocomplete-option.Mui-focused, & .MuiAutocomplete-option.Mui-focusVisible': {
          backgroundColor: 'var(--mui-palette-action-hover)'
        }
      })
    }
  }
})

export default autocomplete
