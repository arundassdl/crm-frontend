'use client'

import type { ComponentType } from 'react'
import AnalyticsUnavailable from '@/components/analytics/AnalyticsUnavailable'
import {
  getResolvedAnalyticsRemoteEntryUrl,
  loadRemoteAsDefaultComponent,
} from '@/lib/mf/mfHost'

function asDefault(
  C: ComponentType<Record<string, unknown>>
): { default: ComponentType<Record<string, unknown>> } {
  return { default: C }
}

async function probeRemoteEntry(): Promise<boolean> {
  const entryUrl = getResolvedAnalyticsRemoteEntryUrl()
  try {
    const res = await fetch(entryUrl, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-store',
    })
    if (res.status !== 0 && !res.ok) {
      console.error(
        '[Analytics MF] remoteEntry unavailable:',
        res.status,
        entryUrl
      )
      return false
    }
    return true
  } catch (e) {
    console.warn(
      '[Analytics MF] remoteEntry probe failed (CORS/network); trying load anyway:',
      e
    )
    return true
  }
}

/**
 * `loadRemote('analytics/Dashboard')` via `@module-federation/runtime` (no webpack host MF plugin).
 */
export async function loadAnalyticsDashboardModule(): Promise<{
  default: ComponentType<Record<string, unknown>>
}> {
  const ok = await probeRemoteEntry()
  if (!ok) return asDefault(AnalyticsUnavailable)

  return loadRemoteAsDefaultComponent('analytics/Dashboard')
    .then((C) => asDefault(C))
    .catch((err: unknown) => {
      console.error('[Analytics MF] Dashboard load failed:', err)
      return asDefault(AnalyticsUnavailable)
    })
}

/**
 * `loadRemote('analytics/CreateDashboard')` — same runtime path as the dashboard route.
 */
export async function loadAnalyticsCreateDashboardModule(): Promise<{
  default: ComponentType<Record<string, unknown>>
}> {
  const ok = await probeRemoteEntry()
  if (!ok) return asDefault(AnalyticsUnavailable)

  return loadRemoteAsDefaultComponent('analytics/CreateDashboard')
    .then((C) => asDefault(C))
    .catch((err: unknown) => {
      console.error('[Analytics MF] CreateDashboard load failed:', err)
      return asDefault(AnalyticsUnavailable)
    })
}

export function loadAnalyticsDashboardModuleSafe(): Promise<{
  default: ComponentType<Record<string, unknown>>
}> {
  return loadAnalyticsDashboardModule().catch((err) => {
    console.error('[Analytics MF] loadAnalyticsDashboardModuleSafe:', err)
    return asDefault(AnalyticsUnavailable)
  })
}

export function loadAnalyticsCreateDashboardModuleSafe(): Promise<{
  default: ComponentType<Record<string, unknown>>
}> {
  return loadAnalyticsCreateDashboardModule().catch((err) => {
    console.error('[Analytics MF] loadAnalyticsCreateDashboardModuleSafe:', err)
    return asDefault(AnalyticsUnavailable)
  })
}

export function AnalyticsDashboardLoading() {
  return <div style={{ padding: 20 }}>Loading analytics…</div>
}

export const analyticsDashboardDynamicOptions = {
  ssr: false as const,
  loading: () => <AnalyticsDashboardLoading />,
} as const
