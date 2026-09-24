'use client'

// Component Imports
import LayoutNavbar from '@layouts/components/vertical/Navbar'
import NavbarContent from './NavbarContent'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'

import { EXPANDED_WIDTH, RAIL_WIDTH } from './Navigation'

const Navbar = () => {
  const { isToggled, isBreakpointReached } = useVerticalNav()
  const collapsed = !isBreakpointReached && isToggled === true
  const hidden = isBreakpointReached && isToggled !== true
  const sidebarWidth = hidden ? 0 : collapsed ? RAIL_WIDTH : EXPANDED_WIDTH

  return (
    <LayoutNavbar
      overrideStyles={{
        left: sidebarWidth,
        width: 'auto',
        inlineSize: 'auto',
        transition: 'left 300ms cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      <NavbarContent />
    </LayoutNavbar>
  )
}

export default Navbar
