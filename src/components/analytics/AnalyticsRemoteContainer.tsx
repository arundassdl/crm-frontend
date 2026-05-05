'use client'

import {
  type MouseEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
} from 'react'
import { useRouter } from 'next/compat/router'

/**
 * Maps remote standalone paths (`/dashboard`, `/dashboard/create`) to CRM host routes.
 */
export function mapRemoteDashboardPathToHost(pathname: string, search: string, hash: string): string {
  if (pathname === '/dashboard' || pathname === '/dashboard/') {
    return `/analytics/dashboard${search}${hash}`
  }
  if (pathname.startsWith('/dashboard/')) {
    return `/analytics/dashboard${pathname.slice('/dashboard'.length)}${search}${hash}`
  }
  return `${pathname}${search}${hash}`
}

type Props = { children: ReactNode }

/**
 * Isolated surface for the federated bundle: stable layout + click capture so internal
 * `<a href>` client navigation uses the Pages router when present (`next/compat/router`);
 * if there is no Pages context (e.g. mixed App + Pages), falls back to a full location assign.
 */
export function AnalyticsRemoteContainer({ children }: Props) {
  const router = useRouter()
  const ref = useRef<HTMLDivElement>(null)

  const onClickCapture = useCallback(
    (e: MouseEvent) => {
      if (e.defaultPrevented) return
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const root = ref.current
      if (!root) return
      const el = e.target
      if (!(el instanceof Element)) return
      const a = el.closest('a[href]') as HTMLAnchorElement | null
      if (!a || !root.contains(a)) return
      if (a.target && a.target !== '_self') return
      if (a.hasAttribute('download')) return
      const raw = a.getAttribute('href')
      if (!raw || raw.startsWith('javascript:')) return
      if (raw.startsWith('mailto:') || raw.startsWith('tel:')) return

      let url: URL
      try {
        url = new URL(raw, window.location.origin)
      } catch {
        return
      }
      if (url.origin !== window.location.origin) return

      const { pathname, search, hash } = url
      const full = `${pathname}${search}${hash}`

      const go = (href: string) => {
        if (router) {
          void router.push(href)
        } else {
          window.location.assign(href)
        }
      }

      if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
        e.preventDefault()
        e.stopPropagation()
        go(mapRemoteDashboardPathToHost(pathname, search, hash))
        return
      }

      if (pathname.startsWith('/analytics/')) {
        e.preventDefault()
        e.stopPropagation()
        go(full)
        return
      }
    },
    [router]
  )

  useEffect(() => {
    const node = ref.current
    if (!node) return
    node.addEventListener('click', onClickCapture as unknown as EventListener, true)
    return () =>
      node.removeEventListener('click', onClickCapture as unknown as EventListener, true)
  }, [onClickCapture])

  return (
    <div
      id="analytics-container"
      ref={ref}
      className="analytics-mf-remote-surface"
      data-mf-remote-surface
    >
      {children}
    </div>
  )
}
