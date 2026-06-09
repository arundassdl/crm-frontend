'use client'

import type { ReactNode } from 'react'
import Box from '@mui/material/Box'
import { ErrorBoundary } from '@/components/analytics/ErrorBoundary'
import ReportsRemoteUnavailable from '@/components/reports/ReportsRemoteUnavailable'

const mfHostSx = {
  width: '100%',
  flex: '1 1 auto',
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
} as const

type Props = {
  /** Stable mount key for ErrorBoundary + federated subtree remounts */
  mountKey: string
  /** DOM id for the MF surface (`reports-root` listing / `reports-detail-root` detail). */
  rootId: string
  children: ReactNode
}

/**
 * Shared MF chrome for **`reports/ReportListing`**, **`reports/ReportDetail`**, and **`reports/ReportEdit`** — Box shell + error fallback (no iframe).
 */
export function ReportsMfHostChrome({ mountKey, rootId, children }: Props) {
  return (
    <Box id={rootId} sx={mfHostSx}>
      <ErrorBoundary key={mountKey} fallback={<ReportsRemoteUnavailable />}>
        {children}
      </ErrorBoundary>
    </Box>
  )
}
