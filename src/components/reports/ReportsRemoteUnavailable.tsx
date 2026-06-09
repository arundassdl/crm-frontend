'use client'

import Alert from '@mui/material/Alert'
import Typography from '@mui/material/Typography'

type Props = {
  /** Dev-facing detail from the caught load error */
  details?: string
}

/** Fallback when the federated reports bundle fails to load. */
export default function ReportsRemoteUnavailable({ details }: Props) {
  return (
    <Alert severity="warning" sx={{ m: 2 }}>
      Reports could not be loaded. Check that the reports app is running,{' '}
      <code>remoteEntry.js</code> returns 200 (see Network tab), CORS allows this CRM origin, and the
      MF <code>exposes</code> keys match CRM env overrides (e.g.{' '}
      <code>NEXT_PUBLIC_REPORTS_MF_MODULE</code> for listing,{' '}
      <code>NEXT_PUBLIC_REPORTS_MF_DETAIL_MODULE</code>, <code>NEXT_PUBLIC_REPORTS_MF_EDIT_MODULE</code>,{' '}
      <code>NEXT_PUBLIC_REPORTS_MF_BUILDER_MODULE</code> when applicable) or defaults in{' '}
      <code>src/config/microfrontends/reports.ts</code>.
      {details ? (
        <Typography component="pre" variant="caption" sx={{ mt: 1, whiteSpace: 'pre-wrap', opacity: 0.9 }}>
          {details}
        </Typography>
      ) : null}
    </Alert>
  )
}
