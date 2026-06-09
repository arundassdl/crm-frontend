'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Box, CircularProgress, Typography } from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'

import DashboardPageHeader from '@/components/Dashboard/DashboardPageHeader'
import { DashboardViewGrid } from '@/modules/dashboard-builder/components/DashboardViewGrid'
import {
  dashboardKeys,
  useDashboardListQuery,
  useDashboardQuery,
} from '@/modules/dashboard-builder/hooks/useDashboard'
import { DashboardQueryProvider } from '@/modules/dashboard-builder/layouts/DashboardQueryProvider'
import { readAccessTokenString } from '@/utils/accessTokenDataStorage'

function DashboardPageContent() {
  const queryClient = useQueryClient()
  const hasToken = Boolean(readAccessTokenString())
  const { data: listData, isLoading: listLoading, isError: listError } = useDashboardListQuery()
  const [selectedDashboardId, setSelectedDashboardId] = useState<string | null>(null)
  const initializedRef = useRef(false)

  const handleRefreshDashboard = useCallback(() => {
    if (!selectedDashboardId) return
    void queryClient.invalidateQueries({ queryKey: dashboardKeys.detail(selectedDashboardId) })
  }, [queryClient, selectedDashboardId])

  useEffect(() => {
    if (!listData || initializedRef.current) return

    const defaultId =
      listData.defaultDashboardId ??
      (listData.dashboards.length > 0 ? listData.dashboards[0].id : null)

    if (defaultId) {
      setSelectedDashboardId(defaultId)
    }
    initializedRef.current = true
  }, [listData])

  const {
    data: dashboard,
    isLoading: dashboardLoading,
    isFetching: dashboardFetching,
  } = useDashboardQuery(selectedDashboardId)

  if (!hasToken || listLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={32} />
      </Box>
    )
  }

  if (listError) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="body1" color="error">
          Failed to load dashboards. Please try again later.
        </Typography>
      </Box>
    )
  }

  const dashboards = listData?.dashboards ?? []

  if (dashboards.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          minHeight: 320,
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 2,
          border: '2px dashed',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          px: 3,
          py: 6,
          textAlign: 'center',
        }}
      >
        <Typography variant="h6" fontWeight={600} color="text.primary">
          No dashboards available
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 420 }}>
          You do not have access to any dashboards yet. Contact your administrator to get a home
          page assigned.
        </Typography>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
      }}
    >
      <DashboardPageHeader
        dashboards={dashboards}
        selectedDashboardId={selectedDashboardId}
        onDashboardChange={setSelectedDashboardId}
        onRefresh={handleRefreshDashboard}
      />

      {dashboardLoading || dashboardFetching ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={32} />
        </Box>
      ) : dashboard ? (
        <DashboardViewGrid widgets={dashboard.widgets} layout={dashboard.layouts.lg} />
      ) : (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Select a dashboard to view its widgets.
          </Typography>
        </Box>
      )}
    </Box>
  )
}

export default function DashboardPage() {
  return (
    <DashboardQueryProvider>
      <DashboardPageContent />
    </DashboardQueryProvider>
  )
}
