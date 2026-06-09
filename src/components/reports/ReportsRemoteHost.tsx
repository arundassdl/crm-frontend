'use client'

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { ReportsMfHostChrome } from '@/components/reports/ReportsMfHostChrome'
import {
  loadReportsRemoteModuleSafe,
  reportsRemoteDynamicOptions,
} from '@/lib/mf/loadReportsRemoteModule'
import {
  getReportsEmbedApiConfig,
  readReportsRemoteAuthProps,
  type ReportsCreateReportPrimaryModuleOption,
  type ReportsRemoteAuthProps,
} from '@/lib/reportsEmbed/reportsEmbedConfig'
import {
  REPORTS_DETAIL_HREF_PREFIX,
  REPORTS_EDIT_HREF_PREFIX,
  REPORTS_LIST_HREF,
} from '@/lib/reports/reportRoutes'

const ReportsRemote = dynamic(
  () => loadReportsRemoteModuleSafe(),
  {
    ...reportsRemoteDynamicOptions,
  }
)

export type ReportsRemoteHostProps = {
  /** When set (e.g. `QRY-0003` from `/report/QRY-0003`), passed into the federated UI for detail mode. */
  reportCode?: string
  /** Create Report dialog — primary-module dropdown (`reports/AppContext` → `InsightsQueryListing`). */
  createReportPrimaryModuleOptions?: ReportsCreateReportPrimaryModuleOption[]
  /** Create Report dialog — host-owned navigation after **Continue**. */
  onCreateReportContinue?: (primaryModule: string) => void
}

function buildRouteProps(pathname: string, reportCode?: string) {
  const trimmed = reportCode?.trim() ?? ''
  const hasDetail = trimmed.length > 0
  /**
   * Remotes often expect Frappe-style `queryName`, generic `reportId`/`slug`, or only `reportCode`.
   * `crmReportPath` mirrors the CRM URL (`/report/QRY-0003`) when Next-router-driven reads fail.
   *
   * **`crmReportsDetailHrefPrefix`** — CRM detail base from `reportRoutes`; listing links must be
   * `${crmReportsDetailHrefPrefix}/${encodeURIComponent(reportName)}`, never `/details/:name`.
   * **`crmReportsEditHrefPrefix`** — CRM edit base; edit links must be
   * `${crmReportsEditHrefPrefix}/${encodeURIComponent(reportCode)}`, never `/edit/:code`.
   * **`crmReportsListingHref`** — canonical listing path for back navigation.
   */
  return {
    crmReportPath: pathname,
    crmReportsListingHref: REPORTS_LIST_HREF,
    crmReportsDetailHrefPrefix: REPORTS_DETAIL_HREF_PREFIX,
    crmReportsEditHrefPrefix: REPORTS_EDIT_HREF_PREFIX,
    ...(hasDetail
      ? {
          reportCode: trimmed,
          queryName: trimmed,
          reportId: trimmed,
          slug: trimmed,
        }
      : {}),
  }
}

/**
 * Federated reports-app shell: API config + auth + optional detail identifiers for `/report/[value]`.
 * Detail navigation targets **`/reports/details/:reportName`**; edit targets **`/reports/edit/:id`**
 * (see **`crmReportsDetailHrefPrefix`**, **`crmReportsEditHrefPrefix`**, **`crmReportsListingHref`**).
 */
export default function ReportsRemoteHost({
  reportCode,
  createReportPrimaryModuleOptions,
  onCreateReportContinue,
}: ReportsRemoteHostProps) {
  const pathname = usePathname() ?? ''
  const apiConfig = useMemo(() => getReportsEmbedApiConfig(), [])
  const [auth, setAuth] = useState<ReportsRemoteAuthProps>(() =>
    readReportsRemoteAuthProps()
  )

  const trimmedCode = reportCode?.trim() ?? ''
  const routeProps = useMemo(
    () => buildRouteProps(pathname, reportCode),
    [pathname, reportCode]
  )

  /** Remount federated tree when switching `/reports` ↔ `/report/x` or between codes (reset listing-only state). */
  const remoteMountKey = trimmedCode ? `report-detail:${trimmedCode}` : 'report-listing'

  useEffect(() => {
    setAuth(readReportsRemoteAuthProps())
  }, [])

  return (
    <ReportsMfHostChrome mountKey={remoteMountKey} rootId="reports-root">
      <ReportsRemote
        key={remoteMountKey}
        {...apiConfig}
        {...auth}
        {...routeProps}
        createReportPrimaryModuleOptions={createReportPrimaryModuleOptions}
        onCreateReportContinue={onCreateReportContinue}
      />
    </ReportsMfHostChrome>
  )
}
