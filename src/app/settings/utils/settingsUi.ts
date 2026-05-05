import type { SettingsMenuChild } from './getMenu'

/** Short line shown under each menu label (API has no description field). */
export function getSettingItemDescription(item: SettingsMenuChild): string {
  const k = item.key.toLowerCase()
  const byKey: Record<string, string> = {
    'general-personal': 'Configure Personal Settings and related options',
    'general-organization': 'Configure Organization and related options',
    'user-users': 'Invite people and manage seats',
    'user-permission': 'Control who can see and edit data',
    'user-roles': 'Define roles and what they can access'
  }
  if (byKey[k]) return byKey[k]

  const p = item.path.toLowerCase()
  if (p.includes('permission')) return 'Control access and visibility for your team'
  if (p.includes('role')) return 'Create roles and assign them to users'
  if (p.includes('user')) return 'Manage people who can use this workspace'

  return `Configure ${item.label} and related options`
}

export type SettingsMenuGroup = {
  title: string
  items: SettingsMenuChild[]
  /** From submenu parent in `menuListData` (see `SettingsMenuChild.groupIcon`). */
  groupIcon?: string
}

/** Group keys in first-seen order; icons come from menu API, not from title heuristics. */
export function groupMenuItems(menu: SettingsMenuChild[]): SettingsMenuGroup[] {
  const order: string[] = []
  const map = new Map<string, SettingsMenuChild[]>()

  for (const item of menu) {
    const title = item.group?.trim() || 'General'
    if (!map.has(title)) {
      order.push(title)
      map.set(title, [])
    }
    map.get(title)!.push(item)
  }

  return order.map(title => {
    const items = map.get(title)!
    const groupIcon = items.find(i => i.groupIcon && i.groupIcon.trim() !== '')?.groupIcon
    return { title, items, groupIcon }
  })
}
