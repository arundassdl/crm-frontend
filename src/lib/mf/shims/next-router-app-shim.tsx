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

function syntheticFromApp(
  app: AppRouterInstance,
  pathname: string,
  searchParams: ReturnType<typeof useSearchParams>
): NextRouter {
  const query = searchParamsToQuery(searchParams)
  const asPath = (() => {
    const s = searchParams?.toString()
    return s ? `${pathname}?${s}` : pathname
  })()

  return {
    route: pathname,
    pathname,
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
      const href = typeof url === 'string' ? url : '/'
      app.push(href)
      return Promise.resolve(true)
    }) as NextRouter['push'],
    replace: ((url: unknown, _as?: unknown, _opts?: unknown) => {
      const href = typeof url === 'string' ? url : '/'
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
  const query = searchParamsToQuery(searchParams)
  const asPath = (() => {
    const s = searchParams?.toString()
    return s ? `${pathname}?${s}` : pathname
  })()

  return {
    route: pathname,
    pathname,
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
      if (typeof window !== 'undefined') window.location.assign(url)
      return Promise.resolve(true)
    },
    replace: (url: string) => {
      if (typeof window !== 'undefined') window.location.replace(url)
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
    if (typeof window !== 'undefined') {
      window.location.assign(url)
    }
    return Promise.resolve(true)
  },
  replace: (url: string) => {
    if (typeof window !== 'undefined') {
      window.location.replace(url)
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
