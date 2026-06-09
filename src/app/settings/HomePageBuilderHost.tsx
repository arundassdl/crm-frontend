'use client'

import dynamic from 'next/dynamic'
import { useMemo } from 'react'

import { DashboardQueryProvider } from '@/modules/dashboard-builder/layouts/DashboardQueryProvider'

const DashboardBuilderPage = dynamic(
  () => import('@/modules/dashboard-builder/components/DashboardBuilderPage'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-0 flex-1 items-center justify-center text-sm text-[var(--mui-palette-text-secondary)]">
        Loading builder…
      </div>
    ),
  }
)

type HomePageBuilderHostProps = {
  /** Existing Insights Dashboard name, or `"new"` for create. */
  dashboardId: string
  cloneFrom?: string | null
  embedInSettings?: boolean
}

export default function HomePageBuilderHost({
  dashboardId,
  cloneFrom,
  embedInSettings = true,
}: HomePageBuilderHostProps) {
  const isNew = dashboardId === 'new'
  const resolvedId = useMemo(
    () => (isNew ? `dash_${Date.now()}` : dashboardId),
    [dashboardId, isNew]
  )

  return (
    <DashboardQueryProvider>
      <DashboardBuilderPage
        dashboardId={resolvedId}
        embedInSettings={embedInSettings}
        cloneFrom={cloneFrom}
        isNew={isNew}
      />
    </DashboardQueryProvider>
  )
}
