'use client'

import dynamic from 'next/dynamic'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import { ErrorBoundary } from '@/components/analytics/ErrorBoundary'
import { AnalyticsRemoteViewport } from '@/components/analytics/AnalyticsRemoteViewport'
import {
  analyticsDashboardDynamicOptions,
  loadAnalyticsCreateDashboardModuleSafe,
} from '@/lib/mf/loadAnalyticsDashboardModule'

/**
 * `/analytics/dashboard/create` — federated `analytics/CreateDashboard`, client-only (no SSR).
 */
const CreateDashboard = dynamic(
  () => loadAnalyticsCreateDashboardModuleSafe(),
  {
    ...analyticsDashboardDynamicOptions,
    loading: () => (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minHeight={200}
        width="100%"
      >
        <CircularProgress size={32} />
      </Box>
    ),
  }
)

export default function AnalyticsCreateDashboardPage() {
  return (
    <AnalyticsRemoteViewport>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <ErrorBoundary>
          <CreateDashboard />
        </ErrorBoundary>
      </div>
    </AnalyticsRemoteViewport>
  )
}
