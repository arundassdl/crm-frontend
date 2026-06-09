'use client'

/**
 * Loads the reports-app **listing** UI for CRM `/reports` (standalone equivalent: `{REPORTS_APP_URL}/listing`).
 */
import type { ComponentType } from 'react'
import ReportsRemoteUnavailable from '@/components/reports/ReportsRemoteUnavailable'
import { REPORTS_MF_DEFAULT_EXPOSE_ORDER, REPORTS_MF_REMOTE_NAME } from '@/config/microfrontends/reports'
import {
  loadRemoteAsDefaultFromCandidates,
} from '@/lib/mf/mfHost'

function asDefault(
  C: ComponentType<Record<string, unknown>>
): { default: ComponentType<Record<string, unknown>> } {
  return { default: C }
}

/** Turns `/listing`, `listing`, or `reports/listing` into a valid `loadRemote` id (`reports/…`). */
function normalizeReportsModuleId(id: string): string {
  const t = (id ?? '').trim()
  if (!t) return t
  if (t.startsWith(`${REPORTS_MF_REMOTE_NAME}/`)) return t
  return `${REPORTS_MF_REMOTE_NAME}/${t.replace(/^\//, '')}`
}

function resolveReportsModuleCandidates(): string[] {
  const rawEnv = process.env.NEXT_PUBLIC_REPORTS_MF_MODULE?.trim()
  const envId = rawEnv ? normalizeReportsModuleId(rawEnv) : null
  const defaults = [...REPORTS_MF_DEFAULT_EXPOSE_ORDER]
  const ordered = envId ? [envId, ...defaults] : defaults
  return Array.from(new Set(ordered))
}

export async function loadReportsRemoteModule(): Promise<{
  default: ComponentType<Record<string, unknown>>
}> {
  const candidates = resolveReportsModuleCandidates()
  return loadRemoteAsDefaultFromCandidates(candidates)
    .catch((err) => {
      console.error(
        '[Reports MF] Tried module ids (in order):',
        candidates.join(' → ')
      )
      throw err
    })
    .then((C) => asDefault(C))
}

export function loadReportsRemoteModuleSafe(): Promise<{
  default: ComponentType<Record<string, unknown>>
}> {
  return loadReportsRemoteModule().catch((err) => {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[Reports MF] remote module load failed:', err)
    const Fallback = () => <ReportsRemoteUnavailable details={msg} />
    return asDefault(Fallback)
  })
}

export const reportsRemoteDynamicOptions = {
  ssr: false as const,
  loading: () => <div style={{ padding: 20 }}>Loading reports…</div>,
}
