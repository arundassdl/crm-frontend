// MUI Imports
import type { Theme } from '@mui/material/styles'

const tabs: Theme['components'] = {
  MuiTabs: {
    styleOverrides: {
      indicator: {
        height: 0,
      },
      root: ({ theme, ownerState }) => ({
        minBlockSize: 38,
        borderRadius: 'var(--mui-shape-borderRadius)',
        ...(ownerState.orientation === 'horizontal'
          ? {
              borderBlockEnd: '0px solid var(--mui-palette-divider)'
            }
          : {
              borderInlineEnd: '0px solid var(--mui-palette-divider)'
            }),
            '& .MuiTabs-flexContainer':{
              gap: '0.25rem'
            },
        '& .MuiTab-root': {
          minWidth: 130,
          minHeight: 38,
          padding: '0.5rem 1.375rem',
          paddingBlockEnd: '0.5rem',
          borderRadius: 'var(--mui-shape-borderRadius)'
        },
        '& .MuiTab-root:hover': {
          ...(ownerState.orientation === 'horizontal'
            ? {                
                ...(ownerState.textColor === 'secondary'
                  ? {
                    border: 0,
                    backgroundColor: 'var(--mui-palette-primary-lightOpacity)',
                    color: 'var(--mui-palette-primary-main)',
                    paddingBlockEnd: '0.5rem',
                    borderRadius: 'var(--mui-shape-borderRadius)',
                      // color: 'var(--mui-palette-secondary-main)',
                      borderBlockEnd: '2px solid var(--mui-palette-secondary-lightOpacity)'
                    }
                  : {
                      // color: 'var(--mui-palette-primary-main)',
                      borderBlockEnd: '2px solid var(--mui-palette-primary-lightOpacity)',
                      border: 0,
                    backgroundColor: 'var(--mui-palette-primary-lightOpacity)',
                    color: 'var(--mui-palette-primary-main)',
                    paddingBlockEnd: '0.5rem',
                    borderRadius: 'var(--mui-shape-borderRadius)'
                    })
              }
            : {
                paddingInlineEnd: theme.spacing(5),
                ...(ownerState.textColor === 'secondary'
                  ? {
                      color: 'var(--mui-palette-secondary-main)',
                      borderInlineEnd: '2px solid var(--mui-palette-secondary-mainOpacity)'
                    }
                  : {
                      color: 'var(--mui-palette-primary-main)',
                      borderInlineEnd: '2px solid var(--mui-palette-primary-mainOpacity)'
                    })
              }),
          '& .MuiTabScrollButton-root': {
            borderRadius: theme.shape.borderRadius
          }
        },
        '& ~ .MuiTabPanel-root': {
          ...(ownerState.orientation === 'horizontal'
            ? {
                paddingBlockStart: theme.spacing(5)
              }
            : {
                paddingInlineStart: theme.spacing(5)
              })
        }
      }),
      vertical: {
        minWidth: 131,
        '& .MuiTab-root': {
          minWidth: 130,
          minHeight: 38,
          padding: '0.5rem 1.375rem',
          borderRadius: 'var(--mui-shape-borderRadius)'
        }
      }
    }
  },
  MuiTab: {
    styleOverrides: {
      root: ({ theme, ownerState }) => ({
        lineHeight: 1.4667,
        padding: theme.spacing(2, 5.5),
        minBlockSize: 38,
        color: 'var(--mui-palette-text-primary)',
        '& > .MuiTab-iconWrapper': {
          fontSize: '1.125rem',
          ...(ownerState.iconPosition === 'start' && {
            marginInlineEnd: theme.spacing(1.5)
          }),
          ...(ownerState.iconPosition === 'end' && {
            marginInlineStart: theme.spacing(1.5)
          })
        },   
        selected: {
          backgroundColor: 'var(--mui-palette-primary-main) !important',
          color: 'var(--mui-palette-primary-contrastText) !important',
          boxShadow: 'var(--mui-customShadows-xs)'
        },     
        '&.Mui-selected': {
          backgroundColor: 'var(--mui-palette-primary-main) !important',
          color: 'var(--mui-palette-primary-contrastText) !important',
          boxShadow: 'var(--mui-customShadows-xs)',
          '& .MuiListItemIcon-root': {
            color: 'var(--mui-palette-primary-main)'
          },
          '&:hover, &.Mui-focused, &.Mui-focusVisible': {
            // backgroundColor: 'var(--mui-palette-primary-mainOpacity)'
            backgroundColor: 'var(--mui-palette-primary-main) !important',
            color: 'var(--mui-palette-primary-contrastText) !important',
          }
        },
      })
      
    }
  },
  MuiTabPanel: {
    styleOverrides: {
      root: {
        padding: 0
      }
    }
  }
}

export default tabs
