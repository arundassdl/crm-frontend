'use client'

import dynamic from 'next/dynamic'
import { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'

import RolesListingEmbed from './RolesListingEmbed'
import { parseSettingsSearchParams } from './utils/getMenu'

const RoleDetail = dynamic(() => import('@/components/roles/RoleDetail'))

const listColumnClass =
  'relative flex h-full min-h-0 w-[35%] min-w-[260px] max-w-[520px] shrink-0 flex-col overflow-hidden border-r border-[var(--mui-palette-divider)] bg-[var(--mui-palette-background-paper)] pt-[2.4rem]'

const detailColumnClass =
  'relative flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-y-auto bg-[var(--mui-palette-background-paper)] pt-[2.4rem] px-4 pb-8 sm:px-6 md:px-8'

const emptyDetailClass =
  'flex flex-1 flex-col items-center justify-center px-6 py-16 text-center text-[var(--mui-palette-text-secondary)]'

/**
 * Roles: two-column layout at `/settings?tab=security&subtab=roles` (like Users).
 * `detail` = role key for the right-hand Role detail pane.
 */
export default function RolesSettingsPanel() {
  const searchParams = useSearchParams()
  const safeParams = searchParams ?? new URLSearchParams()
  const parsed = useMemo(
    () => parseSettingsSearchParams(safeParams),
    [safeParams.toString()]
  )
  const detail = parsed.detail ?? safeParams.get('detail')

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-row overflow-hidden bg-[var(--mui-palette-background-paper)]">
      <div className={listColumnClass}>
        <RolesListingEmbed settingsDetailKey={detail ?? ''} />
      </div>
      <div className={detailColumnClass}>
        {detail ? (
          <RoleDetail role_name={decodeURIComponent(detail)} />
        ) : (
          <div className={emptyDetailClass}>
            <p className="max-w-sm text-sm leading-relaxed">
              Select a role from the tree or list to view details.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
