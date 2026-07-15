'use client'

import dynamic from 'next/dynamic'
import { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'

import UsersListingEmbed from './UsersListingEmbed'
import { parseSettingsSearchParams } from './utils/getMenu'

const UserDetail = dynamic(() => import('@/components/Users/Users/UserDetails'))

const listColumnClass =
  'relative flex h-full min-h-0 w-[340px] shrink-0 flex-col overflow-hidden border-r border-[#E3ECFC] bg-[#f9fbff] dark:border-[#27272A] dark:bg-[#111113]'

const detailColumnClass =
  'relative flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-y-auto bg-[#EFF6FF] dark:bg-[#0A0A0A]'

const emptyDetailClass =
  'flex flex-1 flex-col items-center justify-center px-6 py-16 text-center text-slate-400'

/**
 * Users tab: two-column layout — listing + details at `/settings?tab=general&subtab=users`.
 * Optional `detail` selects which user is shown on the right (e.g. `&detail=user%40example.com`).
 */
export default function UserUsersSettingsPanel() {
  const searchParams = useSearchParams()
  const safeParams = searchParams ?? new URLSearchParams()
  const parsed = useMemo(
    () => parseSettingsSearchParams(safeParams),
    [safeParams.toString()]
  )
  const detail = parsed.detail ?? safeParams.get('detail')

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-row overflow-hidden bg-[#EFF6FF] dark:bg-[#0A0A0A]">
      <div className={listColumnClass}>
        <UsersListingEmbed settingsDetailKey={detail ?? ''} />
      </div>
      <div className={detailColumnClass}>
        {detail ? (
          <UserDetail name={detail} />
        ) : (
          <div className={emptyDetailClass}>
            <p className="max-w-sm text-sm leading-relaxed">Select a user from the list to view details.</p>
          </div>
        )}
      </div>
    </div>
  )
}
