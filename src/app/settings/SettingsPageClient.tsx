'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import Sidebar from './Sidebar'
import SettingsContent from './SettingsContent'
import {
  canonicalGeneralSubtab,
  canonicalSettingsUrlFromParsed,
  getSettingsMenu,
  parseSettingsSearchParams,
  settingsUrlForMenuItem,
  type SettingsMenuChild
} from './utils/getMenu'

function norm(s: string | null | undefined): string {
  return (s ?? '').trim().toLowerCase()
}

function findMenuKeyBySettingsUrl(
  menu: SettingsMenuChild[],
  tab: string | null,
  subtab: string | null
): string | null {
  const t = norm(tab)
  if (!t) return null
  const hit = menu.find(m => {
    if (m.settingsTab == null || m.settingsSubtab == null) return false
    if (norm(m.settingsTab) !== t) return false
    if (t === 'general') {
      const urlCanon = norm(canonicalGeneralSubtab(subtab))
      if (!urlCanon) return false
      return norm(m.settingsSubtab) === urlCanon
    }
    const s = norm(subtab)
    if (!s) return false
    return norm(m.settingsSubtab) === s
  })
  return hit?.key ?? null
}

export default function SettingsPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const safeParams = searchParams ?? new URLSearchParams()
  const searchKey = safeParams.toString()

  const [menu, setMenu] = useState<SettingsMenuChild[]>(() => getSettingsMenu())
  const [activeTab, setActiveTab] = useState('')

  const parsed = useMemo(() => parseSettingsSearchParams(safeParams), [searchKey])
  const tabFromUrl = parsed.tab
  const subtabFromUrl = parsed.subtab
  const detailFromUrl = parsed.detail
  const viewFromUrl = safeParams.get('view')

  /** `?tab=general%26subtab%3Dusers` → replace with `?tab=general&subtab=users` */
  useLayoutEffect(() => {
    if (parsed.needsCanonicalReplace) {
      router.replace(canonicalSettingsUrlFromParsed(parsed), { scroll: false })
    }
  }, [parsed, router])

  useLayoutEffect(() => {
    setMenu(getSettingsMenu())
  }, [])

  useEffect(() => {
    const loadMenu = () => {
      setMenu(getSettingsMenu())
    }
    loadMenu()
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

  const menuKeySet = useMemo(() => new Set(menu.map(m => m.key)), [menu])

  const isUsersSettingsUrl = norm(tabFromUrl) === 'general' && norm(subtabFromUrl) === 'users'
  const isRolesSettingsUrl = norm(tabFromUrl) === 'security' && norm(subtabFromUrl) === 'roles'
  const isPermissionSettingsUrl = norm(tabFromUrl) === 'security' && norm(subtabFromUrl) === 'permission'
  const isCustomizationSettingsUrl = norm(tabFromUrl) === 'customization'
  const isCustomizationHomePageUrl =
    norm(tabFromUrl) === 'customization' && norm(subtabFromUrl) === 'home-page'
  const isHomePageBuilderUrl =
    isCustomizationHomePageUrl &&
    (viewFromUrl === 'dashboard-create' ||
      viewFromUrl === 'dashboard-edit' ||
      viewFromUrl === 'home-create' ||
      viewFromUrl === 'home-edit')

  useEffect(() => {
    if (menu.length === 0) {
      if (isUsersSettingsUrl) {
        setActiveTab('user-users')
      } else if (isRolesSettingsUrl) {
        setActiveTab('user-roles')
      } else if (isPermissionSettingsUrl) {
        setActiveTab('user-permission')
      } else if (isCustomizationHomePageUrl || isHomePageBuilderUrl) {
        setActiveTab('setup-customization-home-page')
      } else if (isCustomizationSettingsUrl) {
        setActiveTab('setup-customization-modules')
      }
      return
    }

    const hasKey = (k: string | null) => k != null && k !== '' && menuKeySet.has(k)

    /** Broken URL from old `path: "#"` → tab key `#` → `?tab=%23` */
    if (tabFromUrl === '#' || tabFromUrl === '%23') {
      if (menuKeySet.has('general-personal')) {
        const item = menu.find(m => m.key === 'general-personal')
        if (item) {
          setActiveTab('general-personal')
          router.replace(settingsUrlForMenuItem(item), { scroll: false })
          return
        }
      }
    }

    if (tabFromUrl === 'my-account' || tabFromUrl === 'my-company') {
      const legacyKey = tabFromUrl === 'my-company' ? 'general-organization' : 'general-personal'
      if (menuKeySet.has(legacyKey)) {
        const item = menu.find(m => m.key === legacyKey)
        if (item) {
          setActiveTab(legacyKey)
          router.replace(settingsUrlForMenuItem(item), { scroll: false })
          return
        }
      }
    }

    /** Legacy `/settings?tab=user-users` (+ optional `detail`) */
    if (tabFromUrl === 'user-users') {
      if (menuKeySet.has('user-users')) {
        const item = menu.find(m => m.key === 'user-users')
        if (item?.settingsTab && item?.settingsSubtab) {
          setActiveTab('user-users')
          router.replace(settingsUrlForMenuItem(item, { detail: detailFromUrl }), { scroll: false })
          return
        }
      }
    }

    /** Legacy `/settings?tab=user-roles` (+ optional `detail`) */
    if (tabFromUrl === 'user-roles') {
      if (menuKeySet.has('user-roles')) {
        const item = menu.find(m => m.key === 'user-roles')
        if (item?.settingsTab && item?.settingsSubtab) {
          setActiveTab('user-roles')
          router.replace(settingsUrlForMenuItem(item, { detail: detailFromUrl }), { scroll: false })
          return
        }
      }
    }

    /** Legacy `/settings?tab=user-permission` */
    if (tabFromUrl === 'user-permission') {
      if (menuKeySet.has('user-permission')) {
        const item = menu.find(m => m.key === 'user-permission')
        if (item?.settingsTab && item?.settingsSubtab) {
          setActiveTab('user-permission')
          router.replace(settingsUrlForMenuItem(item), { scroll: false })
          return
        }
      }
    }

    /** Legacy `/settings?tab=setup-customization-modules` → `tab=customization&subtab=…` */
    if (tabFromUrl === 'setup-customization-modules') {
      setActiveTab('setup-customization-modules')
      const q = new URLSearchParams(searchKey)
      q.set('tab', 'customization')
      if (!q.get('subtab')) {
        q.set('subtab', 'modules')
      }
      router.replace(`/settings?${q.toString()}`, { scroll: false })
      return
    }

    /** Legacy `/settings?tab=setup-customization-home-page` or `/settings?tab=setup-layouts` */
    if (tabFromUrl === 'setup-customization-home-page' || tabFromUrl === 'setup-layouts') {
      setActiveTab('setup-customization-home-page')
      const q = new URLSearchParams(searchKey)
      q.set('tab', 'customization')
      q.set('subtab', 'home-page')
      router.replace(`/settings?${q.toString()}`, { scroll: false })
      return
    }

    if (norm(tabFromUrl) === 'general') {
      const subRaw = subtabFromUrl
      const subCanon = norm(canonicalGeneralSubtab(subRaw))

      /**
       * Trust the URL for Personal / Organization even when `menuListData` has not yet loaded or
       * does not list these keys (otherwise we fall through to `usersItem` and hijack the route).
       */
      if (subCanon === 'personal-settings') {
        setActiveTab('general-personal')
        if (menuKeySet.has('general-personal') && norm(subRaw) !== 'personal-settings') {
          const item = menu.find(m => m.key === 'general-personal')
          if (item) router.replace(settingsUrlForMenuItem(item), { scroll: false })
        }
        return
      }
      if (subCanon === 'organization') {
        setActiveTab('general-organization')
        if (menuKeySet.has('general-organization') && norm(subRaw) !== 'organization') {
          const item = menu.find(m => m.key === 'general-organization')
          if (item) router.replace(settingsUrlForMenuItem(item), { scroll: false })
        }
        return
      }
      if (subCanon === 'users') {
        const keyFromMenu = findMenuKeyBySettingsUrl(menu, tabFromUrl, subtabFromUrl)
        setActiveTab(keyFromMenu ?? 'user-users')
        return
      }

      if (
        subCanon &&
        subCanon !== 'personal-settings' &&
        subCanon !== 'organization' &&
        subCanon !== 'users'
      ) {
        const keyExact = findMenuKeyBySettingsUrl(menu, tabFromUrl, subtabFromUrl)
        if (keyExact) {
          setActiveTab(keyExact)
          return
        }
      }

      /**
       * Missing or unknown `subtab`: never use `menu.find(settingsTab === 'general')` — the first
       * row is often Users and hijacked Personal / Organization clicks.
       */
      if (menuKeySet.has('general-personal')) {
        const item = menu.find(m => m.key === 'general-personal')
        if (item) {
          setActiveTab('general-personal')
          router.replace(settingsUrlForMenuItem(item), { scroll: false })
          return
        }
      }
      if (menuKeySet.has('general-organization')) {
        const item = menu.find(m => m.key === 'general-organization')
        if (item) {
          setActiveTab('general-organization')
          router.replace(settingsUrlForMenuItem(item), { scroll: false })
          return
        }
      }

      const firstNonUsersGeneral = menu.find(
        m =>
          m.settingsTab != null &&
          norm(m.settingsTab) === 'general' &&
          m.settingsSubtab != null &&
          norm(m.settingsSubtab) !== 'users'
      )
      if (firstNonUsersGeneral) {
        setActiveTab(firstNonUsersGeneral.key)
        router.replace(settingsUrlForMenuItem(firstNonUsersGeneral), { scroll: false })
        return
      }

      const usersItem = menu.find(m => norm(m.settingsSubtab ?? '') === 'users')
      if (usersItem) {
        setActiveTab(usersItem.key)
        router.replace(settingsUrlForMenuItem(usersItem), { scroll: false })
        return
      }
    }

    if (norm(tabFromUrl) === 'security') {
      const subNorm = norm(subtabFromUrl)
      if (subNorm === 'permission') {
        const keyFromMenu = findMenuKeyBySettingsUrl(menu, tabFromUrl, subtabFromUrl)
        setActiveTab(keyFromMenu ?? 'user-permission')
        return
      }
      if (subNorm === 'roles') {
        const keyFromMenu = findMenuKeyBySettingsUrl(menu, tabFromUrl, subtabFromUrl)
        setActiveTab(keyFromMenu ?? 'user-roles')
        return
      }
      const firstSecurity = menu.find(m => m.settingsTab === 'security' && m.settingsSubtab)
      if (firstSecurity) {
        setActiveTab(firstSecurity.key)
        router.replace(settingsUrlForMenuItem(firstSecurity), { scroll: false })
        return
      }
    }

    if (norm(tabFromUrl) === 'customization') {
      const subNorm = norm(subtabFromUrl)
      const keyFromMenu = findMenuKeyBySettingsUrl(menu, tabFromUrl, subtabFromUrl)
      if (subNorm === 'home-page') {
        setActiveTab(keyFromMenu ?? 'setup-customization-home-page')
        return
      }
      if (subNorm === 'modules' || !subtabFromUrl) {
        setActiveTab(keyFromMenu ?? 'setup-customization-modules')
        if (!subtabFromUrl) {
          router.replace('/settings?tab=customization&subtab=modules', { scroll: false })
        }
        return
      }
      setActiveTab(keyFromMenu ?? 'setup-customization-modules')
      return
    }

    if (hasKey(tabFromUrl)) {
      setActiveTab(tabFromUrl as string)
      return
    }

    const first = menu[0]
    setActiveTab(first.key)
    router.replace(settingsUrlForMenuItem(first), { scroll: false })
  }, [
    detailFromUrl,
    isCustomizationHomePageUrl,
    isHomePageBuilderUrl,
    isPermissionSettingsUrl,
    isRolesSettingsUrl,
    isUsersSettingsUrl,
    menu,
    menuKeySet,
    router,
    subtabFromUrl,
    tabFromUrl
  ])

  const onSelectTab = useCallback(
    (key: string) => {
      setActiveTab(key)
      const item = menu.find(m => m.key === key)
      const url = item ? settingsUrlForMenuItem(item) : `/settings?tab=${encodeURIComponent(key)}`
      router.push(url, { scroll: false })
    },
    [router, menu]
  )

  const mainState =
    !menu.length &&
    !isUsersSettingsUrl &&
    !isRolesSettingsUrl &&
    !isPermissionSettingsUrl &&
    !isCustomizationSettingsUrl &&
    !isCustomizationHomePageUrl &&
    !isHomePageBuilderUrl
      ? 'empty'
      : !activeTab
        ? 'tab-loading'
        : 'ready'

  return (
    <div className="flex min-h-[calc(100vh-7rem)] w-full items-stretch overflow-hidden rounded-xl border border-[#E3ECFC] bg-[#EFF6FF] shadow-sm dark:border-[#27272A] dark:bg-[#000000]">
      <Sidebar menu={menu} activeTab={activeTab} onSelectTab={onSelectTab} />

      <div
        className={
          mainState === 'ready' &&
          (activeTab === 'user-users' ||
            activeTab === 'user-roles' ||
            isHomePageBuilderUrl)
            ? 'relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#EFF6FF] dark:bg-[#0A0A0A]'
            : 'relative flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto bg-[#EFF6FF] dark:bg-[#0A0A0A]'
        }
      >
        {mainState === 'empty' && (
          <div className="flex min-h-[280px] flex-1 items-center justify-center p-8 text-[var(--mui-palette-text-secondary)]">
            No settings available
          </div>
        )}
        {mainState === 'tab-loading' && (
          <div className="flex min-h-[280px] flex-1 items-center justify-center p-8 text-[var(--mui-palette-text-secondary)]">
            Loading...
          </div>
        )}
        {mainState === 'ready' && <SettingsContent activeTab={activeTab} menu={menu} />}
      </div>
    </div>
  )
}
