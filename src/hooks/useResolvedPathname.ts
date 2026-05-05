'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useRouter as usePagesRouter } from 'next/compat/router'

/**
 * App Router `usePathname()` is often empty on first paint for `src/pages/**` (e.g. `/analytics/...`).
 * Combine with the Pages router and `location` so layout + nav match the real URL.
 */
export function useResolvedPathname(): string {
  const appPathname = usePathname() ?? ''
  const pagesRouter = usePagesRouter()
  const fromPages = pagesRouter
    ? (pagesRouter.asPath || '').split('?')[0] ||
      (pagesRouter.pathname as string) ||
      ''
    : ''
  const [locationPath] = useState(
    () => (typeof window !== 'undefined' ? window.location.pathname : '')
  )

  return appPathname || fromPages || locationPath
}
