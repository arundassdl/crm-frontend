'use client'

import { Gear } from '@phosphor-icons/react'

/** Shared empty-state for settings sections that have no UI yet. */
export default function PlaceholderPanel({
  label,
  description = 'This section is coming soon.'
}: {
  label: string
  description?: string
}) {
  return (
    <div className="flex flex-1 items-center justify-center py-16">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EFF6FF] dark:bg-[#18181B]">
          <Gear size={22} weight="duotone" className="text-[#94A3B8] dark:text-[#9CA3AF]" />
        </div>
        <div className="text-[15px] font-bold text-slate-700 dark:text-[#D4D4D8]">{label}</div>
        <div className="mt-1 text-[12px] text-slate-400 dark:text-[#9CA3AF]">{description}</div>
      </div>
    </div>
  )
}
