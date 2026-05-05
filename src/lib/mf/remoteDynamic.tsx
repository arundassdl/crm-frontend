'use client'

import type { ReactNode } from 'react'
import dynamic from 'next/dynamic'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import AnalyticsUnavailable from '@/components/analytics/AnalyticsUnavailable'
import {
  loadRemoteAsDefaultComponent,
  loadRemoteAsDefaultFromCandidates,
  uniqueModuleIds,
} from './mfHost'

export type FederatedClientComponentOptions = {
  /** Shown while the remote module first loads (client-only) */
  loading?: ReactNode
  /**
   * Extra MF ids to try if the first fails with “does not exist in container”
   * (e.g. `['analytics/create', 'analytics/Create']` when the remote used `./create` not `./CreatePage`).
   */
  fallbackModuleIds?: string[]
}

/**
 * Returns a `next/dynamic` component (with `ssr: false`) that loads a Module Federation
 * remote by id via `@module-federation/runtime` (legacy / multi-candidate loaders).
 *
 * Use only in Client Components.
 */
export function createFederatedClientComponent(
  moduleId: string,
  options?: FederatedClientComponentOptions
) {
  const candidates = options?.fallbackModuleIds?.length
    ? uniqueModuleIds(moduleId, options.fallbackModuleIds)
    : [moduleId]

  const moduleIdsLabel = candidates.join(' | ')

  const load =
    candidates.length > 1
      ? () =>
          loadRemoteAsDefaultFromCandidates(candidates)
            .then((Comp) => ({ default: Comp }))
            .catch((e: unknown) => {
              const err = e instanceof Error ? e : new Error(String(e))
              if (process.env.NODE_ENV === 'development') {
                console.error('[Module Federation]', moduleIdsLabel, err)
              }
              return { default: AnalyticsUnavailable }
            })
      : () =>
          loadRemoteAsDefaultComponent(moduleId)
            .then((Comp) => ({ default: Comp }))
            .catch((e: unknown) => {
              const err = e instanceof Error ? e : new Error(String(e))
              if (process.env.NODE_ENV === 'development') {
                console.error('[Module Federation]', moduleId, err)
              }
              return { default: AnalyticsUnavailable }
            })

  return dynamic(load, {
    ssr: false,
    loading: () => {
      if (options?.loading != null) {
        return <Box width="100%">{options.loading}</Box>
      }
      return (
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          minHeight={200}
          width="100%"
        >
          <CircularProgress size={32} />
        </Box>
      )
    },
  })
}
