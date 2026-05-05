'use client'
// Next Imports
import Link from 'next/link'
import { useResolvedPathname } from '@/hooks/useResolvedPathname'

// MUI Imports
import IconButton from '@mui/material/IconButton'

// Third-party Imports
import classnames from 'classnames'

// Component Imports
import NavToggle from './NavToggle'
import NavSearch from '@components/layout/shared/search'
import ModeDropdown from '@components/layout/shared/ModeDropdown'
import UserDropdown from '@components/layout/shared/UserDropdown'

// Util Imports
import { verticalLayoutClasses } from '@layouts/utils/layoutClasses'
import NextBreadcrumb from '@/components/Breadcrumb/NextBreadcrumb'
import React, { useEffect, useState } from 'react'
import { Box, Paper, Typography } from '@mui/material'
import Logo from '../shared/Logo'
import useVerticalNav from '@/@menu/hooks/useVerticalNav'
import { styled, useTheme } from '@mui/material/styles'
import { useClickContext } from '@/app/GlobalProvider'
import Image from 'next/image'
import { getCompanyDataParsed } from '@/utils/companyDataStorage'

const NavbarContent = () => {
  const pathname = useResolvedPathname()
  const [companyData, setCompanyData] = useState<any>([]);
  const { isToggled, toggleVerticalNav } = useVerticalNav()
  const theme = useTheme()
  const { setIsClicked } = useClickContext()

  /** Collapsed (narrow rail) when explicitly true; `undefined` treated as expanded so the toggle icon matches the drawer. */
  const isCollapsed = isToggled === true

  const handleExpandNav = () => {
    setIsClicked(true)
    toggleVerticalNav(false)
  }

  const handleCollapseNav = () => {
    setIsClicked(true)
    toggleVerticalNav(true)
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCompanyData(getCompanyDataParsed())
    }
  }, [])

  // Match Navigation useLayoutEffect: /settings defaults collapsed; Users chrome defaults expanded.
  useEffect(() => {
    if (pathname?.startsWith('/settings')) {
      toggleVerticalNav(true)
      setIsClicked(true)
      return
    }
    if (
      pathname?.startsWith('/user/users/detail') ||
      pathname?.startsWith('/user/users') ||
      pathname?.startsWith('/user/roles')
    ) {
      toggleVerticalNav(false)
      setIsClicked(true)
      return
    }
    /** Module Federation analytics lives under `pages/` — App Router `usePathname` is empty there without this hook. */
    if (pathname?.startsWith('/analytics')) {
      toggleVerticalNav(false)
      setIsClicked(true)
    }
  }, [pathname, toggleVerticalNav, setIsClicked])

  return (
    <Box className={classnames(verticalLayoutClasses.navbarContent, 'flex items-center justify-between gap-4 is-full')}>
      <div className='flex items-center gap-2 sm:gap-4 mt-3'>
        {/* <NavToggle /> */}
        {!isCollapsed ? (
          <IconButton onClick={handleCollapseNav} aria-label="Collapse navigation">
            {theme.direction === 'rtl' ? (
              <i className="ri-menu-line text-xl cursor-pointer" />
            ) : (
              <i className="ri-menu-line text-xl cursor-pointer" />
            )}
          </IconButton>
        ) : (
          <IconButton onClick={handleExpandNav} aria-label="Expand navigation">
            {theme.direction === 'rtl' ? (
              <i className="ri-menu-fold-line text-xl cursor-pointer" />
            ) : (
              <i className="ri-menu-fold-line text-xl cursor-pointer" />
            )}
          </IconButton>
        )}
        <Link href='/'>
            <Logo />
            {/* <Image
              src="/assets/images/small-logo.png"
              alt="Logo"
              width={198}
              height={25}
            /> */}
          </Link>
        {/* {(isToggled == false) && (
          <NextBreadcrumb
            homeElement={'Home'}
            activeClasses='text-stone-900'
            // container='flex py-5 bg-gradient-to-r from-amber-200 to-green-500' 
            container='flex py-3'
            listClasses='hover:underline font-bold'
            capitalizeLinks
          />
        )} */}
      </div>
      <div className='flex items-center'>
        {/* <Typography variant='h5'>We ♥ {companyData?.company_name}</Typography> */}
        {/* <Link
          className='flex mie-2'
          href={`https://github.com/themeselection/${process.env.NEXT_PUBLIC_REPO_NAME}`}
          target='_blank'
        >
          <img
            height={24}
            alt='GitHub Repo stars'
            src={`https://img.shields.io/github/stars/themeselection/${process.env.NEXT_PUBLIC_REPO_NAME}`}
          />
        </Link> */}
        {/* <LinguisticsAndForex /> */}
        
        <ModeDropdown />
        {/* <IconButton className='text-textPrimary'>
          <i className='ri-notification-2-line' />
        </IconButton> */}
        <UserDropdown />
      </div>
    </Box>
  )
}

export default NavbarContent
