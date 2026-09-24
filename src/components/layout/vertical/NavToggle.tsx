'use client'

import IconButton from '@mui/material/IconButton'
import { CaretLeft } from '@phosphor-icons/react'

import useVerticalNav from '@menu/hooks/useVerticalNav'

const TOGGLE_SIZE = 28

type NavToggleProps = {
  collapsed: boolean
}

const NavToggle = ({ collapsed }: NavToggleProps) => {
  const { toggleVerticalNav, isBreakpointReached, isToggled } = useVerticalNav()

  // Off-canvas mobile nav: this control lives on the sidebar edge, so it is
  // unreachable until the overlay is open. The navbar still owns the opener.
  if (isBreakpointReached && isToggled !== true) {
    return null
  }

  return (
    <IconButton
      onClick={() => toggleVerticalNav()}
      aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
      disableRipple
      size='small'
      sx={{
        position: 'absolute',
        top: '50%',
        insetInlineEnd: -14,
        transform: 'translateY(-50%)',
        zIndex: 2,
        width: TOGGLE_SIZE,
        height: TOGGLE_SIZE,
        minWidth: TOGGLE_SIZE,
        padding: 0,
        color: 'var(--nav-chrome-text-muted)',
        backgroundColor: 'var(--mui-palette-background-paper)',
        border: '1px solid rgba(15, 23, 42, 0.12)',
        boxShadow: '0 1px 4px rgba(15, 23, 42, 0.08)',
        '&:hover': {
          backgroundColor: 'var(--mui-palette-background-paper)',
          color: 'var(--nav-chrome-text-primary)',
          boxShadow: '0 2px 6px rgba(15, 23, 42, 0.12)'
        },
        '& svg': {
          transform: collapsed ? 'rotate(180deg)' : 'none',
          transition: 'transform 200ms ease'
        }
      }}
    >
      <CaretLeft size={14} weight='bold' />
    </IconButton>
  )
}

export default NavToggle
