'use client'

import PermissionMatrix from '@/components/roles/PermissionMatrix'

/** Matches Users / Modules settings shell: full panel, scroll, paper background */
const permissionShell =
  'relative flex h-full min-h-0 flex-1 flex-col overflow-hidden overflow-y-auto bg-[var(--mui-palette-background-paper)] pt-[2.4rem]'

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
