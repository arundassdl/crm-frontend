/**
 * Reports micro-app (Module Federation host wiring).
 *
 * Remote webpack `name` must match `REPORTS_MF_REMOTE_NAME`. Typical CRM runtime equivalent:
 * `reports@http://localhost:3002/reports/_next/static/chunks/remoteEntry.js`
 *
 * URLs come from `CONSTANTS.REPORTS_APP_URL` and env overrides (see `getResolvedReportsRemoteEntryUrl`
 * in `src/lib/mf/mfHost.ts`).
 *
 * CRM **`/reports`** loads **ReportListing**; **`/reports/details/[name]`** loads **`reports/ReportDetail`**;
 * **`/reports/edit/[code]`** loads **`reports/ReportEdit`**;
 * **`/reports/create`** loads **`reports/ReportBuilder`**. Props: `reportsEmbedConfig.ts`.
 */
export const REPORTS_REMOTE_DEFAULT_ENTRY_PATH =
  '/_next/static/chunks/remoteEntry.js' as const

export const REPORTS_MF_REMOTE_NAME = 'reports' as const

/**
 * Public URL of the reports MF app when the CRM is **not** opened on `localhost` (see `mfHost`
 * `coerceReportsRemoteBaseForBrowser`). Keep in sync with deploy; override with
 * `NEXT_PUBLIC_REPORTS_APP_URL`.
 */
export const REPORTS_APP_URL_PUBLIC_HOST_DEFAULT =
  'https://devtest.socialdnalabs.com/reports' as const

/** Standalone listing route on the reports dev server (reference only; MF loads by expose name). */
export const REPORTS_STANDALONE_LISTING_PATH = '/listing' as const

/** Federated expose for CRM `/reports/details/[name]` (`./ReportDetail` → `reports/ReportDetail`). */
export const REPORTS_MF_REPORT_DETAIL_MODULE = 'reports/ReportDetail' as const

/**
 * Fallback ids if remote uses `./ReportDetail` only or alternate casing.
 */
export const REPORTS_MF_DETAIL_EXPOSE_FALLBACKS = [
  'reports/./ReportDetail',
  'reports/reportDetail',
] as const

/** Federated expose for CRM **`/reports/edit/[code]`** (`./ReportEdit` → `reports/ReportEdit`). */
export const REPORTS_MF_REPORT_EDIT_MODULE = 'reports/ReportEdit' as const

/**
 * Extra module ids beyond {@link REPORTS_MF_REPORT_EDIT_MODULE}.
 *
 * **Do not** add **`reports/./ReportEdit`** — **`@module-federation/runtime`** turns that into
 * **`././ReportEdit`** (invalid). **Do not** add **`reports/reportEdit`** — resolves to **`./reportEdit`**,
 * not **`./ReportEdit`**. If the remote uses a non-default expose key, set
 * **`NEXT_PUBLIC_REPORTS_MF_EDIT_MODULE`** (e.g. `MyReportEditPage` → **`reports/MyReportEditPage`**).
 */
export const REPORTS_MF_EDIT_EXPOSE_FALLBACKS = [] as const

/** Federated expose for CRM **`/reports/create`** (`./ReportBuilder` → `reports/ReportBuilder`). */
export const REPORTS_MF_REPORT_BUILDER_MODULE =
  'reports/ReportBuilder' as const

export const REPORTS_MF_BUILDER_EXPOSE_FALLBACKS = [
  'reports/./ReportBuilder',
  'reports/builder',
  'reports/Builder',
] as const

/**
 * Federated module ids tried in order until one exists in the remote container.
 * Must match the reports-app webpack `exposes` keys (remote name `reports` + path after `./`).
 *
 * Reports-app exposes **`./ReportListing`** → host loads **`reports/ReportListing`**.
 *
 * Never use a URL path here (e.g. **`/listing`**); use **`reports/ReportListing`** (or env override).
 */
export const REPORTS_MF_DEFAULT_EXPOSE_ORDER = [
  'reports/ReportListing',
  'reports/./ReportListing',
  'reports/listing',
  'reports/Listing',
  'reports/pages/listing',
  'reports/./listing',
  'reports/./Listing',
] as const
