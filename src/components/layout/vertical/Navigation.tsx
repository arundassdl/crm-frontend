'use client'

// React Imports
import { useRef } from 'react'

// Next Imports
import Link from 'next/link'

// MUI Imports
import { styled, useTheme } from '@mui/material/styles'
import MuiDrawer from '@mui/material/Drawer'
import Box from '@mui/material/Box'

// Component Imports
import VerticalNav, { NavHeader } from '@menu/vertical-menu'
import VerticalMenu from './VerticalMenu'
import SidebarProfileSummary from './SidebarProfileSummary'
import NavToggle from './NavToggle'
import Logo from '../shared/Logo'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'

// Style Imports
import navigationCustomStyles from '@core/styles/vertical/navigationCustomStyles'

// Reference: crm-app-UI-Arun-Latest/components/layout/Sidebar.tsx — 260px expanded (icon + label),
// 68px collapsed (icon-only), toggled by the navbar hamburger. Mobile is a 260px overlay, hidden by default.
export const EXPANDED_WIDTH = 260
export const RAIL_WIDTH = 68

const StyledBoxForShadow = styled('div')(({ theme }) => ({
  top: 'var(--header-height)',
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
  // Visible so the circular collapse control can sit on the rail's right edge.
  overflowX: 'visible',
  overflowY: 'visible'
})

const Drawer = styled(MuiDrawer, { shouldForwardProp: prop => prop !== 'open' })(({ theme }) => ({
  width: RAIL_WIDTH,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  overflow: 'visible',
  '& .MuiDrawer-paper': {
    overflow: 'visible',
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
          overflow: 'visible',
          '& .MuiDrawer-paper': {
            ...widthMixin(theme, drawerWidth),
            overflow: 'visible'
          }
        }}
      >
        <NavHeader>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              minWidth: 0,
              flex: 1,
              height: '100%',
              overflow: 'hidden',
              pr: collapsed ? 0 : 2
            }}
          >
            <Link href='/' style={{ display: 'flex', alignItems: 'center', minWidth: 0, color: 'inherit', textDecoration: 'none' }}>
              <Logo compact={collapsed} />
            </Link>
          </Box>
          <NavToggle collapsed={collapsed} />
        </NavHeader>
        <StyledBoxForShadow ref={shadowRef} />

        <Box sx={{ flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <VerticalMenu scrollMenu={scrollMenu} collapsed={collapsed} />
        </Box>

        {/* Pinned bottom section: profile summary (Settings is pinned above it by VerticalMenu) */}
        <Box
          sx={{
            flexShrink: 0,
            borderBlockStart: '1px solid var(--nav-chrome-border)',
            // Matches the menu list's own inset (`menuClasses.root` in navigationCustomStyles),
            // so the profile card shares a left edge with the rows above it.
            paddingInline: collapsed ? '4px' : '8px',
            paddingBlockEnd: 1.5,
            paddingBlockStart: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5
          }}
        >
          <SidebarProfileSummary collapsed={collapsed} />
        </Box>
      </Drawer>
    </VerticalNav>
  )
}

export default Navigation
