'use client'

import { createContext, useContext, useEffect, type ReactNode } from 'react'
import Box from '@mui/material/Box'
import { useRouter } from 'next/router'
import LayoutWrapper from '@layouts/LayoutWrapper'
import VerticalLayout from '@layouts/VerticalLayout'
import Navigation from '@components/layout/vertical/Navigation'
import Navbar from '@components/layout/vertical/Navbar'
import VerticalFooter from '@components/layout/vertical/Footer'
import { MainColumnFullWidthProvider } from '@/contexts/MainColumnFullWidthContext'
import { AnalyticsFederationRoot } from '@/lib/mf/AnalyticsFederationRoot'
import { normalizeDoubledAnalyticsPrefix } from '@/lib/mf/analyticsHostPathRewrite'
import { AnalyticsRemoteContainer } from './AnalyticsRemoteContainer'

const BASE = '/analytics'

const AnalyticsPathContext = createContext({ basePath: BASE })

/** Build links with this prefix, e.g. `${basePath}/dashboard/create`. */
export function useAnalyticsBasePath(): string {
  return useContext(AnalyticsPathContext).basePath
}

function AnalyticsDoubledPathNormalizer() {
  const router = useRouter()
  useEffect(() => {
    const fixed = normalizeDoubledAnalyticsPrefix(router.pathname)
    if (fixed === router.pathname) return
    const qs = router.asPath.includes('?')
      ? router.asPath.slice(router.asPath.indexOf('?'))
      : ''
    const hash = typeof window !== 'undefined' ? window.location.hash : ''
    void router.replace(fixed + qs + hash)
  }, [router, router.pathname, router.asPath])
  return null
}

type Props = { children: ReactNode }

/**
 * Full CRM vertical shell for `src/pages/analytics/*` (Pages Router + Module Federation).
 * Navbar + sidebar + footer match `(dashboard)/layout`; federated UI mounts inside the scroll region only.
 */
export default function AnalyticsPagesAppShell({ children }: Props) {
  return (
    <LayoutWrapper
      verticalLayout={
        <VerticalLayout
          navigation={<Navigation />}
          navbar={<Navbar />}
          footer={<VerticalFooter />}
        >
          <AnalyticsPathContext.Provider value={{ basePath: BASE }}>
            <Box
              component="div"
              sx={{
                width: '100%',
                minHeight: 0,
                flex: '1 1 auto',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <AnalyticsFederationRoot wrapperMode="contents">
                <AnalyticsRemoteContainer>{children}</AnalyticsRemoteContainer>
              </AnalyticsFederationRoot>
            </Box>
          </AnalyticsPathContext.Provider>
        </VerticalLayout>
      }
    />
  )
}
