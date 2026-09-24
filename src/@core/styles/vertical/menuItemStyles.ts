// MUI Imports
import type { Theme } from '@mui/material/styles'

// Type Imports
import type { MenuItemStyles } from '@menu/types'

// Util Imports
import { menuClasses } from '@menu/utils/menuClasses'

/**
 * Base (expanded, 260px) row styles — reference: `crm-app-UI-Arun-Latest/components/layout/Sidebar.tsx`
 * desktop `navItems.map(...)` block. The collapsed (68px) icon-only look is layered on top via
 * `.ts-toggled` class overrides in `navigationCustomStyles.ts`, since these style functions don't
 * receive the collapsed/toggled state.
 */
const menuItemStyles = (theme: Theme): MenuItemStyles => {
  return {
    root: {
      marginBlockStart: theme.spacing(0.5),
      '&:first-of-type': {
        marginBlockStart: 0
      },
      [`&.${menuClasses.disabled} > .${menuClasses.button}`]: {
        color: 'var(--mui-palette-text-disabled)',
        [`& .${menuClasses.icon}`]: {
          color: 'inherit'
        }
      }
    },
    /**
     * `MenuButton`'s own base styles hardcode `.ts-active { background: #765feb }` and are
     * interpolated *after* `root`'s styles in `StyledVerticalMenuItem`, so a `root`-level
     * active override loses on CSS source order. Setting the active color/bg here (still
     * inside the `> .ts-menu-button {}` block, but after the base styles) with `!important`
     * is what actually wins.
     */
    button: ({ active }) => ({
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      inlineSize: '100%',
      minBlockSize: 40,
      padding: 0,
      paddingInline: 12,
      paddingBlock: 10,
      borderRadius: 8,
      fontSize: 16,
      fontWeight: 500,
      ...(active
        ? {
            color: 'var(--nav-chrome-active-text) !important',
            backgroundColor: 'var(--nav-chrome-active-bg) !important'
          }
        : {
            color: 'var(--nav-chrome-text-muted)',
            '&:hover, &:focus-visible': {
              backgroundColor: 'var(--nav-chrome-active-bg)',
              color: 'var(--nav-chrome-active-text)'
            }
          })
    }),
    label: {
      flexGrow: 1,
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis'
    },
    icon: {
      flexShrink: 0,
      fontSize: '1.125rem',
      '& > i, & > svg': {
        fontSize: 'inherit'
      }
    },
    prefix: {
      display: 'none'
    },
    suffix: {
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center'
    }
  }
}

export default menuItemStyles
