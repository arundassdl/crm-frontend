'use client'

// React Imports
import { useRef } from 'react'

// MUI Imports
import { styled, useTheme } from '@mui/material/styles'
import MuiDrawer from '@mui/material/Drawer'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import { GearSixIcon } from '@phosphor-icons/react'

// Component Imports
import VerticalNav, { NavHeader } from '@menu/vertical-menu'
import VerticalMenu from './VerticalMenu'
import SidebarProfileSummary from './SidebarProfileSummary'
import { RouterLink } from '@menu/components/RouterLink'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'

// Style Imports
import navigationCustomStyles from '@core/styles/vertical/navigationCustomStyles'

// Reference: crm-app-UI-Arun-Latest/components/layout/Sidebar.tsx — 260px expanded (icon + label),
// 68px collapsed (icon-only), toggled by the navbar hamburger. Mobile is a 260px overlay, hidden by default.
export const EXPANDED_WIDTH = 260
export const RAIL_WIDTH = 68

const StyledBoxForShadow = styled('div')(({ theme }) => ({
  top: 60,
  left: -8,
  zIndex: 2,
  opacity: 0,
  position: 'absolute',
  pointerEvents: 'none',
  width: 'calc(100% + 15px)',
  height: theme.mixins.toolbar.minHeight,
  transition: 'opacity .15s ease-in-out',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  overflow: 'auto',
  background: `linear-gradient(var(--nav-chrome-bg) 5%, transparent)`,
  '&.scrolled': {
    opacity: 1
  }
}))

const widthMixin = (theme, width: number) => ({
  width,
  transition: theme.transitions.create('width', {
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    duration: 300
  }),
  overflowX: 'hidden'
})

const Drawer = styled(MuiDrawer, { shouldForwardProp: prop => prop !== 'open' })(({ theme }) => ({
  width: RAIL_WIDTH,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  '& .MuiDrawer-paper': {
    overflowX: 'hidden',
    backgroundColor: 'var(--nav-chrome-bg)',
    boxShadow: 'none',
    borderInlineEnd: '1px solid var(--nav-chrome-border)',
    display: 'flex',
    flexDirection: 'column'
  }
}))

const Navigation = () => {
  const theme = useTheme()
  const { isBreakpointReached, isToggled } = useVerticalNav()

  const shadowRef = useRef(null)

  const scrollMenu = (container: any, isPerfectScrollbar: boolean) => {
    container = isBreakpointReached || !isPerfectScrollbar ? container.target : container

    if (shadowRef && container.scrollTop > 0) {
      // @ts-ignore
      if (!shadowRef.current.classList.contains('scrolled')) {
        // @ts-ignore
        shadowRef.current.classList.add('scrolled')
      }
    } else {
      // @ts-ignore
      shadowRef.current.classList.remove('scrolled')
    }
  }

  // Desktop: expanded (260px, labels) by default; toggling collapses to the 68px icon rail.
  // Mobile: hidden (0px) by default; toggling opens the 260px overlay.
  const collapsed = !isBreakpointReached && isToggled === true
  const hidden = isBreakpointReached && isToggled !== true
  const drawerWidth = hidden ? 0 : collapsed ? RAIL_WIDTH : EXPANDED_WIDTH

  return (
    // eslint-disable-next-line lines-around-comment
    // Sidebar Vertical Menu
    // `width` must stay constant — `@menu`'s own VerticalNav.tsx re-fires an effect whenever this
    // prop changes and, on desktop, force-resets `isToggled` back to `false` as a side effect
    // (its `if (!breakpointReached) updateVerticalNavState({ isToggled: false })`). Deriving `width`
    // from `collapsed` (which derives from `isToggled`) creates a toggle → reset → toggle loop that
    // makes the hamburger appear to do nothing. The collapsed-width override is applied purely via
    // CSS instead, in `navigationCustomStyles.ts`.
    <VerticalNav width={EXPANDED_WIDTH} customStyles={navigationCustomStyles(theme, collapsed)}>
      <Drawer
        variant='permanent'
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': widthMixin(theme, drawerWidth)
        }}
      >
        {/* Nav Header (kept empty — logo lives in the top navbar) */}
        <NavHeader>
          <></>
        </NavHeader>
        <StyledBoxForShadow ref={shadowRef} />

        <Box sx={{ flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <VerticalMenu scrollMenu={scrollMenu} collapsed={collapsed} />
        </Box>

        {/* Pinned bottom section: settings + profile summary */}
        <Box
          sx={{
            flexShrink: 0,
            borderBlockStart: '1px solid var(--nav-chrome-border)',
            paddingInline: collapsed ? 1 : 1.25,
            paddingBlockEnd: 1.5,
            paddingBlockStart: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5
          }}
        >
          {collapsed ? (
            <Tooltip title='Settings' placement='right'>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <IconButton
                  component={RouterLink}
                  href='/settings'
                  sx={{
                    inlineSize: 40,
                    blockSize: 40,
                    borderRadius: '8px',
                    color: 'var(--nav-chrome-text-muted)',
                    '&:hover': {
                      backgroundColor: 'var(--nav-chrome-active-bg)',
                      color: 'var(--nav-chrome-active-text)'
                    }
                  }}
                >
                  <GearSixIcon size={18} weight='duotone' />
                </IconButton>
              </Box>
            </Tooltip>
          ) : (
            <Box
              component={RouterLink}
              href='/settings'
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                paddingInline: 1.5,
                paddingBlock: 1.25,
                borderRadius: '8px',
                fontSize: 16,
                fontWeight: 500,
                textDecoration: 'none',
                color: 'var(--nav-chrome-text-muted)',
                '&:hover': {
                  backgroundColor: 'var(--nav-chrome-active-bg)',
                  color: 'var(--nav-chrome-active-text)'
                }
              }}
            >
              <GearSixIcon size={18} weight='duotone' />
              Settings
            </Box>
          )}
          <SidebarProfileSummary collapsed={collapsed} />
        </Box>
      </Drawer>
    </VerticalNav>
  )
}

export default Navigation
