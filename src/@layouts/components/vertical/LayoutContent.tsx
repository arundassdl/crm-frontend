'use client'

// Third-party Imports
import classnames from 'classnames'

// Type Imports
import type { ChildrenType } from '@core/types'

// Util Imports
import { verticalLayoutClasses } from '@layouts/utils/layoutClasses'

// Styled Component Imports
import StyledMain from '@layouts/styles/shared/StyledMain'
import NextBreadcrumb from '@/components/Breadcrumb/NextBreadcrumb'
import useVerticalNav from '@/@menu/hooks/useVerticalNav'
import { Box, Card } from '@mui/material'
import { usePathname } from 'next/navigation'

const LayoutContent = ({ children }: ChildrenType) => {
  const { isBreakpointReached,isToggled, toggleVerticalNav } = useVerticalNav()
  const pathname = usePathname()
  const notProtectedRoutes = ['/my-company', '/my-account','/rewards/detail','/rewards','/users/sales-partner/detail/'];
  const isNotProtectedRoute = notProtectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
console.log("isNotProtectedRoute",isNotProtectedRoute);

  return (
    <StyledMain
      isContentCompact={true}
      className={classnames(verticalLayoutClasses.content, verticalLayoutClasses.contentCompact, 'flex-auto is-full')}
    >
     {isNotProtectedRoute || pathname=="/" ? (
      <>
     
              <NextBreadcrumb
                homeElement={'Home'}
                activeClasses='text-stone-900'
                // container='flex py-5 bg-gradient-to-r from-amber-200 to-green-500' 
                container='flex py-5' 
                listClasses='hover:underline font-bold flex flex-row gap-4'
                capitalizeLinks                
              />     
     
    
      {children}
     
      </>
     ):(
      <Box
      sx={{        
        maxHeight: 780,
        bgcolor: (pathname.includes("detail") || pathname.includes("details"))?"none":"background.paper",
        maxInlineSize: '100%',
        borderRadius: 3,
        width:'100%',
        // padding:(pathname.includes("detail") || pathname.includes("details"))?'1rem':"0",
        overflow:"hidden",
        // marginTop:"20px"
        // maxHeight: 730, overflow: 'auto'
      }}
    >
      <NextBreadcrumb
                homeElement={'Home'}
                activeClasses='text-stone-900'
                // container='flex py-5 bg-gradient-to-r from-amber-200 to-green-500' 
                container='flex px-5 pt-5 pb-3' 
                listClasses='hover:underline font-bold flex flex-row gap-4'
                capitalizeLinks                
              />   
      <Card style={{ border: "none", boxShadow: "none" }} sx={{width:'100%', padding:'1.25rem 0', maxHeight: 740, overflow: 'auto',marginRight:3, backgroundColor: (pathname.includes("detail") || pathname.includes("details"))?'var(--mui-palette-background-default)':"none" }}>
      {/* <Card style={{ border: "none", boxShadow: "none" }} sx={{width:'100%', padding:'1.25rem 0', maxHeight: 740, overflow: 'auto',marginRight:3, backgroundColor: 'var(--mui-palette-background-default)'}}> */}
        {children}
      </Card>
      </Box>
     )}
     
    </StyledMain>
  )
}

export default LayoutContent
