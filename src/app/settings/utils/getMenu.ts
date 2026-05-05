import { readAccessTokenDataJsonString } from '@/utils/accessTokenDataStorage'
export type SettingsMenuChild = {
  label: string
  key: string
  /** App route for this leaf (from menu API) */
  path: string
  /** Parent submenu label (e.g. User Management) for grouped sidebar sections */
  group?: string
  /** Remix icon on the parent submenu node (sidebar accordion header). */
  groupIcon?: string
  /** Remix Icon class from API, e.g. ri-user-line */
  icon?: string
  /** When set, settings URL uses `?tab=` + `&subtab=` instead of `?tab=<key>` */
  settingsTab?: string
  settingsSubtab?: string
}

/** API shape: menuListData is an array of sections */
export type MenuSection = {
  section: string
  items?: MenuNode[]
}

export type MenuNode = {
  label: string
  path?: string
  submenu?: boolean
  children?: MenuNode[]
  icon?: string
  /** Some APIs send PascalCase */
  Icon?: string
  icon_name?: string
  /** If omitted, leaf is hidden when filtering (same as VerticalMenu). */
  roles?: string[]
}

/** Remix class from menu node (`icon`, `Icon`, or `icon_name`). */
function pickMenuNodeIcon(node: MenuNode): string | undefined {
  const raw = node.icon ?? node.Icon ?? node.icon_name
  if (raw == null) return undefined
  const s = typeof raw === 'string' ? raw.trim() : String(raw).trim()
  return s !== '' ? s : undefined
}

const normalizePath = (p: string) => p.replace(/\/$/, '') || ''

/**
 * Some menu APIs use `#` as the path for in-app settings leaves. Map those (plus real routes)
 * to General settings so `?tab=` is never `#` / `%23`.
 */
function resolveGeneralSettingsLeaf(pathRaw: string, label: string): 'personal' | 'organization' | null {
  const np = normalizePath(pathRaw)
  if (np === '/my-account') return 'personal'
  if (np === '/my-company') return 'organization'

  if (pathRaw.trim() !== '#') return null

  const lb = label.toLowerCase()
  const personalish = lb.includes('personal') || lb.includes('my account')
  const orgish =
    lb.includes('organization') ||
    /\bmy\s+company\b/.test(lb) ||
    (lb.includes('company') && !lb.includes('personal'))

  if (orgish && !personalish) return 'organization'
  if (personalish) return 'personal'
  if (orgish) return 'organization'
  return null
}

/**
 * Settings leaves that live under sub-tabs (`?tab=…&subtab=…`). Path check is first, but we also
 * fall back to label so the sidebar highlights correctly even when the menu API returns non-canonical
 * paths (e.g. `#`, `/users` without `/user/` prefix, trailing slashes, or case differences).
 */
type SettingsLeafKind = 'users' | 'roles' | 'permission' | 'modules'

function resolveSubtabSettingsLeaf(
  pathRaw: string,
  label: string,
  parentLabel?: string
): SettingsLeafKind | null {
  const trimmed = pathRaw.trim()
  const npLower = normalizePath(trimmed).toLowerCase()
  const npNorm = normalizePath(trimmed)

  const endsWithIc = (suffix: string) => npNorm.toLowerCase().endsWith(suffix.toLowerCase())

  if (
    npLower === '/user/users' ||
    npLower === '/users' ||
    endsWithIc('/user/users') ||
    endsWithIc('/users')
  ) {
    return 'users'
  }
  if (
    npLower === '/user/roles' ||
    npLower === '/roles' ||
    endsWithIc('/user/roles') ||
    endsWithIc('/roles')
  ) {
    return 'roles'
  }
  if (
    npLower === '/user/permission' ||
    npLower === '/permission' ||
    npLower === '/permissions' ||
    endsWithIc('/user/permission') ||
    endsWithIc('/permission') ||
    endsWithIc('/permissions')
  ) {
    return 'permission'
  }
  if (
    npLower === '/setup/customization/modules' ||
    npLower === '/customization/modules' ||
    npLower === '/modules' ||
    endsWithIc('/customization/modules') ||
    endsWithIc('/modules')
  ) {
    return 'modules'
  }

  const lb = label.trim().toLowerCase()
  const plb = (parentLabel ?? '').trim().toLowerCase()

  /** Same as Personal / Org: API often uses `#` for in-app settings leaves. */
  const isPlaceholderPath = trimmed === '#' || npLower === '#' || npLower === ''

  if (isPlaceholderPath) {
    if (lb === 'users' || lb === 'user list' || lb === 'all users') return 'users'
    if (lb === 'roles' || lb === 'role' || lb === 'role list') return 'roles'
    if (lb === 'permission' || lb === 'permissions' || lb === 'access permission') return 'permission'
    if (lb === 'modules' || lb === 'module list' || lb === 'customization modules') return 'modules'
  }

  /**
   * "Settings" / "General" parents do not match `includes('user')` — without this, label fallbacks
   * never ran and Users kept a wrong `pathToTabKey` (e.g. `user-users` vs `users`).
   */
  const underLikelySettingsGroup =
    plb === 'user' ||
    plb === 'users' ||
    plb === 'user management' ||
    plb.includes('user') ||
    plb.includes('security') ||
    plb.includes('setting') ||
    plb.includes('general') ||
    plb.includes('management')

  if (underLikelySettingsGroup) {
    if (lb === 'users' || lb === 'user list' || lb === 'all users') return 'users'
    if (lb === 'roles' || lb === 'role' || lb === 'role list') return 'roles'
    if (lb === 'permission' || lb === 'permissions' || lb === 'access permission') return 'permission'
  }

  if (lb === 'modules' || lb === 'module list' || lb === 'customization modules') return 'modules'

  return null
}

/** Stable key for ?tab= (readable, URL-safe) */
export function pathToTabKey(path: string): string {
  const trimmed = path.trim()
  if (!trimmed) return ''
  const np = normalizePath(trimmed)
  if (np === '#' || trimmed === '#') return ''
  return np.replace(/^\//, '').replace(/\//g, '-')
}

const hasSubmenu = (node: MenuNode) =>
  Boolean(node.submenu && Array.isArray(node.children) && node.children.length > 0)

/** Match VerticalMenu `filterItemByRoles` so the settings sidebar matches the nav. */
function filterItemByRoles(item: MenuNode, roles: string[]): MenuNode | null {
  if (hasSubmenu(item)) {
    const filteredChildren = (item.children ?? [])
      .map((c) => filterItemByRoles(c, roles))
      .filter(Boolean) as MenuNode[]
    return filteredChildren.length ? { ...item, children: filteredChildren } : null
  }
  return item.roles?.some((role: string) => roles.includes(role)) ? item : null
}

function getUserRoles(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = readAccessTokenDataJsonString()
    if (!raw || raw === 'undefined') return []
    const u = JSON.parse(raw)
    const rp = u?.role_profile
    if (Array.isArray(rp)) return rp
    if (typeof rp === 'string' && rp.trim() !== '') return [rp]
  } catch {
    /* ignore */
  }
  return []
}

/**
 * Collect leaf links under the Settings tree (same rules as vertical nav: submenu expands, leaves have path).
 * `parentLabel` becomes the middle-column section heading (e.g. User Management).
 * `parentGroupIcon` is the parent submenu node's icon (accordion header).
 */
function collectLeafItems(nodes: MenuNode[], parentLabel?: string, parentGroupIcon?: string): SettingsMenuChild[] {
  const out: SettingsMenuChild[] = []
  for (const node of nodes) {
    if (hasSubmenu(node)) {
      out.push(...collectLeafItems(node.children!, node.label, pickMenuNodeIcon(node)))
      continue
    }
    const p = node.path?.trim()
    if (p) {
      const gs = resolveGeneralSettingsLeaf(p, node.label)
      if (gs === 'personal') {
        out.push({
          label: node.label,
          key: 'general-personal',
          path: p,
          group: parentLabel,
          groupIcon: parentGroupIcon,
          icon: pickMenuNodeIcon(node),
          settingsTab: 'general',
          settingsSubtab: 'personal-settings'
        })
        continue
      }
      if (gs === 'organization') {
        out.push({
          label: node.label,
          key: 'general-organization',
          path: p,
          group: parentLabel,
          groupIcon: parentGroupIcon,
          icon: pickMenuNodeIcon(node),
          settingsTab: 'general',
          settingsSubtab: 'organization'
        })
        continue
      }
      const subtabLeaf = resolveSubtabSettingsLeaf(p, node.label, parentLabel)
      if (subtabLeaf === 'users') {
        out.push({
          label: node.label,
          key: 'user-users',
          path: p,
          group: parentLabel,
          groupIcon: parentGroupIcon,
          icon: pickMenuNodeIcon(node),
          settingsTab: 'general',
          settingsSubtab: 'users'
        })
        continue
      }
      if (subtabLeaf === 'roles') {
        out.push({
          label: node.label,
          key: 'user-roles',
          path: p,
          group: parentLabel,
          groupIcon: parentGroupIcon,
          icon: pickMenuNodeIcon(node),
          settingsTab: 'security',
          settingsSubtab: 'roles'
        })
        continue
      }
      if (subtabLeaf === 'permission') {
        out.push({
          label: node.label,
          key: 'user-permission',
          path: p,
          group: parentLabel,
          groupIcon: parentGroupIcon,
          icon: pickMenuNodeIcon(node),
          settingsTab: 'security',
          settingsSubtab: 'permission'
        })
        continue
      }
      if (subtabLeaf === 'modules') {
        out.push({
          label: node.label,
          key: 'setup-customization-modules',
          path: p,
          group: parentLabel,
          groupIcon: parentGroupIcon,
          icon: pickMenuNodeIcon(node),
          settingsTab: 'customization',
          settingsSubtab: 'modules'
        })
        continue
      }
      const key = pathToTabKey(p)
      if (key) {
        out.push({
          label: node.label,
          key,
          path: p,
          group: parentLabel,
          groupIcon: parentGroupIcon,
          icon: pickMenuNodeIcon(node)
        })
      }
    }
  }
  return out
}

function findSettingsRootUnderManagement(items: MenuNode[]): MenuNode | null {
  for (const item of items) {
    const p = normalizePath(item.path ?? '')
    if (p === '/settings') return item
  }
  return null
}

/** Remix class on the Settings root node (`{ path: "/settings", icon: "ri-settings-2-line", ... }`). */
export function getSettingsRootIcon(): string | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    const raw = localStorage.getItem('menuListData')
    if (raw == null || raw === 'undefined' || raw.trim() === '') return undefined
    const data: MenuSection[] = JSON.parse(raw)
    if (!Array.isArray(data)) return undefined
    for (const section of data) {
      if (String(section.section).toLowerCase() !== 'management') continue
      const settingsRoot = findSettingsRootUnderManagement(section.items ?? [])
      if (settingsRoot) return pickMenuNodeIcon(settingsRoot)
    }
  } catch {
    return undefined
  }
  return undefined
}

export type SettingsUrlExtra = { detail?: string | null }

/**
 * Normalize `subtab` for `?tab=general&subtab=…` so menu, sidebar, and GeneralSettingsPanel agree
 * (handles shorthand labels, spaces in query values, older links).
 */
export function canonicalGeneralSubtab(sub: string | null | undefined): string {
  const n = (sub ?? '').trim().toLowerCase()
  if (!n) return ''
  const map: Record<string, string> = {
    personal: 'personal-settings',
    'my-account': 'personal-settings',
    'personal-settings': 'personal-settings',
    organization: 'organization',
    org: 'organization',
    company: 'organization',
    'my-company': 'organization',
  }
  if (map[n]) return map[n]
  const dashed = n.replace(/\s+/g, '-')
  if (map[dashed]) return map[dashed]
  return dashed
}

/**
 * Fixes URLs where `subtab` was encoded into `tab` (e.g. `?tab=general%26subtab%3Dusers`), so the
 * browser exposes one `tab` value `general&subtab=users` and no separate `subtab` param.
 */
export function parseSettingsSearchParams(searchParams: { get(name: string): string | null }): {
  tab: string | null
  subtab: string | null
  detail: string | null
  needsCanonicalReplace: boolean
} {
  const rawTab = searchParams.get('tab')
  const standaloneSubtab = searchParams.get('subtab')
  const standaloneDetail = searchParams.get('detail')

  if (rawTab && !standaloneSubtab && rawTab.includes('subtab=')) {
    const amp = rawTab.indexOf('&')
    if (amp > 0) {
      const tabPart = rawTab.slice(0, amp)
      const rest = rawTab.slice(amp + 1)
      try {
        const sp = new URLSearchParams(rest)
        const sub = sp.get('subtab')
        const det = sp.get('detail')
        if ((tabPart === 'general' || tabPart === 'security' || tabPart === 'customization') && sub) {
          return {
            tab: tabPart.trim(),
            subtab: sub.trim(),
            detail: (det ?? standaloneDetail)?.trim() || null,
            needsCanonicalReplace: true
          }
        }
      } catch {
        /* ignore */
      }
    }
  }

  return {
    tab: rawTab?.trim() || null,
    subtab: standaloneSubtab?.trim() || null,
    detail: standaloneDetail?.trim() || null,
    needsCanonicalReplace: false
  }
}

/** Canonical `/settings?…` from parsed pieces (use after {@link parseSettingsSearchParams}). */
export function canonicalSettingsUrlFromParsed(parsed: {
  tab: string | null
  subtab: string | null
  detail: string | null
}): string {
  const q = new URLSearchParams()
  if (parsed.tab) q.set('tab', parsed.tab)
  if (parsed.subtab) q.set('subtab', parsed.subtab)
  if (parsed.detail) q.set('detail', parsed.detail)
  return `/settings?${q.toString()}`
}

/** Build the `/settings` URL for a sidebar leaf (handles `tab` + `subtab` for General). */
export function settingsUrlForMenuItem(item: SettingsMenuChild, extra?: SettingsUrlExtra): string {
  const base =
    item.settingsTab && item.settingsSubtab
      ? `/settings?tab=${encodeURIComponent(item.settingsTab)}&subtab=${encodeURIComponent(item.settingsSubtab)}`
      : `/settings?tab=${encodeURIComponent(item.key)}`
  const d = extra?.detail
  if (d != null && d !== '') {
    return `${base}&detail=${encodeURIComponent(d)}`
  }
  return base
}

export function getSettingsMenu(): SettingsMenuChild[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = localStorage.getItem('menuListData')
    if (raw == null || raw === 'undefined' || raw.trim() === '') return []

    const data: MenuSection[] = JSON.parse(raw)
    if (!Array.isArray(data)) return []

    const userRoles = getUserRoles()

    for (const section of data) {
      if (String(section.section).toLowerCase() !== 'management') continue
      const items = section.items ?? []
      const settingsRoot = findSettingsRootUnderManagement(items)
      if (!settingsRoot?.children?.length) continue

      const rawChildren = settingsRoot.children ?? []

      const filteredTop =
        userRoles.length > 0
          ? (rawChildren.map((c) => filterItemByRoles(c, userRoles)).filter(Boolean) as MenuNode[])
          : rawChildren

      if (!filteredTop.length) continue

      return collectLeafItems(filteredTop)
    }

    return []
  } catch {
    return []
  }
}
