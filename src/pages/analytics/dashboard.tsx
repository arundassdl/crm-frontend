'use client'

import dynamic from 'next/dynamic'
import { ErrorBoundary } from '@/components/analytics/ErrorBoundary'
import { AnalyticsRemoteViewport } from '@/components/analytics/AnalyticsRemoteViewport'
import {
  analyticsDashboardDynamicOptions,
  loadAnalyticsDashboardModuleSafe,
} from '@/lib/mf/loadAnalyticsDashboardModule'

/**
 * `/analytics/dashboard` — federated `analytics/Dashboard`, client-only (no SSR).
 */
const AnalyticsDashboard = dynamic(
  () => loadAnalyticsDashboardModuleSafe(),
  {
    ...analyticsDashboardDynamicOptions,
  }
)

export default function AnalyticsDashboardPage() {
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
          <AnalyticsDashboard />
        </ErrorBoundary>
      </div>
    </AnalyticsRemoteViewport>
  )
}
