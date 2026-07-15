// MUI Imports
import type { Theme } from '@mui/material/styles'

// Type Imports
import type { MenuProps } from '@menu/vertical-menu'

// Util Imports
import { menuClasses } from '@menu/utils/menuClasses'

/**
 * Section labels are always passed as `''` (see `VerticalMenu.tsx`), so this only needs to
 * add vertical breathing room between icon groups (e.g. "General" vs "Management") in the
 * icon-only rail — no divider line or label text to lay out.
 */
const menuSectionStyles = (theme: Theme): MenuProps['menuSectionStyles'] => {
  return {
    root: {
      marginBlockStart: theme.spacing(4),
      [`& .${menuClasses.menuSectionContent}`]: {
        paddingInline: '0 !important',
        paddingBlock: 0
      },
      [`& .${menuClasses.menuSectionLabel}`]: {
        display: 'none'
      }
    }
  }
}

export default menuSectionStyles
