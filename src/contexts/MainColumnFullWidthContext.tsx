'use client'

import { createContext, useContext, type ReactNode } from 'react'

/**
 * When true, vertical `LayoutContent` disables compact max-width on `<main>` for this subtree.
 * Used by `AnalyticsPagesAppShell` so `/analytics/*` (Pages Router + MF) matches full-width host chrome
 * even when `useResolvedPathname()` is empty during SSR / first paint.
 */
const MainColumnFullWidthContext = createContext(false)

export function MainColumnFullWidthProvider({
  children,
  value = true,
}: {
  children: ReactNode
  value?: boolean
}) {
  return (
    <MainColumnFullWidthContext.Provider value={value}>
      {children}
    </MainColumnFullWidthContext.Provider>
  )
}

export function useMainColumnFullWidth(): boolean {
  return useContext(MainColumnFullWidthContext)
}
