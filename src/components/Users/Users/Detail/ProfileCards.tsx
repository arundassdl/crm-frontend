'use client'

import type { ElementType, ReactNode } from 'react'

import { useColorScheme } from '@mui/material/styles'

/** Settings/profile chrome shared by Personal Settings and the Users detail view. */
export function useIsDarkMode(): boolean {
  const { mode, systemMode } = useColorScheme()
  return (mode === 'system' ? systemMode : mode) === 'dark'
}

const ROLE_BADGE: Record<string, { bg: string; text: string; border: string }> = {
  'Super Admin': { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' },
  Administrator: { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' },
  'Support Executive': { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  'Operations Manager': { bg: '#F0FDF4', text: '#166534', border: '#BBF7D0' },
  'VP of Operations': { bg: '#EDE9FE', text: '#6D28D9', border: '#DDD6FE' },
  'Team Leader': { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' }
}

export function RoleBadge({ role }: { role: string }) {
  const cfg = ROLE_BADGE[role] ?? { bg: '#F1F5F9', text: '#475569', border: '#E2E8F0' }
  return (
    <span
      className="rounded-full border px-2 py-0.5 text-[11px] font-bold"
      style={{ backgroundColor: cfg.bg, color: cfg.text, borderColor: cfg.border }}
    >
      {role}
    </span>
  )
}

export function SettingCard({
  icon: Icon,
  title,
  color = '#3B82F6',
  children,
  action
}: {
  icon: ElementType
  title: string
  color?: string
  children: ReactNode
  action?: ReactNode
}) {
  const isDark = useIsDarkMode()
  return (
    <div
      className={`overflow-hidden rounded-2xl border shadow-sm ${
        isDark ? 'border-[#27272A] bg-[#1C1C1E]' : 'border-[#E3ECFC] bg-[#f9fbff]'
      }`}
    >
      <div
        className={`flex items-center gap-2.5 border-b px-5 py-3.5 ${
          isDark ? 'border-[#27272A]' : 'border-[#EFF6FF]'
        }`}
      >
        <div
          className="flex h-6 w-6 items-center justify-center rounded-lg"
          style={{ backgroundColor: color + (isDark ? '22' : '18') }}
        >
          <Icon size={13} color={color} weight="duotone" />
        </div>
        <span className="flex-1 font-heading text-[12px] font-bold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        {action}
      </div>
      <div className="px-5 py-2">{children}</div>
    </div>
  )
}

export function KVGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">{children}</div>
}

export function ProfileHero({
  name,
  role,
  subtitle,
  contacts,
  avatar
}: {
  name: string
  role?: string
  subtitle?: string
  contacts: { icon: ElementType; value: string; link?: boolean }[]
  /** Avatar + upload affordance; owned by the caller so image-upload logic stays put. */
  avatar: ReactNode
}) {
  const isDark = useIsDarkMode()
  return (
    <div
      className={`mb-4 overflow-hidden rounded-2xl border shadow-sm ${
        isDark ? 'border-[#27272A] bg-[#1C1C1E]' : 'border-[#E3ECFC] bg-[#f9fbff]'
      }`}
    >
      <div
        className={`relative h-[64px] ${
          isDark
            ? 'bg-gradient-to-r from-[#18181B] to-[#27272A]'
            : 'bg-gradient-to-r from-[#1D4ED8] to-[#3B82F6]'
        }`}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 80% 50%, rgba(255,255,255,0.07) 0%, transparent 70%)'
          }}
        />
      </div>
      <div className="relative px-6 pb-5">
        <div className="absolute -top-8 left-6">{avatar}</div>
        <div className="pt-3 pl-[80px]">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span
              className={`text-[16px] font-extrabold leading-tight tracking-tight ${
                isDark ? 'text-[#F4F4F5]' : 'text-slate-900'
              }`}
            >
              {name || '—'}
            </span>
            {role ? <RoleBadge role={role} /> : null}
          </div>
          {subtitle ? (
            <div className={`mb-1.5 text-[12px] ${isDark ? 'text-[#9CA3AF]' : 'text-slate-400'}`}>
              {subtitle}
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-3">
            {contacts.map(({ icon: Icon, value, link }, i) => (
              <div
                key={i}
                className={`flex items-center gap-1.5 text-[12px] ${
                  link
                    ? isDark
                      ? 'text-[#A1A1AA]'
                      : 'text-[#1D4ED8]'
                    : isDark
                      ? 'text-[#71717A]'
                      : 'text-slate-500'
                }`}
              >
                <Icon size={11} weight="duotone" />
                <span className="break-all">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
