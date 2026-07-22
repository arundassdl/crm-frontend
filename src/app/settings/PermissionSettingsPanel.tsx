'use client'

import PermissionMatrix from '@/components/roles/PermissionMatrix'

/** Full-height column so PermissionMatrix (its own header/tabs/content) fills the panel — matches reference. */
const permissionShell =
  'relative flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-white dark:bg-[#0A0A0A]'

/**
 * Permissions: `/settings?tab=security&subtab=permission` (menu path `/user/permission` → key `user-permission`).
 */
export default function PermissionSettingsPanel() {
  return (
    <div className={permissionShell}>
      <PermissionMatrix />
    </div>
  )
}
