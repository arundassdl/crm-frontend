/**
 * CRM-owned reports routes only — **never** embed reports-app origins or external MF URLs here.
 */

/** Listing shell (federated ReportListing). */
export const REPORTS_LIST_HREF = '/reports' as const

/** Prefix for detail pages; segment is always `${REPORTS_DETAIL_HREF_PREFIX}/${encodeURIComponent(name)}`. */
export const REPORTS_DETAIL_HREF_PREFIX = '/reports/details' as const

/** Prefix for edit/builder pages; segment is `${REPORTS_EDIT_HREF_PREFIX}/${encodeURIComponent(code)}`. */
export const REPORTS_EDIT_HREF_PREFIX = '/reports/edit' as const

/**
 * Path for `<Link href={…}>`, `router.push`, etc. (listing rows → detail, breadcrumbs, etc.).
 *
 * @example reportDetailUrl('QRY-0003') → `/reports/details/QRY-0003`
 * @example reportDetailUrl('SALES-SUMMARY') → `/reports/details/SALES-SUMMARY`
 */
export function reportDetailUrl(name: string): string {
  const n = name.trim()
  if (!n) return REPORTS_LIST_HREF
  return `${REPORTS_DETAIL_HREF_PREFIX}/${encodeURIComponent(n)}`
}

/**
 * Path for report builder edit mode.
 *
 * @example reportEditUrl('QRY-0010') → `/reports/edit/QRY-0010`
 */
export function reportEditUrl(code: string): string {
  const c = code.trim()
  if (!c) return REPORTS_LIST_HREF
  return `${REPORTS_EDIT_HREF_PREFIX}/${encodeURIComponent(c)}`
}
