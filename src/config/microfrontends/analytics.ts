/**
 * Default remote entry **path** (after origin). With dev on :3001 as
 * `http://localhost:3001` the full URL is
 * `http://localhost:3001/_next/static/chunks/remoteEntry.js` (overridable via `NEXT_PUBLIC_ANALYTICS_MF_ENTRY`).
 *
 * **Host-only layout:** The CRM **VerticalLayout** provides navbar + sidebar. The analytics remote
 * should expose **routed page content only** (no second `AppBar` / shell). Use `AnalyticsRemoteViewport`
 * on host pages for the scrollport.
 *
 * **CSS:** Do not inject the remote’s global CSS in the host; the main app controls theme. Remote
 * chunk CSS still loads with federated JS when needed.
 *
 * **Module Federation `shared`:** Align `react` / `react-dom` as singletons on the remote; the host
 * webpack config shares them via `ModuleFederationPlugin`. For `next/router`, use the host shim
 * (see `next.config.js`) if the remote imports it.
 */
export const ANALYTICS_REMOTE_DEFAULT_ENTRY_PATH =
  '/_next/static/chunks/remoteEntry.js' as const

/**
 * `init({ remotes: [{ name, entry }] } )` name — must match the **remote** MF `name: 'analytics'`.
 */
export const ANALYTICS_MF_REMOTE_NAME = 'analytics' as const

/**
 * Analytics remote (Module Federation) — exposed module ids and fallbacks.
 */
export const ANALYTICS_MF_ROUTE_MODULES = {
  dashboard: 'analytics/Dashboard',
  create: 'analytics/CreateDashboard',
} as const

/**
 * Tried in order if the primary create expose is missing in the container.
 */
export const ANALYTICS_MF_CREATE_FALLBACK_IDS = [
  'analytics/Create',
  'analytics/CreatePage',
  'analytics/create',
  'analytics/dashboard/create',
  'analytics/pages/Create',
] as const

/** Used by `AnalyticsMfContainer` when trying several exposes */
export const ANALYTICS_MF_LEGACY_PRIMARY = 'analytics/Dashboard'

export const ANALYTICS_MF_ALTERNATE_IDS = [
  'analytics/index',
  'analytics/App',
  'analytics/page',
  'analytics/Analytics',
] as const
