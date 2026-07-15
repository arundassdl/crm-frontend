// MUI Imports
import type { Theme } from '@mui/material/styles'

// Config Imports
import themeConfig from '@configs/themeConfig'

// Design-system primary button color (blue). Kept button-scoped so the theme
// `primary` palette can stay independent while every primary button matches the
// reference design: solid blue, white text, rounded, title-case.
const BTN_PRIMARY = '#1D4ED8'
const BTN_PRIMARY_HOVER = '#2563EB'
const BTN_PRIMARY_ACTIVE = '#0C2472'
const BTN_PRIMARY_TINT = 'rgb(29 78 216 / 0.08)'

const iconStyles = (size?: string) => ({
  '& > *:nth-of-type(1)': {
    ...(size === 'small'
      ? {
          fontSize: '14px'
        }
      : {
          ...(size === 'medium'
            ? {
                fontSize: '16px'
              }
            : {
                fontSize: '20px'
              })
        })
  }
})

const button: Theme['components'] = {
  MuiButtonBase: {
    defaultProps: {
      disableRipple: themeConfig.disableRipple
    }
  },
  MuiButton: {
    styleOverrides: {
      root: ({ theme, ownerState }) => ({
        ...(ownerState.variant === 'text'
          ? {
              ...(ownerState.size === 'small' && {
                padding: theme.spacing(2, 2.5)
              }),
              ...(ownerState.size === 'medium' && {
                padding: theme.spacing(2, 3.5)
              }),
              ...(ownerState.size === 'large' && {
                padding: theme.spacing(2, 4.5)
              })
            }
          : {
              ...(ownerState.variant === 'outlined'
                ? {
                    ...(ownerState.size === 'small' && {
                      padding: theme.spacing(1.75, 3.25)
                    }),
                    ...(ownerState.size === 'medium' && {
                      padding: theme.spacing(1.75, 4.25)
                    }),
                    ...(ownerState.size === 'large' && {
                      padding: theme.spacing(1.75, 5.25)
                    })
                  }
                : {
                    ...(ownerState.size === 'small' && {
                      padding: theme.spacing(2, 3.5)
                    }),
                    ...(ownerState.size === 'medium' && {
                      padding: theme.spacing(2, 4.5)
                    }),
                    ...(ownerState.size === 'large' && {
                      padding: theme.spacing(2, 5.5)
                    })
                  })
            })
      }),
      contained: ({ ownerState }) => ({
        boxShadow: 'var(--mui-customShadows-xs)',
        ...(!ownerState.disabled && {
          '&:hover, &.Mui-focusVisible': {
            boxShadow: 'var(--mui-customShadows-xs)'
          },
          '&:active': {
            boxShadow: 'none'
          }
        })
      }),
      sizeSmall: ({ theme }) => ({
        lineHeight: 1.38462,
        fontSize: theme.typography.body2.fontSize,
        borderRadius: 'var(--mui-shape-customBorderRadius-sm)'
      }),
      sizeLarge: {
        fontSize: '1.0625rem',
        lineHeight: 1.529412,
        borderRadius: 'var(--mui-shape-customBorderRadius-lg)'
      },
      startIcon: ({ theme, ownerState }) => ({
        ...(ownerState.size === 'small'
          ? {
              marginInlineEnd: theme.spacing(1.5)
            }
          : {
              ...(ownerState.size === 'medium'
                ? {
                    marginInlineEnd: theme.spacing(2)
                  }
                : {
                    marginInlineEnd: theme.spacing(2.5)
                  })
            }),
        ...iconStyles(ownerState.size)
      }),
      endIcon: ({ theme, ownerState }) => ({
        ...(ownerState.size === 'small'
          ? {
              marginInlineStart: theme.spacing(1.5)
            }
          : {
              ...(ownerState.size === 'medium'
                ? {
                    marginInlineStart: theme.spacing(2)
                  }
                : {
                    marginInlineStart: theme.spacing(2.5)
                  })
            }),
        ...iconStyles(ownerState.size)
      })
    },
    variants: [
      {
        props: { variant: 'text', color: 'primary' },
        style: {
          color: BTN_PRIMARY,
          textTransform: 'none',
          fontWeight: 600,
          '&:not(.Mui-disabled):hover, &:not(.Mui-disabled):active, &.Mui-focusVisible:not(:has(span.MuiTouchRipple-root))':
            {
              backgroundColor: BTN_PRIMARY_TINT
            },
          '&.Mui-disabled': {
            opacity: 0.45,
            color: BTN_PRIMARY
          }
        }
      },
      {
        props: { variant: 'text', color: 'secondary' },
        style: {
          '&:not(.Mui-disabled):hover, &:not(.Mui-disabled):active, &.Mui-focusVisible:not(:has(span.MuiTouchRipple-root))':
            {
              backgroundColor: 'var(--mui-palette-secondary-lighterOpacity)'
            },
          '&.Mui-disabled': {
            opacity: 0.45,
            color: 'var(--mui-palette-secondary-main)'
          }
        }
      },
      {
        props: { variant: 'text', color: 'error' },
        style: {
          '&:not(.Mui-disabled):hover, &:not(.Mui-disabled):active, &.Mui-focusVisible:not(:has(span.MuiTouchRipple-root))':
            {
              backgroundColor: 'var(--mui-palette-error-lighterOpacity)'
            },
          '&.Mui-disabled': {
            opacity: 0.45,
            color: 'var(--mui-palette-error-main)'
          }
        }
      },
      {
        props: { variant: 'text', color: 'warning' },
        style: {
          '&:not(.Mui-disabled):hover, &:not(.Mui-disabled):active, &.Mui-focusVisible:not(:has(span.MuiTouchRipple-root))':
            {
              backgroundColor: 'var(--mui-palette-warning-lighterOpacity)'
            },
          '&.Mui-disabled': {
            opacity: 0.45,
            color: 'var(--mui-palette-warning-main)'
          }
        }
      },
      {
        props: { variant: 'text', color: 'info' },
        style: {
          '&:not(.Mui-disabled):hover, &:not(.Mui-disabled):active, &.Mui-focusVisible:not(:has(span.MuiTouchRipple-root))':
            {
              backgroundColor: 'var(--mui-palette-info-lighterOpacity)'
            },
          '&.Mui-disabled': {
            opacity: 0.45,
            color: 'var(--mui-palette-info-main)'
          }
        }
      },
      {
        props: { variant: 'text', color: 'success' },
        style: {
          '&:not(.Mui-disabled):hover, &:not(.Mui-disabled):active, &.Mui-focusVisible:not(:has(span.MuiTouchRipple-root))':
            {
              backgroundColor: 'var(--mui-palette-success-lighterOpacity)'
            },
          '&.Mui-disabled': {
            opacity: 0.45,
            color: 'var(--mui-palette-success-main)'
          }
        }
      },
      {
        props: { variant: 'outlined', color: 'primary' },
        style: {
          borderColor: BTN_PRIMARY,
          color: BTN_PRIMARY,
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: '9px',
          '&:not(.Mui-disabled):hover, &:not(.Mui-disabled):active, &.Mui-focusVisible:not(:has(span.MuiTouchRipple-root))':
            {
              backgroundColor: BTN_PRIMARY_TINT,
              borderColor: BTN_PRIMARY
            },
          '&.Mui-disabled': {
            opacity: 0.45,
            color: BTN_PRIMARY,
            borderColor: BTN_PRIMARY
          }
        }
      },
      {
        props: { variant: 'outlined', color: 'secondary' },
        style: {
          borderColor: 'var(--mui-palette-secondary-main)',
          '&:not(.Mui-disabled):hover, &:not(.Mui-disabled):active, &.Mui-focusVisible:not(:has(span.MuiTouchRipple-root))':
            {
              backgroundColor: 'var(--mui-palette-secondary-lighterOpacity)'
            },
          '&.Mui-disabled': {
            opacity: 0.45,
            color: 'var(--mui-palette-secondary-main)',
            borderColor: 'var(--mui-palette-secondary-main)'
          }
        }
      },
      {
        props: { variant: 'outlined', color: 'error' },
        style: {
          borderColor: 'var(--mui-palette-error-main)',
          '&:not(.Mui-disabled):hover, &:not(.Mui-disabled):active, &.Mui-focusVisible:not(:has(span.MuiTouchRipple-root))':
            {
              backgroundColor: 'var(--mui-palette-error-lighterOpacity)'
            },
          '&.Mui-disabled': {
            opacity: 0.45,
            color: 'var(--mui-palette-error-main)',
            borderColor: 'var(--mui-palette-error-main)'
          }
        }
      },
      {
        props: { variant: 'outlined', color: 'warning' },
        style: {
          borderColor: 'var(--mui-palette-warning-main)',
          '&:not(.Mui-disabled):hover, &:not(.Mui-disabled):active, &.Mui-focusVisible:not(:has(span.MuiTouchRipple-root))':
            {
              backgroundColor: 'var(--mui-palette-warning-lighterOpacity)'
            },
          '&.Mui-disabled': {
            opacity: 0.45,
            color: 'var(--mui-palette-warning-main)',
            borderColor: 'var(--mui-palette-warning-main)'
          }
        }
      },
      {
        props: { variant: 'outlined', color: 'info' },
        style: {
          borderColor: 'var(--mui-palette-info-main)',
          '&:not(.Mui-disabled):hover, &:not(.Mui-disabled):active, &.Mui-focusVisible:not(:has(span.MuiTouchRipple-root))':
            {
              backgroundColor: 'var(--mui-palette-info-lighterOpacity)'
            },
          '&.Mui-disabled': {
            opacity: 0.45,
            color: 'var(--mui-palette-info-main)',
            borderColor: 'var(--mui-palette-info-main)'
          }
        }
      },
      {
        props: { variant: 'outlined', color: 'success' },
        style: {
          borderColor: 'var(--mui-palette-success-main)',
          '&:not(.Mui-disabled):hover, &:not(.Mui-disabled):active, &.Mui-focusVisible:not(:has(span.MuiTouchRipple-root))':
            {
              backgroundColor: 'var(--mui-palette-success-lighterOpacity)'
            },
          '&.Mui-disabled': {
            opacity: 0.45,
            color: 'var(--mui-palette-success-main)',
            borderColor: 'var(--mui-palette-success-main)'
          }
        }
      },
      {
        props: { variant: 'contained', color: 'primary' },
        style: {
          backgroundColor: BTN_PRIMARY,
          color: '#fff',
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: '9px',
          '&:hover': {
            backgroundColor: BTN_PRIMARY_HOVER
          },
          '&:not(.Mui-disabled):active, &.Mui-focusVisible:not(:has(span.MuiTouchRipple-root))': {
            backgroundColor: BTN_PRIMARY_ACTIVE
          },
          '&.Mui-disabled': {
            opacity: 0.45,
            color: '#fff',
            backgroundColor: BTN_PRIMARY
          }
        }
      },
      {
        props: { variant: 'contained', color: 'secondary' },
        style: {
          '&:not(.Mui-disabled):active, &.Mui-focusVisible:not(:has(span.MuiTouchRipple-root))': {
            backgroundColor: 'var(--mui-palette-secondary-dark)'
          },
          '&.Mui-disabled': {
            opacity: 0.45,
            color: 'var(--mui-palette-secondary-contrastText)',
            backgroundColor: 'var(--mui-palette-secondary-main)'
          }
        }
      },
      {
        props: { variant: 'contained', color: 'error' },
        style: {
          '&:not(.Mui-disabled):active, &.Mui-focusVisible:not(:has(span.MuiTouchRipple-root))': {
            backgroundColor: 'var(--mui-palette-error-dark)'
          },
          '&.Mui-disabled': {
            opacity: 0.45,
            color: 'var(--mui-palette-error-contrastText)',
            backgroundColor: 'var(--mui-palette-error-main)'
          }
        }
      },
      {
        props: { variant: 'contained', color: 'warning' },
        style: {
          '&:not(.Mui-disabled):active, &.Mui-focusVisible:not(:has(span.MuiTouchRipple-root))': {
            backgroundColor: 'var(--mui-palette-warning-dark)'
          },
          '&.Mui-disabled': {
            opacity: 0.45,
            color: 'var(--mui-palette-warning-contrastText)',
            backgroundColor: 'var(--mui-palette-warning-main)'
          }
        }
      },
      {
        props: { variant: 'contained', color: 'info' },
        style: {
          '&:not(.Mui-disabled):active, &.Mui-focusVisible:not(:has(span.MuiTouchRipple-root))': {
            backgroundColor: 'var(--mui-palette-info-dark)'
          },
          '&.Mui-disabled': {
            opacity: 0.45,
            color: 'var(--mui-palette-info-contrastText)',
            backgroundColor: 'var(--mui-palette-info-main)'
          }
        }
      },
      {
        props: { variant: 'contained', color: 'success' },
        style: {
          '&:not(.Mui-disabled):active, &.Mui-focusVisible:not(:has(span.MuiTouchRipple-root))': {
            backgroundColor: 'var(--mui-palette-success-dark)'
          },
          '&.Mui-disabled': {
            opacity: 0.45,
            color: 'var(--mui-palette-success-contrastText)',
            backgroundColor: 'var(--mui-palette-success-main)'
          }
        }
      }
    ]
  }
}

export default button
