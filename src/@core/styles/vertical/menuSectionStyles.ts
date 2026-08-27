// MUI Imports
import type { Theme } from '@mui/material/styles'

// Type Imports
import type { MenuProps } from '@menu/vertical-menu'

// Util Imports
import { menuClasses } from '@menu/utils/menuClasses'

/**
 * Section labels are always passed as `''` (see `VerticalMenu.tsx`), so sections are purely
 * structural — they carry no heading to separate one group from the next.
 *
 * That's why there is no top margin here: a section-level gap would show up as an unexplained
 * blank band between two otherwise identical rows (and above the very first row, since the
 * first section gets it too). The reference design lists every module at one even rhythm, so
 * the only vertical spacing between rows comes from `menuItemStyles`' per-item margin.
 */
const menuSectionStyles = (theme: Theme): MenuProps['menuSectionStyles'] => {
  return {
    root: {
      marginBlockStart: 0,
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
