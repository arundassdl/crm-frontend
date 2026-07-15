'use client'
import { readAccessTokenDataParsed } from '@/utils/accessTokenDataStorage'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

import UserDetails from '@/components/Users/Users/UserDetails'

import { canonicalGeneralSubtab } from './utils/getMenu'

const OrganizationCompanySettings = dynamic(() => import('./OrganizationCompanySettings'), { ssr: false })

function readLoggedInUserName(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const t = readAccessTokenDataParsed()
    const key = String(t?.email ?? t?.username ?? '').trim()
    return key || null
  } catch {
    return null
  }
}

/**
 * Personal settings: same user detail shell as `/user/users/detail/...` (`UserOverview` via `UserDetails`).
 * Organization: CRM Company form (`OrganizationCompanySettings`).
 */
export default function GeneralSettingsPanel() {
  const pathname = usePathname() ?? ''
  const searchParams = useSearchParams()
  const subCanon = canonicalGeneralSubtab(searchParams?.get('subtab'))
  const isOrganization =
    subCanon === 'organization' || pathname.includes('my-company')

  const [currentUserName, setCurrentUserName] = useState<string | null>(() =>
    readLoggedInUserName()
  )

  useEffect(() => {
    setCurrentUserName(readLoggedInUserName())
  }, [])

  if (isOrganization) {
    return (
      <div className='relative flex min-h-[320px] w-full min-w-0 flex-1 flex-col overflow-y-auto bg-[#EFF6FF] dark:bg-[#0A0A0A]'>
        <OrganizationCompanySettings />
      </div>
    )
  }

  if (!currentUserName) {
    return (
      <div className='relative flex min-h-[240px] items-center justify-center bg-[#EFF6FF] px-8 pb-8 pt-[2.4rem] text-slate-500 dark:bg-[#0A0A0A]'>
        Loading profile…
      </div>
    )
  }

  return (
    <div className='relative flex min-h-[320px] w-full min-w-0 flex-1 flex-col overflow-y-auto bg-[#EFF6FF] dark:bg-[#0A0A0A]'>
      <UserDetails name={currentUserName} />
    </div>
  )
}
