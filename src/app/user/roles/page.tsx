import { redirect } from 'next/navigation'

/** Roles listing: `/settings?tab=security&subtab=roles` (path `/user/roles` → tab key `user-roles`). */
export default function RolesListingRedirectPage() {
  redirect('/settings?tab=security&subtab=roles')
}
