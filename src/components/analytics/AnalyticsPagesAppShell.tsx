'use client'

import { createContext, useContext, type ReactNode } from 'react'
import Box from '@mui/material/Box'
import LayoutWrapper from '@layouts/LayoutWrapper'
import VerticalLayout from '@layouts/VerticalLayout'
import Navigation from '@components/layout/vertical/Navigation'
import Navbar from '@components/layout/vertical/Navbar'
import VerticalFooter from '@components/layout/vertical/Footer'
import { MainColumnFullWidthProvider } from '@/contexts/MainColumnFullWidthContext'
import { AnalyticsFederationRoot } from '@/lib/mf/AnalyticsFederationRoot'
import { AnalyticsRemoteContainer } from './AnalyticsRemoteContainer'

const BASE = '/analytics'

const AnalyticsPathContext = createContext({ basePath: BASE })

/** Build links with this prefix, e.g. `${basePath}/dashboard/create`. */
export function useAnalyticsBasePath(): string {
  return useContext(AnalyticsPathContext).basePath
}

type Props = { children: ReactNode }

/**
 * Full CRM vertical shell for `src/pages/analytics/*` (Pages Router + Module Federation).
 * Navbar + sidebar + footer match `(dashboard)/layout`; federated UI mounts inside the scroll region only.
 */
export default function AnalyticsPagesAppShell({ children }: Props) {
  return (
    <MainColumnFullWidthProvider>
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
    </MainColumnFullWidthProvider>
  )
}
