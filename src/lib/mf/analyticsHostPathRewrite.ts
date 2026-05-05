/**
 * The analytics micro-frontend (standalone on :3001) uses paths like `/dashboard` and `/dashboard/create`.
 * On the CRM host they must live under `/analytics/...`. If the remote uses root-absolute links
 * (`href="/dashboard/create"`), middleware maps them to `/analytics/dashboard/create`.
 *
 * Returns the target pathname to redirect to, or `null` if no rewrite applies.
 */
export function getAnalyticsHostPathRewrite(pathname: string): string | null {
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    return `/analytics${pathname}`
  }
  // Remote may use PascalCase; App Router routes are lowercase `.../dashboard/...`
  if (pathname === '/Dashboard' || pathname.startsWith('/Dashboard/')) {
    const rest = pathname === '/Dashboard' ? '' : pathname.slice('/Dashboard'.length)
    return `/analytics/dashboard${rest}`
  }
  return null
}
