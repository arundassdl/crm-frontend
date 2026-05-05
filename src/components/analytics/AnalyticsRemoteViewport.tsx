'use client'

import Box from '@mui/material/Box'
import type { ReactNode } from 'react'

/**
 * Host-only scrollport for the federated analytics surface. The CRM (VerticalLayout) owns
 * sidebar + navbar; the remote must not render a duplicate shell — it mounts only here.
 *
 * Fills the column below the sticky header without `100vh` on outer layout (avoids overlap
 * with the navbar / double scroll).
 */
export function AnalyticsRemoteViewport({ children }: { children: ReactNode }) {
  return (
    <Box
      className="analytics-mf-host-viewport"
      sx={{
        width: '100%',
        flex: '1 1 auto',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        /** Scroll remote content here; navbar stays in host above this box. */
        overflow: 'auto',
      }}
    >
      {children}
    </Box>
  )
}
