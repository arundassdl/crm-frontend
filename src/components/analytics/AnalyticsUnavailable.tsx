'use client'

import Alert from '@mui/material/Alert'
import Typography from '@mui/material/Typography'

const MESSAGE = 'Analytics app not available'

/**
 * Shown when the analytics remote fails to load (network, CORS, or missing expose).
 */
export default function AnalyticsUnavailable() {
  return (
    <Alert severity="warning" sx={{ m: 2, maxWidth: 560 }}>
      <Typography variant="body2">{MESSAGE}</Typography>
    </Alert>
  )
}
