'use client'

import { useEffect, useState } from 'react'
import {
  CalendarBlank,
  ClipboardText,
  Handshake,
  TrendUp,
  type Icon,
} from '@phosphor-icons/react'

import { resolveDisplayName } from './resolveDisplayName'

type QuickStat = {
  label: string
  value: string
  icon: Icon
}

/* Quick-stat pills for the banner (presentational placeholders, mirrors reference design). */
const quickStats: QuickStat[] = [
  { label: 'Tasks due today', value: '7', icon: ClipboardText },
  { label: 'Deals to follow up', value: '3', icon: Handshake },
  { label: 'Meetings today', value: '2', icon: CalendarBlank },
  { label: 'New leads this week', value: '+84', icon: TrendUp },
]

function greetingFor(hour: number): string {
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function WelcomeBanner() {
  const [name, setName] = useState('there')
  const [greeting, setGreeting] = useState('Good morning')
  const [dateLabel, setDateLabel] = useState('')

  useEffect(() => {
    setName(resolveDisplayName())
    const now = new Date()
    setGreeting(greetingFor(now.getHours()))
    setDateLabel(
      now.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    )
  }, [])

  return (
    <div className="relative overflow-hidden rounded-xl bg-[#0C2472] sm:rounded-2xl">
      {/* Decorative blobs — hidden on smaller screens */}
      <div className="pointer-events-none absolute -right-10 -top-10 hidden h-52 w-52 rounded-full bg-white/5 sm:block" />
      <div className="pointer-events-none absolute right-16 top-6 hidden h-28 w-28 rounded-full bg-white/5 md:block" />
      <div className="pointer-events-none absolute right-48 -bottom-8 hidden h-36 w-36 rounded-full bg-white/5 lg:block" />
      <div className="pointer-events-none absolute left-1/2 -bottom-4 hidden h-20 w-20 rounded-full bg-white/5 md:block" />

      <div className="relative z-10 px-3 pt-3 pb-3 sm:px-4 sm:pt-4 md:px-6 md:pt-5 md:pb-4">
        <p className="mb-0.5 text-[11px] font-semibold tracking-wide text-[#C5D8F7] sm:text-[12px]">
          👋 {greeting}
        </p>
        <h2 className="mb-1 text-base font-extrabold tracking-tight text-white sm:text-lg md:text-[20px]">
          Welcome back, {name}
        </h2>
        <p className="mb-3 text-[11px] text-[#C5D8F7] sm:mb-4 sm:text-[12px]">
          Here&apos;s your CRM snapshot for{' '}
          <span className="font-semibold text-white">{dateLabel}</span>
        </p>
        {/* <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {quickStats.map(({ label, value, icon: IconCmp }) => (
            <div
              key={label}
              className="flex items-center gap-1.5 rounded-lg bg-white/20 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm sm:gap-2 sm:rounded-xl sm:px-3 sm:py-1.5 sm:text-[12px]"
            >
              <IconCmp size={12} weight="duotone" />
              <span className="font-bold">{value}</span>
              <span className="hidden font-medium opacity-80 xs:inline">{label}</span>
            </div>
          ))}
        </div> */}
      </div>
    </div>
  )
}
