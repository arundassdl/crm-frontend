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
 * **Remote CSS (debugging):** styles are emitted by the remote’s webpack and loaded when its chunks run.
 * In DevTools → Network, filter by the analytics origin (e.g. `:3001`) and confirm:
 * - `remoteEntry.js` 200, then `*.css` and/or `*.js` chunk requests from the same host.
 * If CSS is missing, check the remote’s `output.publicPath`, CORS for cross-origin `link` requests, and that
 * `mini-css-extract-plugin` (or style-loader in dev) is not disabled. The **host** does not import the
 * remote’s CSS file directly; it must load with the remote container.
 */
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import * as mui from '@mui/material'
import * as emotionReact from '@emotion/react'
import * as emotionStyled from '@emotion/styled'
import { init, loadRemote } from '@module-federation/runtime'
import type { ComponentType } from 'react'
import { ANALYTICS_REMOTE_DEFAULT_ENTRY_PATH } from '@/config/microfrontends/analytics'
import { CONSTANTS } from '@/services/config/app-config'

export const REACT_VERSION = '18.3.1'

/** Align with `package.json` for Module Federation `shared` semver. */
const NEXT_ROUTER_SHARED_VERSION = '14.2.5'
const MUI_MATERIAL_VERSION = '5.16.4'
const EMOTION_VERSION = '11.11.4'

let sessionCacheBust: string | null = null
let mfInitEntry: string | null = null
let mfInitPromise: Promise<void> | null = null
let loggedEntryUrl: string | null = null

function getSessionCacheBust(): string {
  if (sessionCacheBust) return sessionCacheBust
  if (process.env.NEXT_PUBLIC_ANALYTICS_MF_CACHE_BUST) {
    sessionCacheBust = process.env.NEXT_PUBLIC_ANALYTICS_MF_CACHE_BUST
  } else if (process.env.NODE_ENV === 'development') {
    sessionCacheBust = String(Date.now())
  } else {
    sessionCacheBust = process.env.NEXT_PUBLIC_ANALYTICS_MF_BUILD_BUST ?? ''
  }
  return sessionCacheBust
}

export function withRemoteEntryCacheBust(url: string, cacheBust: string): string {
  if (!cacheBust) return url
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}v=${encodeURIComponent(cacheBust)}`
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
  const origin =
    process.env.NEXT_PUBLIC_ANALYTICS_APP_URL ?? CONSTANTS.ANALYTICS_APP_URL
  return getRemoteEntryUrl(origin, getSessionCacheBust())
}

/** See `ANALYTICS_REMOTE_DEFAULT_ENTRY_PATH` + `ensureAnalyticsHostInitialized` / `init` remotes. */

function ensureModuleFederation(remoteName: string, entry: string): Promise<void> {
  if (mfInitEntry !== entry) {
    mfInitEntry = entry
    mfInitPromise = Promise.resolve().then(() => {
      init({
        name: 'crm',
        remotes: [{ name: remoteName, entry }],
        shared: {
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
              // Webpack bundles this; avoid a top-level import of a `'use client'` shim in this file.
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
        },
      })
    })
  }
  return mfInitPromise!
}

/**
 * One-time (per session) init for the analytics remote. Safe to call from every federated import path.
 */
export async function ensureAnalyticsHostInitialized(): Promise<void> {
  const origin =
    process.env.NEXT_PUBLIC_ANALYTICS_APP_URL ?? CONSTANTS.ANALYTICS_APP_URL
  const remoteName =
    process.env.NEXT_PUBLIC_ANALYTICS_MF_REMOTE_NAME ?? CONSTANTS.ANALYTICS_MF_REMOTE_NAME
  const entry = getRemoteEntryUrl(origin, getSessionCacheBust())
  if (
    process.env.NODE_ENV === 'development' &&
    loggedEntryUrl !== entry &&
    typeof console !== 'undefined'
  ) {
    console.info(
      '[Module Federation] analytics remoteEntry (open in browser to verify 200 + CSS chunks on same host):\n',
      entry
    )
    loggedEntryUrl = entry
  }
  await ensureModuleFederation(remoteName, entry)
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
 * Load a single exposed remote module and return its default component (after `ensureAnalyticsHostInitialized`).
 */
export async function loadRemoteAsDefaultComponent(
  moduleId: string
): Promise<ComponentType<Record<string, unknown>>> {
  await ensureAnalyticsHostInitialized()
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
      await ensureAnalyticsHostInitialized()
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
