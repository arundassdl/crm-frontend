'use client'

/**
 * CRM-owned URLs under `src/pages/analytics/**`. Remotes are webpack / runtime MF exposes.
 */
import dynamic from 'next/dynamic'
import {
  ANALYTICS_MF_CREATE_FALLBACK_IDS,
  ANALYTICS_MF_ROUTE_MODULES,
} from '@/config/microfrontends/analytics'
import {
  analyticsDashboardDynamicOptions,
  loadAnalyticsDashboardModuleSafe,
} from '@/lib/mf/loadAnalyticsDashboardModule'
import { createFederatedClientComponent } from '@/lib/mf/remoteDynamic'

const createModuleId =
  process.env.NEXT_PUBLIC_ANALYTICS_MF_CREATE_MODULE ??
  ANALYTICS_MF_ROUTE_MODULES.create

export const RemoteAnalyticsDashboard = dynamic(
  () => loadAnalyticsDashboardModuleSafe(),
  { ...analyticsDashboardDynamicOptions }
)

/** Runtime `loadRemote` + legacy expose names; primary id is `analytics/CreateDashboard`. */
export const RemoteAnalyticsCreate = createFederatedClientComponent(
  createModuleId,
  { fallbackModuleIds: [...ANALYTICS_MF_CREATE_FALLBACK_IDS] }
)
