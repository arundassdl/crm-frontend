/**
 * Host MF — **runtime only** (no webpack `ModuleFederationPlugin` on this app):
 * App Router + federated `shared` react/react-dom breaks `React.use` / hydration. Remotes load via
 * `init` + `loadRemote` here; the shell uses normal Next `react` / `react-dom`.
 *
 * - `entry` = `ANALYTICS_APP_URL` + default path (+ optional `?v=` cache-bust). Override with
 *   `NEXT_PUBLIC_ANALYTICS_MF_ENTRY`.
 * - Remote app must use MF `name: 'analytics'` (see `ANALYTICS_MF_REMOTE_NAME`).
 *
 * **Runtime `shared` (host + remote should align; singleton + `requiredVersion: false` recommended):**
 * `react`, `react-dom`, `@mui/material`, `@emotion/react`, `@emotion/styled`.
 * The **host** also lists `next/router` with a **shim** so the remote does not use the real
 * `useRouter` when the Pages `RouterContext` is missing; match that in the remote’s MF `shared` if
 * the remote imports `next/router`.
 *
 * Remotes register **lazily**: visiting `/reports` only loads the reports `remoteEntry`; analytics (:3001)
 * does not need to be running.
 * In DevTools → Network, filter by the analytics origin (e.g. `:3001`) and confirm:
 * - `remoteEntry.js` 200, then `*.css` and/or `*.js` chunk requests from the same host.
 * If CSS is missing, check the remote’s `output.publicPath`, CORS for cross-origin `link` requests, and that
 * `mini-css-extract-plugin` (or style-loader in dev) is not disabled. The **host** does not import the
 * remote’s CSS file directly; it must load with the remote container.
 *
 * **Wrong baked publicPath:** Chunks may target the CRM origin instead of the remote; the host
 * rewrites `script`/`link` URLs per registered `remoteEntry` (see `registerMfRemoteChunkRewriteFromEntryUrl`).
 */
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import * as mui from '@mui/material'
import * as emotionReact from '@emotion/react'
import * as emotionStyled from '@emotion/styled'
import { init, loadRemote, registerRemotes } from '@module-federation/runtime'
import type { ComponentType } from 'react'
import { ANALYTICS_REMOTE_DEFAULT_ENTRY_PATH, ANALYTICS_APP_URL_PUBLIC_HOST_DEFAULT } from '@/config/microfrontends/analytics'
import {
  REPORTS_APP_URL_PUBLIC_HOST_DEFAULT,
  REPORTS_MF_REMOTE_NAME,
  REPORTS_REMOTE_DEFAULT_ENTRY_PATH,
} from '@/config/microfrontends/reports'
import { CONSTANTS } from '@/services/config/app-config'

export const REACT_VERSION = '18.3.1'

/** Align with `package.json` for Module Federation `shared` semver. */
const NEXT_ROUTER_SHARED_VERSION = '14.2.5'
const MUI_MATERIAL_VERSION = '5.16.4'
const EMOTION_VERSION = '11.11.4'

let sessionCacheBust: string | null = null
let mfShellPromise: Promise<void> | null = null
let loggedAnalyticsEntryUrl: string | null = null
let loggedReportsEntryUrl: string | null = null

function getSessionCacheBust(): string {
  if (sessionCacheBust) return sessionCacheBust
  if (process.env.NEXT_PUBLIC_ANALYTICS_MF_CACHE_BUST) {
    sessionCacheBust = process.env.NEXT_PUBLIC_ANALYTICS_MF_CACHE_BUST
  } else if (process.env.NEXT_PUBLIC_REPORTS_MF_CACHE_BUST) {
    sessionCacheBust = process.env.NEXT_PUBLIC_REPORTS_MF_CACHE_BUST
  } else if (process.env.NODE_ENV === 'development') {
    sessionCacheBust = String(Date.now())
  } else {
    sessionCacheBust =
      process.env.NEXT_PUBLIC_ANALYTICS_MF_BUILD_BUST ??
      process.env.NEXT_PUBLIC_REPORTS_MF_BUILD_BUST ??
      ''
  }
  return sessionCacheBust
}

export function withRemoteEntryCacheBust(url: string, cacheBust: string): string {
  if (!cacheBust) return url
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}v=${encodeURIComponent(cacheBust)}`
}

/**
 * Dev builds default `REPORTS_APP_URL` to localhost. If the user opens CRM on a real host (e.g.
 * crm.socialdnalabs.com), loading `remoteEntry` from loopback always fails — use the public
 * reports deploy URL instead unless `NEXT_PUBLIC_REPORTS_APP_URL` / entry is a non-loopback URL.
 */
function coerceReportsRemoteBaseForBrowser(origin: string): string {
  if (typeof window === 'undefined') return origin
  const pageOnLoopback =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  if (pageOnLoopback) return origin
  const t = origin.trim()
  if (!t) return origin
  try {
    const u = new URL(t, `${window.location.protocol}//${window.location.host}`)
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
      return REPORTS_APP_URL_PUBLIC_HOST_DEFAULT
    }
  } catch {
    /* ignore */
  }
  return origin
}

/** Rewrite a fully-resolved `remoteEntry` URL if it still targets loopback while the CRM tab does not. */
function coerceReportsRemoteEntryUrlForBrowser(entryUrl: string): string {
  if (typeof window === 'undefined') return entryUrl
  if (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  ) {
    return entryUrl
  }
  try {
    const u = new URL(entryUrl)
    if (u.hostname !== 'localhost' && u.hostname !== '127.0.0.1') return entryUrl
    const publicBase = REPORTS_APP_URL_PUBLIC_HOST_DEFAULT.replace(/\/$/, '')
    return `${publicBase}${REPORTS_REMOTE_DEFAULT_ENTRY_PATH}${u.search}${u.hash}`
  } catch {
    return entryUrl
  }
}

/**
 * Dev builds default `ANALYTICS_APP_URL` to localhost. If CRM is opened on a real host, use the
 * public analytics deploy base unless env already points at a non-loopback URL.
 */
function coerceAnalyticsRemoteBaseForBrowser(origin: string): string {
  if (typeof window === 'undefined') return origin
  const pageOnLoopback =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  if (pageOnLoopback) return origin
  const t = origin.trim()
  if (!t) return origin
  try {
    const u = new URL(t, `${window.location.protocol}//${window.location.host}`)
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
      return ANALYTICS_APP_URL_PUBLIC_HOST_DEFAULT
    }
  } catch {
    /* ignore */
  }
  return origin
}

/** Rewrite a fully-resolved analytics `remoteEntry` URL if it still targets loopback on a public tab. */
function coerceAnalyticsRemoteEntryUrlForBrowser(entryUrl: string): string {
  if (typeof window === 'undefined') return entryUrl
  if (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  ) {
    return entryUrl
  }
  try {
    const u = new URL(entryUrl)
    if (u.hostname !== 'localhost' && u.hostname !== '127.0.0.1') return entryUrl
    const publicBase = ANALYTICS_APP_URL_PUBLIC_HOST_DEFAULT.replace(/\/$/, '')
    return `${publicBase}${ANALYTICS_REMOTE_DEFAULT_ENTRY_PATH}${u.search}${u.hash}`
  } catch {
    return entryUrl
  }
}

type MfChunkRewriteRule = { remoteOrigin: string; pathPrefix: string }

const mfChunkRewriteRules: MfChunkRewriteRule[] = []
let mfChunkUrlRewriteInstalled = false

/** Path prefix for MF static assets, e.g. `/analytics/_next/`, from `remoteEntry` pathname. */
function mfNextAssetPrefixFromEntryUrl(entryUrl: string): string {
  try {
    const p = new URL(entryUrl).pathname.split('?')[0]
    const i = p.indexOf('/_next/static/')
    if (i < 0) return '/_next/'
    const base = p.slice(0, i)
    return `${base}/_next/`
  } catch {
    return '/_next/'
  }
}

/**
 * When `remoteEntry` is on host A but chunk URLs use the CRM tab origin (host B) with the same
 * `…/_next/static/…` path, rewrite tag URLs to host A.
 *
 * **`@module-federation/runtime`** may load exposes via **`fetch`**, **dynamic `import()`**, or **`script`**
 * injection. We patch **`fetch`**, **`XMLHttpRequest.open`**, **`appendChild` / `insertBefore`**, and watch
 * **`script[src]`** with **`MutationObserver`** so same-origin URLs under the remote’s Next prefix
 * (e.g. `/reports/_next/` on tab **`localhost:3000`**) are rewritten to the remote origin (**`:3002`**).
 */
function registerMfRemoteChunkRewriteFromEntryUrl(entryUrl: string): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') return
  let remoteOrigin: string
  let pathPrefix: string
  try {
    remoteOrigin = new URL(entryUrl).origin
    pathPrefix = mfNextAssetPrefixFromEntryUrl(entryUrl)
  } catch {
    return
  }
  if (remoteOrigin === window.location.origin) return

  const dup = mfChunkRewriteRules.some(
    (r) => r.remoteOrigin === remoteOrigin && r.pathPrefix === pathPrefix
  )
  if (!dup) mfChunkRewriteRules.push({ remoteOrigin, pathPrefix })

  if (mfChunkUrlRewriteInstalled) return
  mfChunkUrlRewriteInstalled = true

  const rewrite = (url: string): string => {
    try {
      const parsed = new URL(url, window.location.href)
      if (parsed.origin !== window.location.origin) return url
      for (const { remoteOrigin: ro, pathPrefix: pp } of mfChunkRewriteRules) {
        if (ro === window.location.origin) continue
        if (!parsed.pathname.startsWith(pp)) continue
        return `${ro}${parsed.pathname}${parsed.search}${parsed.hash}`
      }
    } catch {
      /* ignore */
    }
    return url
  }

  const patchUrlProp = (
    Ctor: typeof HTMLScriptElement | typeof HTMLLinkElement,
    prop: 'src' | 'href'
  ) => {
    const proto = Ctor.prototype as unknown as Record<string, unknown>
    const desc = Object.getOwnPropertyDescriptor(proto, prop)
    if (!desc?.set || !desc.get) return
    Object.defineProperty(proto, prop, {
      configurable: true,
      enumerable: desc.enumerable,
      get: desc.get,
      set(value: string) {
        desc.set!.call(this, typeof value === 'string' ? rewrite(value) : value)
      },
    })
  }

  patchUrlProp(HTMLScriptElement, 'src')
  patchUrlProp(HTMLLinkElement, 'href')

  const origSetAttribute = Element.prototype.setAttribute
  Element.prototype.setAttribute = function (name: string, value: string) {
    if (typeof value === 'string') {
      if (this instanceof HTMLScriptElement && name.toLowerCase() === 'src') {
        return origSetAttribute.call(this, name, rewrite(value))
      }
      if (this instanceof HTMLLinkElement && name.toLowerCase() === 'href') {
        return origSetAttribute.call(this, name, rewrite(value))
      }
    }
    return origSetAttribute.call(this, name, value)
  }

  const origFetch = window.fetch.bind(window)
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      if (typeof input === 'string') {
        return origFetch(rewrite(input), init)
      }
      if (input instanceof URL) {
        const href = rewrite(input.href)
        return href === input.href ? origFetch(input, init) : origFetch(href, init)
      }
      if (input instanceof Request) {
        const href = rewrite(input.url)
        return href === input.url
          ? origFetch(input, init)
          : origFetch(new Request(href, input), init)
      }
    } catch {
      /* fall through */
    }
    return origFetch(input as RequestInfo, init)
  }

  const origXhrOpen = XMLHttpRequest.prototype.open
  XMLHttpRequest.prototype.open = function (
    this: XMLHttpRequest,
    ...openArgs: Parameters<XMLHttpRequest['open']>
  ) {
    const [method, url, ...tail] = openArgs
    const resolved =
      typeof url === 'string' ? rewrite(url) : rewrite(url.href)
    return origXhrOpen.apply(this, [method, resolved, ...tail] as Parameters<
      typeof origXhrOpen
    >)
  } as typeof XMLHttpRequest.prototype.open

  const maybeRewriteFederatedScript = (node: Node): void => {
    if (!(node instanceof HTMLScriptElement)) return
    try {
      const raw =
        node.getAttribute('src') ||
        (node.src && node.src.startsWith('http') ? node.src : '')
      if (!raw) return
      const abs = new URL(raw, window.location.href).href
      const next = rewrite(abs)
      if (next !== abs) {
        node.src = next
      }
    } catch {
      /* ignore */
    }
  }

  const origAppendChild = Node.prototype.appendChild
  Node.prototype.appendChild = function <T extends Node>(child: T): T {
    const out = origAppendChild.call(this, child) as T
    maybeRewriteFederatedScript(child)
    if (child instanceof Element) {
      for (const s of Array.from(child.querySelectorAll?.('script[src]') ?? [])) {
        maybeRewriteFederatedScript(s)
      }
    }
    return out
  }

  const origInsertBefore = Node.prototype.insertBefore
  Node.prototype.insertBefore = function <T extends Node>(
    newChild: T,
    refChild: Node | null
  ): T {
    const out = origInsertBefore.call(this, newChild, refChild) as T
    maybeRewriteFederatedScript(newChild)
    if (newChild instanceof Element) {
      for (const s of Array.from(newChild.querySelectorAll?.('script[src]') ?? [])) {
        maybeRewriteFederatedScript(s)
      }
    }
    return out
  }

  const mfScriptSrcObserver = new MutationObserver((records) => {
    for (const r of records) {
      if (r.type === 'childList') {
        for (const n of Array.from(r.addedNodes)) {
          maybeRewriteFederatedScript(n)
          if (n instanceof Element) {
            for (const s of Array.from(n.querySelectorAll?.('script[src]') ?? [])) {
              maybeRewriteFederatedScript(s)
            }
          }
        }
      }
      if (
        r.type === 'attributes' &&
        r.attributeName === 'src' &&
        r.target instanceof HTMLScriptElement
      ) {
        maybeRewriteFederatedScript(r.target)
      }
    }
  })
  mfScriptSrcObserver.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['src'],
  })
}

export function getRemoteEntryUrl(origin: string, cacheBust: string): string {
  const base = origin.replace(/\/$/, '')
  const override = process.env.NEXT_PUBLIC_ANALYTICS_MF_ENTRY
  let url: string
  if (override) {
    url = override.startsWith('http')
      ? override
      : `${base}${override.startsWith('/') ? '' : '/'}${override}`
  } else {
    url = `${base}${ANALYTICS_REMOTE_DEFAULT_ENTRY_PATH}`
  }
  return withRemoteEntryCacheBust(url, cacheBust)
}

/**
 * Exact `remoteEntry` URL used by `init` (same as dev console log). Call from DevTools: copy/paste into the address bar or compare to Network.
 * Default base + path → `http://localhost:3001/_next/static/chunks/remoteEntry.js` (plus `?v=` in dev, unless `NEXT_PUBLIC_ANALYTICS_*` override).
 */
export function getResolvedAnalyticsRemoteEntryUrl(): string {
  let origin =
    process.env.NEXT_PUBLIC_ANALYTICS_APP_URL ?? CONSTANTS.ANALYTICS_APP_URL
  origin = coerceAnalyticsRemoteBaseForBrowser(origin)
  if (!origin?.trim()) {
    throw new Error(
      'ANALYTICS_APP_URL is missing: set NEXT_PUBLIC_ANALYTICS_APP_URL or CONSTANTS.ANALYTICS_APP_URL in app-config.'
    )
  }
  return coerceAnalyticsRemoteEntryUrlForBrowser(
    getRemoteEntryUrl(origin, getSessionCacheBust())
  )
}

/**
 * Reports remote `remoteEntry` URL (same cache-bust helper as analytics).
 * Default → `http://localhost:3002/reports/_next/static/chunks/remoteEntry.js` (+ `?v=` in dev).
 */
export function getResolvedReportsRemoteEntryUrl(): string {
  let origin =
    process.env.NEXT_PUBLIC_REPORTS_APP_URL ?? CONSTANTS.REPORTS_APP_URL ?? ''
  origin = coerceReportsRemoteBaseForBrowser(origin)
  if (!origin) {
    throw new Error(
      'REPORTS_APP_URL is missing: set NEXT_PUBLIC_REPORTS_APP_URL or CONSTANTS.REPORTS_APP_URL in app-config.'
    )
  }
  const base = origin.replace(/\/$/, '')
  const override = process.env.NEXT_PUBLIC_REPORTS_MF_ENTRY
  let url: string
  if (override) {
    url = override.startsWith('http')
      ? override
      : `${base}${override.startsWith('/') ? '' : '/'}${override}`
  } else {
    url = `${base}${REPORTS_REMOTE_DEFAULT_ENTRY_PATH}`
  }
  return coerceReportsRemoteEntryUrlForBrowser(
    withRemoteEntryCacheBust(url, getSessionCacheBust())
  )
}

function buildMfSharedConfig(): Record<string, unknown> {
  return {
    react: {
      version: REACT_VERSION,
      get: () => () => React,
      shareConfig: {
        singleton: true,
        requiredVersion: false,
      },
    },
    'react-dom': {
      version: REACT_VERSION,
      get: () => () => ReactDOM,
      shareConfig: {
        singleton: true,
        requiredVersion: false,
      },
    },
    /**
     * So federated **analytics** chunks can resolve `next/router` to the same shim as
     * `next.config.js` (App Router + Pages) instead of the real `useRouter` (throws
     * “NextRouter was not mounted” when the Pages context is absent).
     * The **remote app** must list `'next/router'` in its ModuleFederation `shared` too,
     * or it will still bundle a copy of the real module and the error will persist.
     */
    'next/router': {
      version: NEXT_ROUTER_SHARED_VERSION,
      get: () => () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        return require('./shims/next-router-app-shim') as typeof import('./shims/next-router-app-shim')
      },
      shareConfig: {
        singleton: true,
        requiredVersion: false,
      },
    },
    '@mui/material': {
      version: MUI_MATERIAL_VERSION,
      get: () => () => mui,
      shareConfig: {
        singleton: true,
        requiredVersion: false,
      },
    },
    '@emotion/react': {
      version: EMOTION_VERSION,
      get: () => () => emotionReact,
      shareConfig: {
        singleton: true,
        requiredVersion: false,
      },
    },
    '@emotion/styled': {
      version: EMOTION_VERSION,
      get: () => () => emotionStyled,
      shareConfig: {
        singleton: true,
        requiredVersion: false,
      },
    },
  }
}

/**
 * One-time MF host shell (`shared` only). Remotes are **not** bundled here — each addon registers its own
 * `remoteEntry` via {@link registerRemotes}. That way `/reports` (:3002) works even when analytics (:3001) is down.
 */
function ensureCrmMfShellInitialized(): Promise<void> {
  if (!mfShellPromise) {
    mfShellPromise = Promise.resolve().then(() => {
      init({
        name: 'crm',
        remotes: [],
        shared: buildMfSharedConfig() as Parameters<typeof init>[0]['shared'],
      })
    })
  }
  return mfShellPromise
}

function registerAnalyticsRemote(): void {
  const analyticsRemoteName =
    process.env.NEXT_PUBLIC_ANALYTICS_MF_REMOTE_NAME ??
    CONSTANTS.ANALYTICS_MF_REMOTE_NAME
  registerRemotes([
    {
      name: analyticsRemoteName,
      entry: getResolvedAnalyticsRemoteEntryUrl(),
    },
  ])
}

function registerReportsRemote(): void {
  const reportsRemoteName =
    process.env.NEXT_PUBLIC_REPORTS_MF_REMOTE_NAME ?? CONSTANTS.REPORTS_MF_REMOTE_NAME
  registerRemotes([
    {
      name: reportsRemoteName,
      entry: getResolvedReportsRemoteEntryUrl(),
    },
  ])
}

/** Registers both remotes (unknown `moduleId` prefix). */
async function ensureBothFederatedAddonsRegistered(): Promise<void> {
  await ensureCrmMfShellInitialized()
  registerAnalyticsRemote()
  registerReportsRemote()
}

/**
 * Lazy-register analytics `remoteEntry` + MF shell. Does **not** require reports (:3002).
 */
export async function ensureAnalyticsHostInitialized(): Promise<void> {
  const entry = getResolvedAnalyticsRemoteEntryUrl()
  registerMfRemoteChunkRewriteFromEntryUrl(entry)
  const remoteName =
    process.env.NEXT_PUBLIC_ANALYTICS_MF_REMOTE_NAME ?? CONSTANTS.ANALYTICS_MF_REMOTE_NAME
  if (
    process.env.NODE_ENV === 'development' &&
    loggedAnalyticsEntryUrl !== entry &&
    typeof console !== 'undefined'
  ) {
    console.info(
      '[Module Federation] analytics remoteEntry (open in browser to verify 200 + CSS chunks on same host):\n',
      entry
    )
    loggedAnalyticsEntryUrl = entry
  }
  await ensureCrmMfShellInitialized()
  registerAnalyticsRemote()
}

/** Lazy-register reports `remoteEntry`. Does **not** require analytics (:3001). */
export async function ensureReportsHostInitialized(): Promise<void> {
  const entry = getResolvedReportsRemoteEntryUrl()
  registerMfRemoteChunkRewriteFromEntryUrl(entry)
  if (
    process.env.NODE_ENV === 'development' &&
    loggedReportsEntryUrl !== entry &&
    typeof console !== 'undefined'
  ) {
    console.info(
      '[Module Federation] reports remoteEntry (verify 200 + chunks from reports origin):\n',
      entry
    )
    loggedReportsEntryUrl = entry
  }
  await ensureCrmMfShellInitialized()
  registerReportsRemote()
}

export function resolveComponent(
  loaded: unknown
): ComponentType<Record<string, unknown>> {
  if (typeof loaded === 'function') {
    return loaded as ComponentType<Record<string, unknown>>
  }
  if (
    loaded &&
    typeof loaded === 'object' &&
    'default' in loaded &&
    typeof (loaded as { default: unknown }).default === 'function'
  ) {
    return (loaded as { default: ComponentType<Record<string, unknown>> })
      .default
  }
  throw new Error(
    'Remote must export a default React component (or a module with default).'
  )
}

/**
 * Load a single exposed remote module and return its default component (after CRM MF `init`).
 */
export async function loadRemoteAsDefaultComponent(
  moduleId: string
): Promise<ComponentType<Record<string, unknown>>> {
  if (moduleId.startsWith('analytics/')) {
    await ensureAnalyticsHostInitialized()
  } else if (moduleId.startsWith('reports/')) {
    await ensureReportsHostInitialized()
  } else {
    await ensureBothFederatedAddonsRegistered()
  }
  const loaded = await loadRemote(moduleId)
  return resolveComponent(loaded)
}

/**
 * Tries `moduleIds` in order (same “missing in container” handling as `loadFirstMatchingRemote`).
 * Use when the remote expose name is uncertain, e.g. `./create` vs `./CreatePage`.
 */
export async function loadRemoteAsDefaultFromCandidates(
  moduleIds: string[]
): Promise<ComponentType<Record<string, unknown>>> {
  const { loaded } = await loadFirstMatchingRemote(moduleIds)
  return resolveComponent(loaded)
}

function uniqueModuleIds(primary: string, fallbacks: readonly string[]): string[] {
  const out: string[] = []
  for (const id of [primary, ...fallbacks]) {
    const t = id.trim()
    if (t && !out.includes(t)) out.push(t)
  }
  return out
}

export { uniqueModuleIds }

export function buildModuleIdCandidates(
  remoteName: string,
  primary: string,
  alternates: readonly string[]
): string[] {
  const out: string[] = []
  for (const id of [primary, ...alternates]) {
    const normalized = id.trim()
    if (!normalized || out.includes(normalized)) continue
    if (!normalized.includes('/')) {
      out.push(`${remoteName}/${normalized}`)
    } else {
      out.push(normalized)
    }
  }
  return out
}

export async function loadFirstMatchingRemote(
  moduleIds: string[]
): Promise<{ loaded: unknown; usedId: string }> {
  let lastError: Error | null = null
  for (const id of moduleIds) {
    try {
      if (id.startsWith('analytics/')) {
        await ensureAnalyticsHostInitialized()
      } else if (id.startsWith('reports/')) {
        await ensureReportsHostInitialized()
      } else {
        await ensureBothFederatedAddonsRegistered()
      }
      const loaded = await loadRemote(id)
      return { loaded, usedId: id }
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e))
      const missing =
        /does not exist in container|Module ["'].*["'] does not exist/i.test(
          err.message
        )
      lastError = err
      if (missing) continue
      throw err
    }
  }
  throw lastError ?? new Error('No remote module candidates succeeded.')
}
