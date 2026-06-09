'use client'

/**
 * Loads **`reports/ReportDetail`** for CRM `/reports/details/[name]` (Module Federation).
 */
import type { ComponentType } from 'react'
import ReportsRemoteUnavailable from '@/components/reports/ReportsRemoteUnavailable'
import {
  REPORTS_MF_DETAIL_EXPOSE_FALLBACKS,
  REPORTS_MF_REMOTE_NAME,
  REPORTS_MF_REPORT_DETAIL_MODULE,
} from '@/config/microfrontends/reports'
import { loadRemoteAsDefaultFromCandidates } from '@/lib/mf/mfHost'

function asDefault(
  C: ComponentType<Record<string, unknown>>
): { default: ComponentType<Record<string, unknown>> } {
  return { default: C }
}

function normalizeReportsModuleId(id: string): string {
  const t = id.trim()
  if (!t) return t
  if (t.startsWith(`${REPORTS_MF_REMOTE_NAME}/`)) return t
  return `${REPORTS_MF_REMOTE_NAME}/${t.replace(/^\//, '')}`
}

function resolveReportDetailCandidates(): string[] {
  const rawEnv = process.env.NEXT_PUBLIC_REPORTS_MF_DETAIL_MODULE?.trim()
  const envId = rawEnv ? normalizeReportsModuleId(rawEnv) : null
  const primary = REPORTS_MF_REPORT_DETAIL_MODULE
  const defaults = [primary, ...REPORTS_MF_DETAIL_EXPOSE_FALLBACKS]
  const ordered = envId ? [envId, ...defaults] : defaults
  return Array.from(new Set(ordered))
}

export async function loadReportsDetailModule(): Promise<{
  default: ComponentType<Record<string, unknown>>
}> {
  const candidates = resolveReportDetailCandidates()
  return loadRemoteAsDefaultFromCandidates(candidates)
    .catch((err) => {
      console.error(
        '[Reports MF] ReportDetail tried module ids (in order):',
        candidates.join(' → ')
      )
      throw err
    })
    .then((C) => asDefault(C))
}

export function loadReportsDetailModuleSafe(): Promise<{
  default: ComponentType<Record<string, unknown>>
}> {
  return loadReportsDetailModule().catch((err) => {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[Reports MF] ReportDetail load failed:', err)
    const Fallback = () => <ReportsRemoteUnavailable details={msg} />
    return asDefault(Fallback)
  })
}

export const reportsDetailDynamicOptions = {
  ssr: false as const,
  loading: () => <div style={{ padding: 20 }}>Loading report…</div>,
}
