'use client'

import { type ReactNode } from 'react'
import '@/styles/analytics-mf.css'

type Props = {
  children: ReactNode
  /** If you already provide `id=analytics-root` in a parent, set false to avoid duplicate ids */
  withRootId?: boolean
  /**
   * - `flow` (default): normal wrapper.
   * - `contents`: `display: contents` so the remote’s top-level node participates in parent flex/grid
   *   (reduces extra offset / layout shift under the host shell).
   */
  wrapperMode?: 'flow' | 'contents'
}

/**
 * Mount for federated analytics UI. **Host owns** VerticalLayout + Navbar + Sidebar.
 * Does not load remote global CSS — theme and global styles stay with the main app.
 */
export function AnalyticsFederationRoot({
  children,
  withRootId = true,
  wrapperMode = 'contents',
}: Props) {
  return (
    <div
      {...(withRootId ? { id: 'analytics-root' } : {})}
      data-mf-host="crm"
      data-mf-remote="analytics"
      data-mf-wrapper={wrapperMode}
    >
      {children}
    </div>
  )
}
