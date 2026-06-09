'use client'

/**
 * Loads **`reports/ReportBuilder`** for CRM **`/reports/create`** (Module Federation).
 */
import type { ComponentType } from 'react'
import ReportsRemoteUnavailable from '@/components/reports/ReportsRemoteUnavailable'
import {
  REPORTS_MF_BUILDER_EXPOSE_FALLBACKS,
  REPORTS_MF_REMOTE_NAME,
  REPORTS_MF_REPORT_BUILDER_MODULE,
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

function resolveReportBuilderCandidates(): string[] {
  const rawEnv = process.env.NEXT_PUBLIC_REPORTS_MF_BUILDER_MODULE?.trim()
  const envId = rawEnv ? normalizeReportsModuleId(rawEnv) : null
  const primary = REPORTS_MF_REPORT_BUILDER_MODULE
  const defaults = [primary, ...REPORTS_MF_BUILDER_EXPOSE_FALLBACKS]
  const ordered = envId ? [envId, ...defaults] : defaults
  return Array.from(new Set(ordered))
}

export async function loadReportsBuilderModule(): Promise<{
  default: ComponentType<Record<string, unknown>>
}> {
  const candidates = resolveReportBuilderCandidates()
  return loadRemoteAsDefaultFromCandidates(candidates)
    .catch((err) => {
      console.error(
        '[Reports MF] ReportBuilder tried module ids (in order):',
        candidates.join(' → ')
      )
      throw err
    })
    .then((C) => asDefault(C))
}

export function loadReportsBuilderModuleSafe(): Promise<{
  default: ComponentType<Record<string, unknown>>
}> {
  return loadReportsBuilderModule().catch((err) => {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[Reports MF] ReportBuilder load failed:', err)
    const Fallback = () => <ReportsRemoteUnavailable details={msg} />
    return asDefault(Fallback)
  })
}

export const reportsBuilderDynamicOptions = {
  ssr: false as const,
  loading: () => <div style={{ padding: 20 }}>Loading report builder…</div>,
}
