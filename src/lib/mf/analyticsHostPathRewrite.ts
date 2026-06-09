/**
 * The analytics micro-frontend (standalone) uses paths like `/dashboard` and `/dashboard/create`.
 * On the CRM host they live under `/analytics/...`.
 *
 * If the remote is built with Next `basePath: '/analytics'`, internal links may already be
 * `/analytics/dashboard/create`. Next.js can prefix `basePath` again, producing
 * `/analytics/analytics/dashboard/create` — normalize that on the host.
 */
export function normalizeDoubledAnalyticsPrefix(pathname: string): string {
  let p = pathname
  while (p.startsWith('/analytics/analytics')) {
    p = '/analytics' + p.slice('/analytics/analytics'.length)
  }
  return p
}

/**
 * If the remote uses root-absolute links (`href="/dashboard/create"`), map them to the host.
 *
 * Returns the target pathname to redirect to, or `null` if no rewrite applies.
 */
export function getAnalyticsHostPathRewrite(pathname: string): string | null {
  const collapse = normalizeDoubledAnalyticsPrefix(pathname)
  if (collapse !== pathname) {
    return collapse
  }
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    return `/analytics${pathname}`
  }
  if (pathname === '/Dashboard' || pathname.startsWith('/Dashboard/')) {
    const rest = pathname === '/Dashboard' ? '' : pathname.slice('/Dashboard'.length)
    return `/analytics/dashboard${rest}`
  }
  return null
}
