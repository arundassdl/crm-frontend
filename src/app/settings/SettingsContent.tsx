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

function ContentBackdrop() {
  return (
    <div
      className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 translate-x-1/4 translate-y-1/4 rounded-full bg-gradient-to-br from-violet-200/40 via-amber-200/30 to-cyan-200/40 blur-2xl"
      aria-hidden
    />
  )
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
        <ContentBackdrop />
        <p className="text-[var(--mui-palette-text-secondary)]">Loading...</p>
      </div>
    )
  }

  /** e.g. `?tab=general&subtab=users` before `menuListData` includes Users, or API path differs */
  if (!displayItem && !Component) {
    return (
      <div className="relative min-h-[320px] px-8 pb-8 pt-[2.4rem]">
        <ContentBackdrop />
        <p className="text-[var(--mui-palette-text-secondary)]">Select a setting</p>
      </div>
    )
  }

  if (Component) {
    if (normalized === 'user-users' || normalized === 'user-roles') {
      return (
        <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
          <Suspense
            fallback={
              <div className="relative flex min-h-[240px] flex-1 items-center justify-center bg-[var(--mui-palette-background-paper)] pt-[2.4rem] text-[var(--mui-palette-text-secondary)]">
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
            <div className="relative flex min-h-[240px] items-center justify-center bg-[var(--mui-palette-background-paper)] pt-[2.4rem] text-[var(--mui-palette-text-secondary)]">
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
              <div className="relative flex min-h-[240px] flex-1 items-center justify-center bg-[var(--mui-palette-background-paper)] pt-[2.4rem] text-[var(--mui-palette-text-secondary)]">
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
      <div className="relative min-h-[320px] px-8 pb-8 pt-[2.4rem]">
        <ContentBackdrop />
        <div className="relative rounded-xl border border-[var(--mui-palette-divider)] bg-[var(--mui-palette-background-paper)] p-6 shadow-sm">
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
          <div className="relative flex min-h-[240px] items-center justify-center bg-[var(--mui-palette-background-paper)] pt-[2.4rem] text-[var(--mui-palette-text-secondary)]">
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
          <div className="relative flex min-h-[240px] items-center justify-center bg-[var(--mui-palette-background-paper)] pt-[2.4rem] text-[var(--mui-palette-text-secondary)]">
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
        <ContentBackdrop />
        <p className="text-[var(--mui-palette-text-secondary)]">Select a setting</p>
      </div>
    )
  }

  const leafIcon = displayItem.icon?.trim()

  return (
    <div className="relative min-h-[420px] overflow-hidden px-8 pb-8 pt-[2.4rem] md:px-10 md:pb-10">
      <ContentBackdrop />

      <div className="relative max-w-xl">
        {leafIcon ? (
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--mui-palette-divider)] bg-[var(--mui-palette-background-paper)] shadow-sm">
            <i className={`${leafIcon} text-2xl text-[var(--mui-palette-text-primary)]`} />
          </div>
        ) : null}

        <h2 className="text-2xl font-semibold tracking-tight text-[var(--mui-palette-text-primary)]">
          {displayItem.label}
        </h2>
        <p className="mt-3 text-base leading-relaxed text-[var(--mui-palette-text-secondary)]">
          {getSettingItemDescription(displayItem)}
        </p>

        <p className="mt-6 text-sm text-[var(--mui-palette-text-secondary)]">
          This area opens as a full page in the app. Use the link below to continue in the main layout.
        </p>

        <Link
          href={openHrefForSettingsLeaf(displayItem)}
          className="mt-4 inline-flex items-center gap-1 text-base font-medium text-primary hover:underline"
        >
          Open {displayItem.label}
          <span aria-hidden className="text-lg">
            →
          </span>
        </Link>
      </div>
    </div>
  )
}
