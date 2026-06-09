import { CONSTANTS } from '@/services/config/app-config'
import {
  readAccessTokenString,
  readRoleProfileFromStorage,
} from '@/utils/accessTokenDataStorage'

/**
 * Dropdown options for the federated **Create Report** dialog (`PrimaryModuleOption` on the reports-app side).
 */
export type ReportsCreateReportPrimaryModuleOption = {
  value: string
  label: string
}

/**
 * API/settings mirrored from CRM `CONSTANTS`, passed as React props into the federated reports remote
 * (`/reports`, `/reports/details/[name]`, **`/reports/edit/[id]`**, and **`/report/[code]`** via Module Federation).
 *
 * **`/reports/details/[name]`** passes **`name`**, **`userToken`**, **`token`**, **`userRole`**, **`crmReportPath`**, **`crmReportsListingHref`**, **`crmReportsDetailHrefPrefix`** (see **`reportRoutes.ts`**), plus {@link getReportsEmbedApiConfig()}.
 *
 * **`/reports/edit/[id]`** passes **`reportId`**, **`name`** (same as id when remote expects it), the same auth/API props, **`crmReportPath`** (canonical edit URL),
 * **`crmReportsListingHref`**, **`crmReportsDetailHrefPrefix`**, **`crmReportsEditHrefPrefix`** (**`/reports/edit`**).
 *
 * **`/report/[code]`** receives **`reportCode`**, **`queryName`**, **`reportId`**, **`slug`**, and **`crmReportPath`**.
 * Listing **`/reports`** (and embedded listing mode on **`/report/[code]`**) receives **`crmReportPath`**, plus
 * **`crmReportsListingHref`** and **`crmReportsDetailHrefPrefix`** from `reportRoutes.ts` so detail links use
 * **`/reports/details/:reportName`**, not **`/details/:name`**.
 *
 * Listing **`/reports`** may pass **`createReportPrimaryModuleOptions`** and **`onCreateReportContinue`** into **`reports/ReportListing`**
 * (see **`ReportsRemoteHost`**) so CRM controls module choices and post-**Continue** navigation.
 *
 * **`/reports/create`** loads **`reports/ReportBuilder`** with **`primaryModule`** / **`module`** from **`?module=`** (see **`ReportsCreateHost`**).
 * **`/reports/edit/[code]`** loads **`reports/ReportEdit`** with **`reportId`** from the path (see **`ReportsEditHost`**).
 */
export type ReportsEmbedApiConfig = {
  API_BASE_URL: string
  API_MANDATE_PARAMS: string
  VERSION: string
  APPCODE: string
}

/** Identity/session props read from CRM browser storage (empty until hydrated on the client). */
export type ReportsRemoteAuthProps = {
  username: string
  token: string
}

export function getReportsEmbedApiConfig(): ReportsEmbedApiConfig {
  return {
    API_BASE_URL: resolveReportsApiBaseUrl(CONSTANTS.API_BASE_URL),
    API_MANDATE_PARAMS: CONSTANTS.API_MANDATE_PARAMS,
    VERSION: CONSTANTS.VERSION,
    APPCODE: CONSTANTS.APPCODE,
  }
}

/** When CRM `API_BASE_URL` is empty (same-origin prod), fall back to the browser origin for MF API proxies. */
export function resolveReportsApiBaseUrl(configured: string): string {
  const trimmed = configured?.trim() ?? ''
  if (trimmed) return trimmed.replace(/\/$/, '')
  if (typeof window !== 'undefined') {
    return window.location.origin.replace(/\/$/, '')
  }
  return ''
}

/**
 * Reads CRM login session for the reports remote. Safe when `window` is missing (SSR): returns empty strings.
 */
export function readReportsRemoteAuthProps(): ReportsRemoteAuthProps {
  if (typeof window === 'undefined') {
    return { username: '', token: '' }
  }

  const token = readAccessTokenString() ?? ''

  let username = ''
  try {
    const raw = window.localStorage.getItem('userProfileData')
    if (raw && raw !== 'undefined') {
      const p = JSON.parse(raw) as Record<string, unknown>
      username =
        (typeof p.email === 'string' && p.email) ||
        (typeof p.full_name === 'string' && p.full_name) ||
        (typeof p.name === 'string' && p.name) ||
        ''
    }
  } catch {
    /* ignore */
  }

  return { username, token }
}

/**
 * Session fields for **`reports/ReportDetail`**: **`userToken`** (access token) and **`userRole`** (`role_profile`).
 */
export function readReportsRemoteSessionForDetail(): {
  username: string
  token: string
  userToken: string
  userRole: string
} {
  const base = readReportsRemoteAuthProps()
  if (typeof window === 'undefined') {
    return { ...base, userToken: base.token, userRole: '' }
  }
  return {
    ...base,
    userToken: base.token,
    userRole: readRoleProfileFromStorage(),
  }
}
