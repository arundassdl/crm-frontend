// MUI Imports
import type { Theme } from '@mui/material/styles'

// Type Imports
import type { Skin } from '@core/types'

const menu = (skin: Skin): Theme['components'] => ({
  MuiMenu: {
    defaultProps: {
      ...(skin === 'bordered' && {
        slotProps: {
          paper: {
            elevation: 0
          }
        }
      })
    },
    styleOverrides: {
      paper: ({ theme }) => ({
        marginBlockStart: theme.spacing(0.75),
        borderRadius: '10px',
        ...(skin !== 'bordered' && {
          boxShadow: 'var(--mui-customShadows-lg)'
        })
      }),
      list: ({ theme }) => ({
        padding: theme.spacing(1)
      })
    }
  },
  MuiMenuItem: {
    styleOverrides: {
      root: ({ theme }) => ({
        paddingBlock: theme.spacing(2),
        borderRadius: '8px',
        fontSize: '0.82rem',
        color: 'var(--mui-palette-text-primary)',
        '& i, & svg': {
          fontSize: '1.375rem'
        },
        '& .MuiListItemIcon-root': {
          minInlineSize: 0
        },
        // Neutral (gray) highlight for the selected item to match the design.
        '&.Mui-selected': {
          backgroundColor: 'var(--mui-palette-action-selected)',
          color: 'var(--mui-palette-text-primary)',
          '& .MuiListItemIcon-root': {
            color: 'var(--mui-palette-text-primary)'
          },
          '&:hover, &.Mui-focused, &.Mui-focusVisible': {
            backgroundColor: 'var(--mui-palette-action-hover)'
          }
        },
        '&.Mui-disabled': {
          color: 'var(--mui-palette-text-disabled)',
          opacity: 1
        }
      })
    }
  }
})

export default menu
