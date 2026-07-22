'use client'

import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'

import { CaretDown, CaretUp, Gear } from '@phosphor-icons/react'

import {
  canonicalGeneralSubtab,
  getSettingsRootIcon,
  parseSettingsSearchParams,
  type SettingsMenuChild
} from './utils/getMenu'
import { groupMenuItems } from './utils/settingsUi'

type SidebarProps = {
  menu: SettingsMenuChild[]
  activeTab: string
  onSelectTab: (key: string) => void
}

function itemMatchesSettingsUrl(
  item: SettingsMenuChild,
  tabFromUrl: string | null,
  subtabFromUrl: string | null
): boolean {
  if (item.settingsTab == null || item.settingsSubtab == null) return false
  const t = (tabFromUrl ?? '').trim().toLowerCase()
  if (!t) return false
  const it = item.settingsTab.trim().toLowerCase()
  const is = item.settingsSubtab.trim().toLowerCase()
  if (it !== t) return false
  if (t === 'general') {
    const urlCanon = canonicalGeneralSubtab(subtabFromUrl).toLowerCase()
    const effectiveSub = urlCanon || 'personal-settings'
    return is === effectiveSub
  }
  const s = (subtabFromUrl ?? '').trim().toLowerCase()
  // Modules & Fields owns every module context: the listing (subtab=modules) AND any module
  // detail / layout page (subtab=<ModuleName>) — i.e. any customization subtab that isn't home-page.
  if (t === 'customization' && is === 'modules') {
    return s !== '' && s !== 'home-page'
  }
  if (!s) return false
  return is === s
}

export default function Sidebar({ menu, activeTab, onSelectTab }: SidebarProps) {
  const searchParams = useSearchParams()
  const safeParams = searchParams ?? new URLSearchParams()
  const searchKey = safeParams.toString()
  const parsedUrl = useMemo(() => parseSettingsSearchParams(safeParams), [searchKey])

  const groups = groupMenuItems(menu)
  /** Settings root `icon` from `menuListData` (e.g. `ri-settings-2-line`); re-read when `menu` refreshes. */
  const settingsRootIcon = useMemo(() => getSettingsRootIcon(), [menu])

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const toggle = (key: string) => setCollapsed(p => ({ ...p, [key]: !p[key] }))

  return (
    <aside className="flex w-full flex-shrink-0 flex-col self-stretch overflow-y-auto border-b border-[#E3ECFC] bg-[#f9fbff] dark:border-[#27272A] dark:bg-[#0A0A0A] sm:w-[240px] sm:border-b-0 sm:border-r">
      <div className="border-b border-[#E3ECFC] px-4 pb-4 pt-5 dark:border-[#27272A]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-[#1D4ED8] shadow-sm">
            {settingsRootIcon ? (
              <i aria-hidden className={`${settingsRootIcon} text-[15px] text-white`} />
            ) : (
              <Gear size={15} color="#fff" weight="duotone" />
            )}
          </div>
          <div className="min-w-0">
            <div className="font-heading text-[14px] font-bold leading-tight text-slate-900 dark:text-white">
              Settings
            </div>
            <div className="text-[12px] leading-tight text-slate-400">Manage workspace</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-2 py-3">
        {groups.map(({ title, items, groupIcon }) => {
          const isOpen = !collapsed[title]
          return (
            <div key={title}>
              <button
                type="button"
                onClick={() => toggle(title)}
                className="group flex min-h-[32px] w-full items-center justify-between rounded-lg px-2 py-1.5 outline-none transition-colors hover:bg-[#EFF6FF] dark:hover:bg-[#1D4ED8]/15"
              >
                <span className="flex min-w-0 items-center gap-1.5">
                  {groupIcon ? (
                    <i
                      aria-hidden
                      className={`${groupIcon} flex-shrink-0 text-[13px] leading-none text-slate-400`}
                    />
                  ) : null}
                  <span className="truncate font-heading text-[13px] font-bold uppercase tracking-widest text-slate-400 transition-colors group-hover:text-slate-500 dark:text-[#475569] dark:group-hover:text-[#64748B]">
                    {title}
                  </span>
                </span>
                {isOpen ? (
                  <CaretUp size={10} weight="bold" className="text-[#E2E8F0] dark:text-[#475569]" />
                ) : (
                  <CaretDown size={10} weight="bold" className="text-[#E2E8F0] dark:text-[#475569]" />
                )}
              </button>

              {isOpen && (
                <div className="mb-1.5 space-y-0.5">
                  {items.map(item => {
                    const active =
                      activeTab === item.key ||
                      itemMatchesSettingsUrl(item, parsedUrl.tab, parsedUrl.subtab)
                    const leafIcon = item.icon?.trim()
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={e => {
                          onSelectTab(item.key)
                          e.currentTarget.blur()
                        }}
                        className={`relative flex min-h-[36px] w-full items-center gap-2 rounded-xl px-3 py-2.5 text-[15px] font-medium outline-none transition-all focus-visible:ring-2 focus-visible:ring-[#1D4ED8] ${
                          active
                            ? 'bg-[#EFF6FF] font-semibold text-[#1D4ED8] dark:bg-[#27272A] dark:text-[#F4F4F5]'
                            : 'text-slate-500 hover:bg-[#EFF6FF]/60 hover:text-slate-700 dark:text-[#9CA3AF] dark:hover:bg-[#27272A] dark:hover:text-white'
                        }`}
                      >
                        {active && (
                          <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-r-full bg-[#1D4ED8] dark:bg-[#9CA3AF]" />
                        )}
                        {leafIcon ? (
                          <i
                            aria-hidden
                            className={`${leafIcon} flex-shrink-0 text-[13px] leading-none ${
                              active ? 'text-[#1D4ED8] dark:text-[#6B8BA3]' : 'text-[#94A3B8]'
                            }`}
                          />
                        ) : null}
                        <span className="truncate">{item.label}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
