// React Imports
import React from 'react'

// MUI Imports
import type { Theme } from '@mui/material/styles'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'

// Filled-triangle caret to match the form field design.
const SelectIcon = (props: any) => {
  return <ArrowDropDownIcon {...props} />
}

const iconStyles = (theme: Theme) => ({
  userSelect: 'none',
  display: 'inline-block',
  fill: 'currentColor',
  flexShrink: 0,
  transition: theme.transitions.create(['fill', 'transform'], {
    duration: theme.transitions.duration.shorter
  }),
  fontSize: '1.5rem',
  color: 'var(--mui-palette-text-primary)',
  position: 'absolute',
  right: '0.75rem',
  top: 'calc(50% - 0.5em)',
  pointerEvents: 'none'
})

const select: Theme['components'] = {
  MuiSelect: {
    defaultProps: {
      IconComponent: SelectIcon
    },
    styleOverrides: {
      select: ({ theme, ownerState }) => ({
        ...(ownerState.variant === 'outlined' && {
          minHeight: '1.5em'
        }),
        '&[aria-expanded="true"] ~ i, &[aria-expanded="true"] ~ svg': {
          transform: 'rotate(180deg)'
        },
        '& ~ i, & ~ svg': iconStyles(theme as Theme),
        '&.MuiInputBase-inputSizeSmall': {
          '& ~ i, & ~ svg': {
            height: '1.375rem',
            width: '1.375rem'
          }
        },
        '&:not(aria-label="Without label") ~ .MuiOutlinedInput-notchedOutline > legend > span': {
          paddingInline: '5px'
        }
      })
    }
  },
  MuiNativeSelect: {
    styleOverrides: {
      select: ({ theme }) => ({
        '& + i, & + svg': iconStyles(theme as Theme)
      })
    }
  }
}

export default select
