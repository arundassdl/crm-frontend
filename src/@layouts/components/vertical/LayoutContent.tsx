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
import { useMainColumnFullWidth } from '@/contexts/MainColumnFullWidthContext'
import { useResolvedPathname } from '@/hooks/useResolvedPathname'
import { useTheme } from '@mui/material/styles'

const LayoutContent = ({ children }: ChildrenType) => {
  const { isBreakpointReached, isToggled, toggleVerticalNav } = useVerticalNav()
  const pathname = useResolvedPathname()
  const mainColumnFullWidth = useMainColumnFullWidth()
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  /** Module Federation — `src/pages/analytics/*` (Pages Router) must use the “light” main branch, not the Card layout. */
  const isAnalyticsRoute =
    mainColumnFullWidth || pathname.startsWith('/analytics')
  /** Federated reports shell: `/reports`, `/report/[code]`. */
  const isReportsAddonRoute =
    pathname.startsWith('/reports') || pathname.startsWith('/report/')
  /** Home dashboard should use the full main column width. */
  const isDashboardHomeRoute = pathname === '/' || pathname === ''
  const isWideAddonMainChrome = isAnalyticsRoute || isReportsAddonRoute || isDashboardHomeRoute
  /** Settings + user detail under `/user/users/detail/*` use the same embedded chrome; drop Card vertical padding (was 1.25rem 0). */
  const isSettingsRoute =
    pathname.startsWith('/settings') || pathname.startsWith('/user/users/detail')
  const notProtectedRoutes = ['/my-company', '/my-account', '/rewards/detail', '/rewards', '/users/sales-partner/detail/'];
  const isNotProtectedRoute = notProtectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const hideBreadcrumb =
    pathname === '/' ||
    pathname === '' ||
    pathname.includes('/layouts/edit/') ||
    pathname.includes('/layouts/create') ||
    pathname === '/settings' ||
    pathname.startsWith('/settings/') ||
    pathname.startsWith('/user/users/detail') ||
    mainColumnFullWidth ||
    pathname.startsWith('/analytics') ||
    pathname.startsWith('/reports') ||
    pathname.startsWith('/report/')

  return (
    <StyledMain
      isContentCompact={isWideAddonMainChrome ? false : true}
      className={classnames(
        verticalLayoutClasses.content,
        verticalLayoutClasses.contentCompact,
        isWideAddonMainChrome && 'analytics-layout-content',
        'flex-auto is-full min-h-0',
        `${isDark ? "bg-[#121212] text-[#F4F4F5]" : "bg-[#EBF3FE] text-slate-800"}`
      )}
    >
      {isNotProtectedRoute || pathname == "/" || isWideAddonMainChrome ? (
        <Box sx={{ width: '100%', flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column', bgcolor: isDark ? "bg-[#121212] text-[#F4F4F5]" : "bg-[#EBF3FE] text-slate-800" }}>
          {!hideBreadcrumb && (
            <NextBreadcrumb
              homeElement={'Home'}
              activeClasses='text-stone-900'
              // container='flex py-5 bg-gradient-to-r from-amber-200 to-green-500' 
              container='flex py-5'
              listClasses='hover:underline font-bold flex flex-row gap-4'
              capitalizeLinks
            />
          )}
          {children}
        </Box>
      ) : (
        <Box
          // className={`${isDark ? "bg-[#121212] text-[#F4F4F5]" : "bg-[#EBF3FE] text-slate-800"}`}
          sx={{
            maxHeight: 'none',
            minHeight: 'calc(100vh - 120px)',
            bgcolor: isDark ? "bg-[#121212] text-[#F4F4F5]" : "bg-[#EBF3FE] text-slate-800",
            maxInlineSize: '100%',
            borderRadius: 3,
            width: '100%',
            overflow: 'visible',
          }}
        >
          {/* {!hideBreadcrumb && (
            <NextBreadcrumb
              homeElement={'Home'}
              activeClasses='text-stone-900'
              // container='flex py-5 bg-gradient-to-r from-amber-200 to-green-500' 
              container='flex px-5 pt-5 pb-3'
              listClasses='hover:underline font-bold flex flex-row gap-4'
              capitalizeLinks
            />
          )} */}
          <Card
            style={{ border: "none", boxShadow: "none" }}
            sx={{
              width: '100%',
              padding: isSettingsRoute ? 0 : '0',
              maxHeight: 'none',
              height: '100%',
              overflow: (pathname.includes("detail") || pathname.includes("details")) ? 'visible' : 'auto',
              marginRight: 3,
              // backgroundColor: isSettingsRoute
              //   ? 'var(--mui-palette-background-paper)'
              //   : (pathname.includes("detail") || pathname.includes("details"))
              //     ? 'var(--mui-palette-background-default)'
              //     : 'none'
              bgcolor: (pathname.includes("detail") || pathname.includes("details")) ? "none" : isDark ? "#121212" : "#EBF3FE",
            }}
          >
            {children}
          </Card>
        </Box>
      )}

    </StyledMain>
  )
}

export default LayoutContent
