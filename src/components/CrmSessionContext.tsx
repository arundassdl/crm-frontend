'use client'

import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'

/** Non-secret facts from the signed CRM session, for navigation and the header (R56). */
export interface CrmSessionInfo {
  organization: string
  userId: string
}

const CrmSessionContext = createContext<CrmSessionInfo | null>(null)

export function CrmSessionProvider({ value, children }: { value: CrmSessionInfo | null; children: ReactNode }) {
  return <CrmSessionContext.Provider value={value}>{children}</CrmSessionContext.Provider>
}

/** The active CRM session, or null on legacy (non-launch) sessions. */
export function useCrmSession(): CrmSessionInfo | null {
  return useContext(CrmSessionContext)
}

/** Home of the CRM for the active organization. */
export function orgHomeHref(session: CrmSessionInfo | null): string {
  return session?.organization ? `/org/${encodeURIComponent(session.organization)}` : '/'
}
