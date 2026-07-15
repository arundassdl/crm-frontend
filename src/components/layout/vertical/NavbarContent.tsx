'use client'
// Next Imports
import Link from 'next/link'

// MUI Imports
import { Box, IconButton, InputBase, Button, Tooltip, Badge } from '@mui/material'

// Third-party Imports
import classnames from 'classnames'
import { ListIcon, MagnifyingGlass, Bell, Plus, Command } from '@phosphor-icons/react'

// Component Imports
import ModeDropdown from '@components/layout/shared/ModeDropdown'
import UserDropdown from '@components/layout/shared/UserDropdown'

// Util Imports
import { verticalLayoutClasses } from '@layouts/utils/layoutClasses'
import React, { useEffect, useState } from 'react'
import Logo from '../shared/Logo'
import useVerticalNav from '@/@menu/hooks/useVerticalNav'
import { useSettings } from '@core/hooks/useSettings'

const NavbarContent = () => {
  const { isToggled, toggleVerticalNav } = useVerticalNav()
  const { settings } = useSettings()
  const isDark = settings.mode === 'dark'
  const [search, setSearch] = useState('')

  const handleToggleNav = () => {
    toggleVerticalNav(!isToggled)
  }

  return (
    <Box
      className={classnames(verticalLayoutClasses.navbarContent, 'flex items-center justify-between gap-4 is-full')}
      sx={{
        color: isDark ? '#FFFFFF' : '#0c2472',
        padding: '0 8px',
      }}
    >
      <div className='flex items-center gap-2 sm:gap-4'>
        <IconButton
          onClick={handleToggleNav}
          aria-label='Toggle navigation'
          sx={{
            color: 'inherit',
            borderRadius: '9px',
            '&:hover': { bgcolor: isDark ? '#262626' : '#EFF6FF' }
          }}
        >
          <ListIcon size={18} weight='bold' />
        </IconButton>
        <Link href='/'>
          <Logo />
        </Link>
      </div>

      <div className='flex items-center gap-4 sm:gap-6'>
        {/* Search */}
        {/* <div className={classnames(
          'hidden md:flex items-center gap-2 border rounded-xl px-3 py-1.5 w-60 transition-all',
          isDark
            ? 'bg-[#0A0A0A] border-[#27272A] focus-within:border-[#60A5FA] focus-within:shadow-[0_0_0_2px_rgba(96,165,250,0.3)]'
            : 'bg-[#f9fbff] border-[#E3ECFC] focus-within:border-[#1D4ED8] focus-within:shadow-[0_0_0_2px_#93C5FD]'
        )}>
          <MagnifyingGlass size={15} color={isDark ? '#71717A' : '#94A3B8'} weight='duotone' />
          <InputBase
            placeholder='Search leads, deals...'
            value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{
              flex: 1, fontSize: '0.78rem', color: isDark ? '#D4D4D8' : '#334155',
              '& input::placeholder': { color: isDark ? '#71717A' : '#94A3B8', opacity: 1 },
            }}
          />
          <Tooltip title='⌘K'>
            <Command size={13} color={isDark ? '#52525B' : '#CBD5E1'} weight='duotone' />
          </Tooltip>
        </div> */}

        {/* New Deal Button */}
        {/* <Button
          variant='contained'
          size='small'
          startIcon={<Plus size={16} weight='duotone' />}
          sx={{
            bgcolor: isDark ? '#27272A' : '#1D4ED8',
            color: isDark ? '#F4F4F5' : '#fff',
            borderRadius: '9px',
            textTransform: 'none',
            fontWeight: 700,
            fontSize: '0.78rem',
            px: 2,
            py: 0.9,
            boxShadow: isDark ? 'none' : '0 1px 8px 0 #1D4ED833',
            whiteSpace: 'nowrap',
            '&:hover': {
              bgcolor: isDark ? '#3F3F46' : '#60A5FA',
              boxShadow: isDark ? 'none' : '0 2px 14px 0 #60A5FA55'
            },
            '&:active': { bgcolor: isDark ? '#52525B' : '#0C2472' },
          }}
        >
          New Deal
        </Button> */}

        {/* Mode Dropdown */}
        <ModeDropdown />

        {/* Notifications */}
        {/* <Tooltip title='3 unread notifications'>
          <IconButton
            size='small'
            sx={{
              borderRadius: '8px',
              color: 'inherit',
              '&:hover': { bgcolor: isDark ? '#262626' : '#EFF6FF' }
            }}
          >
            <Badge
              badgeContent={3}
              color='error'
              sx={{ '& .MuiBadge-badge': { fontSize: '0.58rem', height: 15, minWidth: 15, padding: '0 3px' } }}
            >
              <Bell size={20} color={isDark ? '#9CA3AF' : '#64748B'} weight='duotone' />
            </Badge>
          </IconButton>
        </Tooltip> */}

        {/* User Dropdown */}
        <UserDropdown />
      </div>
    </Box>
  )
}

export default NavbarContent
