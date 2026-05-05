'use client'

import { useEffect, useMemo, useState, type ComponentType } from 'react'
import '@/styles/analytics-mf.css'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import {
  buildModuleIdCandidates,
  loadFirstMatchingRemote,
  resolveComponent,
} from '@/lib/mf/mfHost'
import { CONSTANTS } from '@/services/config/app-config'
import AnalyticsUnavailable from '@/components/analytics/AnalyticsUnavailable'

/**
 * Legacy single-surface analytics loader (tries multiple exposed modules).
 * Prefer `src/pages/analytics/...` route entries with `createFederatedClientComponent` / `analyticsHostRemotes`.
 */
export default function AnalyticsMfContainer() {
  const [Remote, setRemote] = useState<ComponentType<
    Record<string, unknown>
  > | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const remoteName =
    process.env.NEXT_PUBLIC_ANALYTICS_MF_REMOTE_NAME ??
    CONSTANTS.ANALYTICS_MF_REMOTE_NAME
  const primary =
    process.env.NEXT_PUBLIC_ANALYTICS_MF_MODULE ?? CONSTANTS.ANALYTICS_MF_MODULE
  const moduleIds = useMemo(
    () =>
      buildModuleIdCandidates(
        remoteName,
        primary,
        CONSTANTS.ANALYTICS_MF_ALTERNATE_IDS
      ),
    [remoteName, primary]
  )

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      setLoading(true)
      setError(null)
      setRemote(null)
      try {
        const { loaded } = await loadFirstMatchingRemote(moduleIds)
        if (cancelled) return
        setRemote(() => resolveComponent(loaded))
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [moduleIds])

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 240,
        }}
      >
        <CircularProgress size={32} />
      </Box>
    )
  }

  if (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[AnalyticsMfContainer]', error, moduleIds.join(', '))
    }
    return (
      <Box sx={{ p: 2 }}>
        <AnalyticsUnavailable />
      </Box>
    )
  }

  if (!Remote) {
    return null
  }

  return (
    <Box
      sx={{
        width: '100%',
        flex: '1 1 auto',
        minHeight: 0,
        overflow: 'auto',
      }}
    >
      <div
        className="analytics-mf-legacy-root"
        data-mf-host="crm"
        data-mf-remote="analytics"
      >
        <Remote />
      </div>
    </Box>
  )
}
