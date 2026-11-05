'use client'

import { useMemo } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Box } from '@mui/material'

import HomePageBuilderHost from '@/app/settings/HomePageBuilderHost'

/** Standalone dashboard builder — same shell as settings `view=dashboard-create` / `dashboard-edit`. */
export default function DashboardBuilderRoutePage() {
  const params = useParams<{ id: string }>()!
  const searchParams = useSearchParams()
  const cloneFrom = searchParams?.get('clone_from')
  const isNew = params.id === 'new'

  const dashboardId = useMemo(() => {
    if (isNew) return 'new'
    try {
      return decodeURIComponent(params.id)
    } catch {
      return params.id
    }
  }, [isNew, params.id])

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 64px)',
        minHeight: 0,
        overflow: 'hidden',
        bgcolor: 'background.paper',
      }}
    >
      <HomePageBuilderHost
        dashboardId={dashboardId}
        cloneFrom={cloneFrom}
        embedInSettings={false}
      />
    </Box>
  )
}
