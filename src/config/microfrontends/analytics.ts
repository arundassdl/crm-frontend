/**
 * Default remote entry **path** (after `ANALYTICS_APP_URL` base, which may include a path prefix).
 * Example base `https://host/analytics` → `https://host/analytics/_next/static/chunks/remoteEntry.js`.
 * Override the full entry with `NEXT_PUBLIC_ANALYTICS_MF_ENTRY` if needed.
 * The analytics dev server may run on another port (e.g. 3012); if the remote was built with a
 * different `assetPrefix`, the host rewrites stale chunk `script`/`link` URLs in development (see
 * `mfHost.ts`) or set `NEXT_PUBLIC_ANALYTICS_MF_STALE_CHUNK_ORIGIN`.
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
 * Public analytics MF base when the CRM tab is not on `localhost` (`mfHost` coercion + chunk rewrite).
 * Override with `NEXT_PUBLIC_ANALYTICS_APP_URL`.
 */
export const ANALYTICS_APP_URL_PUBLIC_HOST_DEFAULT =
  'https://devtest.socialdnalabs.com/analytics' as const

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
