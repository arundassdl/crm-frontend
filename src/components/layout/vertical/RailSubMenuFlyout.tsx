'use client'

import { useRef, useState } from 'react'
import type { ReactNode } from 'react'

// Next Imports
import { usePathname } from 'next/navigation'

// MUI Imports
import Box from '@mui/material/Box'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Tooltip from '@mui/material/Tooltip'

// Component Imports
import { RouterLink } from '@menu/components/RouterLink'

export type RailSubMenuFlyoutChild = {
  label: ReactNode
  path?: string
}

type RailSubMenuFlyoutProps = {
  label: ReactNode
  icon: ReactNode
  collapsed: boolean
  children: RailSubMenuFlyoutChild[]
}

/**
 * `SubMenu` from `@menu` only supports an inline accordion expansion, which doesn't fit the
 * collapsed 68px icon-only rail. This renders the same trigger visual as a leaf `MenuItem`
 * (icon-only + tooltip when collapsed, icon + label row when expanded) but opens its children
 * as a flyout `Menu` instead of expanding in place.
 */
const RailSubMenuFlyout = ({ label, icon, collapsed, children }: RailSubMenuFlyoutProps) => {
  const pathname = usePathname()
  const anchorRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  const isActive = children.some(child => child.path != null && pathname === child.path)

  const trigger = (
    <Box
      ref={anchorRef}
      role='button'
      tabIndex={0}
      onClick={() => setOpen(true)}
      onKeyUp={e => e.key === 'Enter' && setOpen(true)}
      aria-haspopup='true'
      aria-expanded={open}
      sx={{
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        // These mirror `menuItemStyles.button` and are written in explicit pixels on purpose:
        // this app's theme redefines the spacing unit as 4px (`@core/theme/spacing.ts`), so an
        // sx factor of 1.5 resolves to 6px, not the 12px a leaf MenuItem uses — which is what
        // pulled this row's icon and label left of every other item.
        gap: collapsed ? 0 : '12px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        inlineSize: collapsed ? 40 : '100%',
        blockSize: collapsed ? 40 : 'auto',
        minBlockSize: 40,
        marginInline: collapsed ? 'auto' : 0,
        paddingInline: collapsed ? 0 : '12px',
        paddingBlock: collapsed ? 0 : '10px',
        borderRadius: '8px',
        fontSize: 16,
        fontWeight: 500,
        color: isActive ? 'var(--nav-chrome-active-text)' : 'var(--nav-chrome-text-muted)',
        backgroundColor: isActive ? 'var(--nav-chrome-active-bg)' : 'transparent',
        '&:hover': {
          backgroundColor: 'var(--nav-chrome-active-bg)',
          color: 'var(--nav-chrome-active-text)'
        },
        '& svg': { flexShrink: 0 }
      }}
    >
      {/* Match the leaf MenuItem icon column: StyledMenuIcon reserves an extra
          10px (margin-inline-end) beyond the row gap, so labels line up. */}
      <Box
        component='span'
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginInlineEnd: collapsed ? 0 : '10px'
        }}
      >
        {icon}
      </Box>
      {!collapsed && (
        <Box component='span' sx={{ flexGrow: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
          {label}
        </Box>
      )}
      {/* Same active dot a leaf MenuItem renders via its `suffix`, so an active submenu row
          and an active leaf row look identical rather than differing by a missing marker. */}
      {!collapsed && isActive && (
        <Box
          component='span'
          sx={{
            flexShrink: 0,
            inlineSize: 6,
            blockSize: 6,
            borderRadius: '50%',
            backgroundColor: 'var(--nav-chrome-active-text)'
          }}
        />
      )}
    </Box>
  )

  return (
    <li style={{ listStyle: 'none', marginBlockStart: 4 }}>
      {collapsed ? (
        <Tooltip title={label} placement='right'>
          {trigger}
        </Tooltip>
      ) : (
        trigger
      )}
      <Menu
        anchorEl={anchorRef.current}
        open={open}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        {children.map((child, idx) => (
          <MenuItem
            key={`${child.path ?? child.label}-${idx}`}
            component={RouterLink}
            href={child.path ?? '#'}
            selected={child.path != null && pathname === child.path}
            onClick={() => setOpen(false)}
          >
            {child.label}
          </MenuItem>
        ))}
      </Menu>
    </li>
  )
}

export default RailSubMenuFlyout
