'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Suspense } from 'react'
import type { ComponentType } from 'react'

import type { SettingsMenuChild } from './utils/getMenu'
import { getSettingItemDescription } from './utils/settingsUi'

const componentMap: Record<string, ComponentType> = {
  domains: dynamic(() => import('./sections/Domains')),
  payments: dynamic(() => import('./sections/Payments')),
  invoices: dynamic(() => import('./sections/Invoices')),
  security: dynamic(() => import('./sections/Security')),
  email: dynamic(() => import('./sections/Email')),
  /** `/user/users` → tab key `user-users`, URL `?tab=general&subtab=users` (+ optional `detail=`; see UserUsersSettingsPanel) */
  'user-users': dynamic(() => import('./UserUsersSettingsPanel')),
  /** `/setup/customization/modules` → key `setup-customization-modules`, URL `?tab=customization&subtab=modules` */
  'setup-customization-modules': dynamic(() => import('./ModuleSettingsPanel')),
  /** `/setup/layouts` → key `setup-customization-home-page`, URL `?tab=customization&subtab=home-page` */
  'setup-customization-home-page': dynamic(() => import('./ModuleSettingsPanel')),
  /** `/user/permission` → tab key `user-permission`, URL `?tab=security&subtab=permission` */
  'user-permission': dynamic(() => import('./PermissionSettingsPanel')),
  /** `/user/roles` → tab key `user-roles`, URL `?tab=security&subtab=roles` (+ optional `detail=`) */
  'user-roles': dynamic(() => import('./RolesSettingsPanel'))
}

/** Same account/address UI as `/my-account`; loads logged-in user via `useProfilePage`. */
const GeneralSettingsPanel = dynamic(() => import('./GeneralSettingsPanel'), { ssr: false })

/** Personal / Organization often use `path: "#"` in menu data; full pages live on these routes. */
function openHrefForSettingsLeaf(item: SettingsMenuChild): string {
  const k = item.key.toLowerCase()
  if (k === 'general-personal') return '/my-account'
  if (k === 'general-organization') return '/settings?tab=general&subtab=organization'
  const p = item.path?.trim()
  if (p && p !== '#') return p
  return '/settings'
}

type SettingsContentProps = {
  activeTab: string
  menu: SettingsMenuChild[]
}

function lastPathSegment(path: string): string {
  const parts = path.split('/').filter(Boolean)
  return (parts[parts.length - 1] ?? '').toLowerCase()
}

/** When `menuListData` has not loaded yet, still show the standard settings placeholder. */
function syntheticGeneralMenuItem(key: string): SettingsMenuChild | null {
  if (key === 'general-personal') {
    return {
      label: 'Personal Settings',
      key: 'general-personal',
      path: '/my-account',
      icon: 'ri-user-settings-line'
    }
  }
  if (key === 'general-organization') {
    return {
      label: 'Organization',
      key: 'general-organization',
      path: '/settings?tab=general&subtab=organization',
      icon: 'ri-building-4-line'
    }
  }
  return null
}

export default function SettingsContent({ activeTab, menu }: SettingsContentProps) {
  const normalized = activeTab.trim().toLowerCase()
  const activeItem = menu.find(m => m.key === activeTab)
  const displayItem =
    activeItem ??
    (normalized === 'general-personal' || normalized === 'general-organization'
      ? syntheticGeneralMenuItem(normalized)
      : null)

  const pathSegment = displayItem?.path ? lastPathSegment(displayItem.path) : ''

  const Component =
    componentMap[normalized] ||
    (pathSegment ? componentMap[pathSegment] : undefined)

  if (!activeTab) {
    return (
      <div className="relative min-h-[320px] px-8 pb-8 pt-[2.4rem]">
        <p className="text-slate-400">Loading...</p>
      </div>
    )
  }

  /** e.g. `?tab=general&subtab=users` before `menuListData` includes Users, or API path differs */
  if (!displayItem && !Component) {
    return (
      <div className="relative min-h-[320px] px-8 pb-8 pt-[2.4rem]">
        <p className="text-slate-400">Select a setting</p>
      </div>
    )
  }

  if (Component) {
    if (normalized === 'user-users' || normalized === 'user-roles') {
      return (
        <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
          <Suspense
            fallback={
              <div className="relative flex min-h-[240px] flex-1 items-center justify-center bg-[#EFF6FF] pt-[2.4rem] text-slate-400 dark:bg-[#0A0A0A]">
                Loading...
              </div>
            }
          >
            <Component />
          </Suspense>
        </div>
      )
    }
    if (
      normalized === 'setup-customization-modules' ||
      normalized === 'user-permission'
    ) {
      return (
        <Suspense
          fallback={
            <div className="relative flex min-h-[240px] items-center justify-center bg-[#EFF6FF] pt-[2.4rem] text-slate-400 dark:bg-[#0A0A0A]">
              Loading...
            </div>
          }
        >
          <Component />
        </Suspense>
      )
    }
    if (normalized === 'setup-customization-home-page') {
      return (
        <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
          <Suspense
            fallback={
              <div className="relative flex min-h-[240px] flex-1 items-center justify-center bg-[#EFF6FF] pt-[2.4rem] text-slate-400 dark:bg-[#0A0A0A]">
                Loading...
              </div>
            }
          >
            <Component />
          </Suspense>
        </div>
      )
    }
    return (
      <div className="relative flex min-h-[320px] flex-col bg-[#EFF6FF] px-6 py-6 dark:bg-[#0A0A0A]">
        <div className="relative flex flex-1 flex-col overflow-hidden rounded-2xl border border-[#E3ECFC] bg-[#f9fbff] shadow-sm dark:border-[#27272A] dark:bg-[#1C1C1E]">
          <Component />
        </div>
      </div>
    )
  }

  /** `?tab=general&subtab=personal-settings` — embed profile (not only a link to `/my-account`). */
  if (normalized === 'general-personal') {
    return (
      <Suspense
        fallback={
          <div className="relative flex min-h-[240px] items-center justify-center bg-[#EFF6FF] pt-[2.4rem] text-slate-400 dark:bg-[#0A0A0A]">
            Loading...
          </div>
        }
      >
        <GeneralSettingsPanel />
      </Suspense>
    )
  }

  /** `?tab=general&subtab=organization` — CRM Company form (same shell as personal settings). */
  if (normalized === 'general-organization') {
    return (
      <Suspense
        fallback={
          <div className="relative flex min-h-[240px] items-center justify-center bg-[#EFF6FF] pt-[2.4rem] text-slate-400 dark:bg-[#0A0A0A]">
            Loading...
          </div>
        }
      >
        <GeneralSettingsPanel />
      </Suspense>
    )
  }

  if (!displayItem) {
    return (
      <div className="relative min-h-[320px] px-8 pb-8 pt-[2.4rem]">
        <p className="text-slate-400">Select a setting</p>
      </div>
    )
  }

  const leafIcon = displayItem.icon?.trim()

  return (
    <div className="relative min-h-[420px] bg-[#EFF6FF] px-6 py-6 dark:bg-[#0A0A0A]">
      <div className="overflow-hidden rounded-2xl border border-[#E3ECFC] bg-[#f9fbff] shadow-sm dark:border-[#27272A] dark:bg-[#1C1C1E]">
        <div className="flex items-center gap-2.5 border-b border-[#EFF6FF] px-5 py-3.5 dark:border-[#27272A]">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#3B82F618] dark:bg-[#3B82F622]">
            {leafIcon ? (
              <i aria-hidden className={`${leafIcon} text-[13px] text-[#3B82F6]`} />
            ) : null}
          </div>
          <span className="flex-1 font-heading text-[12px] font-bold uppercase tracking-wider text-slate-500">
            {displayItem.label}
          </span>
        </div>

        <div className="px-5 py-5">
          <div className="text-[14px] font-bold leading-snug text-slate-700 dark:text-[#D4D4D8]">
            {getSettingItemDescription(displayItem)}
          </div>
          <div className="mt-1 text-[12px] text-slate-400">
            This area opens as a full page in the app.
          </div>

          <Link
            href={openHrefForSettingsLeaf(displayItem)}
            className="mt-4 inline-flex items-center gap-1 rounded-lg bg-[#1D4ED8] px-3 py-1.5 text-[12px] font-bold text-white transition-colors hover:bg-[#2563EB]"
          >
            Open {displayItem.label}
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
