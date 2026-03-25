'use client'
// Next Imports
import Link from 'next/link'

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

const NavbarContent = () => {
  const [companyData, setCompanyData] = useState<any>([]);
  const { isBreakpointReached, isToggled, toggleVerticalNav } = useVerticalNav()
  const [open, setOpen] = React.useState(true);
  const theme = useTheme()
  const { setIsClicked } = useClickContext();


  const handleDrawerOpen = () => {  
    setIsClicked(true);
    setOpen(true);
    toggleVerticalNav(false)    
  };

  const handleDrawerClose = (e) => {
    setIsClicked(true);
    if(open==true){
      setOpen(false);
      setIsClicked(false);
      toggleVerticalNav(true)
    }else{
      setOpen(true);
      setIsClicked(true);
      toggleVerticalNav(true)
    }
    
  };

  const handleMouseEnter = () => {
    console.log("open=>",open);
    console.log("open=>isToggled",isToggled);
    
    if(open==false){
      setOpen(true); // Expand drawer when hovered
    }
  };

  const handleMouseLeave = () => {
    if(open==true){
      if(isToggled){
        setOpen(false); // Collapse drawer when mouse leaves
      }else{
        setOpen(true);
      }
    }
  };
  

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('companyData') != 'undefined') {
        // alert(localStorage.getItem('userData'))
        setCompanyData(JSON.parse(localStorage.getItem('companyData') || '[]'))
      }
    }
    console.log("companyData", companyData);

  
      if (isToggled) {
        setOpen(false); // Collapse drawer when mouse leaves
      } else {
        setOpen(true);
      }
   

  }, []);

  return (
    <Box className={classnames(verticalLayoutClasses.navbarContent, 'flex items-center justify-between gap-4 is-full')}>
      <div className='flex items-center gap-2 sm:gap-4 mt-3'>
        {/* <NavToggle /> */}
        {(open==true && isToggled==false) ? (
          <IconButton onClick={handleDrawerClose}>
            {theme.direction === 'rtl' ? <i className='ri-menu-line text-xl cursor-pointer' onClick={handleDrawerClose} /> : <i className='ri-menu-line text-xl cursor-pointer' onClick={handleDrawerClose} />}
          </IconButton>
          ):(
            <IconButton onClick={handleDrawerOpen}>
            {theme.direction === 'rtl' ? <i className='ri-menu-fold-line text-xl cursor-pointer' onClick={handleDrawerOpen} /> : <i className='ri-menu-line text-xl cursor-pointer' onClick={handleDrawerOpen} />}
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
