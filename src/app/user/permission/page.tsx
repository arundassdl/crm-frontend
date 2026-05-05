import { redirect } from 'next/navigation'

/** Permissions live under Settings: `/settings?tab=security&subtab=permission` (`/user/permission` → tab key `user-permission`). */
export default function PermissionRedirectPage() {
  redirect('/settings?tab=security&subtab=permission')
}
