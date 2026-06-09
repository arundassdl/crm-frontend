'use client'

/**
 * Drop-in for `next/router` when aliased in webpack so code (including Module Federation
 * remotes) does not call the real `useRouter()` from `next/router`, which throws
 * "NextRouter was not mounted" outside the Pages `RouterContext`.
 *
 * Resolution order:
 * 1. Pages `RouterContext` (real `NextRouter`) when present — e.g. `src/pages/**`.
 * 2. App `AppRouterContext` — build a `NextRouter`-shaped object from the App Router instance.
 * 3. Fallback — `window.location` + pathname/search from `next/navigation` contexts.
 *
 * @see https://nextjs.org/docs/messages/next-router-not-mounted
 */
import * as React from 'react'
import { useMemo } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { RouterContext } from 'next/dist/shared/lib/router-context.shared-runtime'
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import type { NextRouter } from 'next/dist/shared/lib/router/router'
import type { SingletonRouter } from 'next/dist/client/router'
import { REPORTS_DETAIL_HREF_PREFIX, REPORTS_EDIT_HREF_PREFIX, REPORTS_LIST_HREF } from '@/lib/reports/reportRoutes'

const eventsStub: NextRouter['events'] = {
  on: () => () => undefined,
  off: () => {},
  emit: () => true,
} as NextRouter['events']

function searchParamsToQuery(
  searchParams: ReturnType<typeof useSearchParams>
): Record<string, string | string[] | undefined> {
  const q: Record<string, string | string[] | undefined> = {}
  if (!searchParams) return q
  searchParams.forEach((v, k) => {
    const prev = q[k]
    if (prev === undefined) {
      q[k] = v
    } else if (Array.isArray(prev)) {
      prev.push(v)
    } else {
      q[k] = [prev, v]
    }
  })
  return q
}

/** Rewrites standalone reports-app paths used inside federated bundles to CRM-owned routes. */
function rewriteReportsRemoteNavigationHref(href: string): string {
  const cut = href.search(/[?#]/)
  const pathPart = cut === -1 ? href : href.slice(0, cut)
  const rest = cut === -1 ? '' : href.slice(cut)

  const detailMatch = pathPart.match(/^\/details\/([^/]+)\/?$/)
  if (detailMatch) {
    return `${REPORTS_DETAIL_HREF_PREFIX}/${detailMatch[1]}${rest}`
  }

  const editMatch = pathPart.match(/^\/edit\/([^/]+)\/?$/)
  if (editMatch) {
    return `${REPORTS_EDIT_HREF_PREFIX}/${editMatch[1]}${rest}`
  }

  if (pathPart === '/listing' || pathPart === '/listing/') {
    return `${REPORTS_LIST_HREF}${rest}`
  }

  return href
}

/**
 * Presents CRM-owned report URLs to federated remotes as standalone-app paths + query keys
 * (`/edit/:id`, `/details/:name`, `/listing`) so Pages-router reads inside remotes still resolve.
 */
function normalizeReportsRemoteRouterState(
  pathname: string,
  searchParams: ReturnType<typeof useSearchParams>
): { pathname: string; query: Record<string, string | string[] | undefined> } {
  const query = searchParamsToQuery(searchParams)

  const editMatch = pathname.match(/^\/reports\/edit\/([^/]+)\/?$/)
  if (editMatch) {
    return {
      pathname: `/edit/${editMatch[1]}`,
      query: { ...query, id: editMatch[1] },
    }
  }

  const detailMatch = pathname.match(/^\/reports\/details\/([^/]+)\/?$/)
  if (detailMatch) {
    return {
      pathname: `/details/${detailMatch[1]}`,
      query: { ...query, name: detailMatch[1] },
    }
  }

  if (pathname === '/reports' || pathname === '/reports/') {
    return { pathname: '/listing', query }
  }

  return { pathname, query }
}

function syntheticFromApp(
  app: AppRouterInstance,
  pathname: string,
  searchParams: ReturnType<typeof useSearchParams>
): NextRouter {
  const normalized = normalizeReportsRemoteRouterState(pathname, searchParams)
  const query = normalized.query
  const asPath = (() => {
    const s = searchParams?.toString()
    return s ? `${normalized.pathname}?${s}` : normalized.pathname
  })()

  return {
    route: normalized.pathname,
    pathname: normalized.pathname,
    query,
    asPath,
    isFallback: false,
    isReady: true,
    basePath: '',
    locale: undefined,
    locales: undefined,
    defaultLocale: undefined,
    isLocaleDomain: false,
    isPreview: false,
    domainLocales: undefined,
    events: eventsStub,
    push: ((url: unknown, _as?: unknown, _opts?: unknown) => {
      const href =
        typeof url === 'string' ? rewriteReportsRemoteNavigationHref(url) : '/'
      app.push(href)
      return Promise.resolve(true)
    }) as NextRouter['push'],
    replace: ((url: unknown, _as?: unknown, _opts?: unknown) => {
      const href =
        typeof url === 'string' ? rewriteReportsRemoteNavigationHref(url) : '/'
      app.replace(href)
      return Promise.resolve(true)
    }) as NextRouter['replace'],
    reload: app.refresh,
    back: app.back,
    forward: app.forward,
    prefetch: app.prefetch
      ? (href) => {
          void app.prefetch(href)
        }
      : () => undefined,
    beforePopState: () => {},
  } as unknown as NextRouter
}

function syntheticFromWindow(
  pathname: string,
  searchParams: ReturnType<typeof useSearchParams>
): NextRouter {
  const normalized = normalizeReportsRemoteRouterState(pathname, searchParams)
  const query = normalized.query
  const asPath = (() => {
    const s = searchParams?.toString()
    return s ? `${normalized.pathname}?${s}` : normalized.pathname
  })()

  return {
    route: normalized.pathname,
    pathname: normalized.pathname,
    query,
    asPath,
    isFallback: false,
    isReady: true,
    basePath: '',
    locale: undefined,
    locales: undefined,
    defaultLocale: undefined,
    isLocaleDomain: false,
    isPreview: false,
    domainLocales: undefined,
    events: eventsStub,
    push: (url: string) => {
      const href = rewriteReportsRemoteNavigationHref(url)
      if (typeof window !== 'undefined') window.location.assign(href)
      return Promise.resolve(true)
    },
    replace: (url: string) => {
      const href = rewriteReportsRemoteNavigationHref(url)
      if (typeof window !== 'undefined') window.location.replace(href)
      return Promise.resolve(true)
    },
    reload: () => {
      if (typeof window !== 'undefined') window.location.reload()
    },
    back: () => {
      if (typeof window !== 'undefined') window.history.back()
    },
    forward: () => {
      if (typeof window !== 'undefined') window.history.forward()
    },
    prefetch: async () => undefined,
    beforePopState: () => {},
  } as unknown as NextRouter
}

export function useRouter(): NextRouter {
  const pagesRouter = React.useContext(RouterContext)
  const appRouter = React.useContext(AppRouterContext)
  const pathname = usePathname() ?? '/'
  const searchParams = useSearchParams()

  return useMemo(() => {
    if (pagesRouter) {
      return pagesRouter
    }
    if (appRouter) {
      return syntheticFromApp(appRouter, pathname, searchParams)
    }
    return syntheticFromWindow(pathname, searchParams)
  }, [pagesRouter, appRouter, pathname, searchParams])
}

type WithR = { router: NextRouter }

export function withRouter<P extends WithR>(
  Com: React.ComponentType<P>
): React.FC<Omit<P, 'router'>> {
  return function WithRouterComponent(props: Omit<P, 'router'>) {
    const router = useRouter()
    return <Com {...(props as P)} router={router} />
  }
}

// Default export: Pages "singleton" shape; some code uses `import Router from 'next/router'`
// eslint-disable-next-line import/no-default-export
const RouterDefault = {
  get router() {
    return null
  },
  ready: (cb: () => void) => {
    cb()
  },
  get readyCallbacks() {
    return [] as Array<() => void>
  },
  get events() {
    return eventsStub
  },
  push: (url: string) => {
    const href = rewriteReportsRemoteNavigationHref(url)
    if (typeof window !== 'undefined') {
      window.location.assign(href)
    }
    return Promise.resolve(true)
  },
  replace: (url: string) => {
    const href = rewriteReportsRemoteNavigationHref(url)
    if (typeof window !== 'undefined') {
      window.location.replace(href)
    }
    return Promise.resolve(true)
  },
  prefetch: async () => undefined,
} as unknown as SingletonRouter

export default RouterDefault

export const Router = RouterDefault

export function createRouter(): null {
  return null
}

export function makePublicRouterInstance(): typeof RouterDefault {
  return RouterDefault
}
