// MUI Imports
import type { Theme } from '@mui/material/styles'

// Util Imports
import { menuClasses, verticalNavClasses } from '@menu/utils/menuClasses'

/**
 * Matches `Navigation.tsx`'s `RAIL_WIDTH`. Duplicated as a literal (not imported) to avoid a
 * circular import — `Navigation.tsx` imports this file.
 */
const RAIL_WIDTH_PX = 68

/**
 * `menuItemStyles.ts` styles the expanded (260px, icon + label) row — the collapsed (68px,
 * icon-only) look is layered on here via `.ts-toggled` class overrides, since `@menu`'s style
 * functions don't receive the collapsed/toggled state directly. `.ts-toggled` also applies on
 * mobile when the overlay is *open* (opposite meaning), so these overrides are scoped to
 * `:not(.ts-breakpoint-reached)` — desktop-collapsed only.
 *
 * The outer `<aside>` (`StyledVerticalNav`) itself must also shrink to `RAIL_WIDTH_PX` here —
 * it's the element that reserves space in the page's flex row (`VerticalLayout.tsx`), and
 * `Navigation.tsx` intentionally passes a *constant* `width` prop to `<VerticalNav>` (not a
 * value derived from `collapsed`) to avoid re-triggering `@menu`'s own width-change effect,
 * which force-resets `isToggled` on desktop. So the resize has to happen here, via CSS, instead
 * of via that prop.
 */
const navigationCustomStyles = (theme: Theme, collapsed: boolean) => {
  return {
    color: 'var(--nav-chrome-text-primary)',
    zIndex: 'var(--drawer-z-index) !important',
    [`& .${verticalNavClasses.bgColorContainer}`]: {
      backgroundColor: 'var(--nav-chrome-bg)'
    },
    [`& .${verticalNavClasses.header}`]: {
      paddingBlock: theme.spacing(5),
      paddingInline: theme.spacing(5.5, 4),
    },
    [`& .${verticalNavClasses.container}`]: {
      transition: 'none',
      borderColor: 'transparent',
      [`& .${verticalNavClasses.toggled}`]: {
        boxShadow: 'var(--mui-customShadows-lg)'
      }
    },
    [`& .${menuClasses.root}`]: {
      paddingBlockEnd: theme.spacing(2),
      paddingInline: collapsed ? 4 : 8,
      paddingTop: 12,
    },
    [`&.${verticalNavClasses.toggled}:not(.${verticalNavClasses.breakpointReached})`]: {
      inlineSize: `${RAIL_WIDTH_PX}px !important`,
      minInlineSize: `${RAIL_WIDTH_PX}px !important`,
      // `StyledVerticalNav.tsx` applies a hardcoded `margin-inline-start: -200px` to `.ts-toggled`
      // on desktop, left over from an older width scheme. Neutralize it — the rail-width override
      // above already produces the correct 68px column without any extra shift.
      marginInlineStart: '0 !important',
      [`& .${menuClasses.label}, & .${menuClasses.suffix}`]: {
        display: 'none !important'
      },
      [`& .${menuClasses.button}`]: {
        justifyContent: 'center !important',
        paddingInline: '0 !important',
        gap: '0 !important',
        inlineSize: '40px !important',
        marginInline: 'auto !important'
      }
    },
    [`& .${verticalNavClasses.backdrop}`]: {
      backgroundColor: 'var(--backdrop-color)'
    }
  }
}

export default navigationCustomStyles
