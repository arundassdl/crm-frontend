'use client'

import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import Sidebar from './Sidebar'
import { getSettingsMenu, settingsUrlForMenuItem, type SettingsMenuChild } from './utils/getMenu'

const USER_TAB = 'user-users'

/**
 * Same chrome as `/settings?tab=general&subtab=users`: settings sidebar + main area.
 * Used for `/user/users/detail/[slug]` so user detail matches embedded Users listing.
 */
export default function UserUsersSettingsChrome({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [menu, setMenu] = useState<SettingsMenuChild[]>(() => getSettingsMenu())

  useLayoutEffect(() => {
    setMenu(getSettingsMenu())
  }, [])

  useEffect(() => {
    const loadMenu = () => setMenu(getSettingsMenu())
    window.addEventListener('menuListData-refreshed', loadMenu)
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'menuListData') loadMenu()
    }
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('menuListData-refreshed', loadMenu)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const onSelectTab = useCallback(
    (key: string) => {
      const item = menu.find(m => m.key === key)
      const url = item ? settingsUrlForMenuItem(item) : `/settings?tab=${encodeURIComponent(key)}`
      router.push(url, { scroll: false })
    },
    [router, menu]
  )

  const content = (
    <div className="relative flex min-h-0 flex-1 flex-col bg-[var(--mui-palette-background-paper)] pt-[2.4rem] px-4 pb-8 sm:px-6 md:px-8">
      {children}
    </div>
  )

  return (
    <div className="flex min-h-[calc(100vh-7rem)] w-full items-stretch overflow-hidden rounded-xl border border-[var(--mui-palette-divider)] bg-[var(--mui-palette-background-paper)] shadow-sm">
      <Sidebar menu={menu} activeTab={USER_TAB} onSelectTab={onSelectTab} />

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto bg-[var(--mui-palette-background-default)]">
        {content}
      </div>
    </div>
  )
}
