import type { ReactElement } from 'react'
import type { Icon } from '@phosphor-icons/react'
import {
  SquaresFourIcon,
  LightningIcon,
  HandshakeIcon,
  AddressBookIcon,
  BuildingsIcon,
  CheckCircleIcon,
  ChatTeardropTextIcon,
  ChartBarIcon,
  GearSixIcon,
  ShieldCheckIcon,
  UsersThreeIcon,
  FileTextIcon,
  FolderIcon,
  UserCircleIcon
} from '@phosphor-icons/react'

// Canonical duotone icon size for the vertical nav (matches the reference
// Sidebar.tsx, which renders each nav icon at 19px / weight="duotone").
const MENU_ICON_SIZE = 19

/**
 * Route → nav icon. This is the authoritative source so the sidebar matches the
 * reference design (crm-app-UI-Arun-Latest/components/layout/Sidebar.tsx)
 * regardless of the (arbitrary, data-driven) icon name the backend sends. Only
 * top-level module items are matched; submenu children don't render icons.
 */
const PHOSPHOR_ICON_BY_ROUTE: { test: RegExp; Icon: Icon }[] = [
  { test: /(^\/?$|dashboard)/, Icon: SquaresFourIcon },
  { test: /leads?/, Icon: LightningIcon },
  { test: /deals?/, Icon: HandshakeIcon },
  { test: /contacts?/, Icon: AddressBookIcon },
  { test: /accounts?/, Icon: BuildingsIcon },
  { test: /tasks?/, Icon: CheckCircleIcon },
  { test: /(comms|communication|customer)/, Icon: ChatTeardropTextIcon },
  { test: /reports?/, Icon: ChartBarIcon },
  { test: /settings?/, Icon: GearSixIcon }
]

/**
 * Fallback map for items without a recognisable route. Menu `icon` comes from the
 * backend (`ri-*` Remix Icon class or a bare MUI-style name like `"PeopleOutline"`)
 * and is arbitrary; anything unmatched falls back to `FileTextIcon`.
 */
const PHOSPHOR_ICON_BY_NAME: Record<string, Icon> = {
  'ri-home-smile-line': SquaresFourIcon,
  ViewModule: SquaresFourIcon,
  PeopleOutline: LightningIcon,
  ElectricBolt: LightningIcon,
  'ri-handshake-line': HandshakeIcon,
  Handshake: HandshakeIcon,
  Portrait: AddressBookIcon,
  CorporateFare: BuildingsIcon,
  TaskAlt: CheckCircleIcon,
  'ri-service-line': ChatTeardropTextIcon,
  'ri-bar-chart-line': ChartBarIcon,
  'ri-bar-chart-2-line': ChartBarIcon,
  BarChart: ChartBarIcon,
  Assessment: ChartBarIcon,
  Article: FileTextIcon,
  Folder: FolderIcon,
  Settings: GearSixIcon,
  'ri-admin-line': ShieldCheckIcon,
  'ri-user-2-fill': UsersThreeIcon,
  'ri-settings-2-line': GearSixIcon,
  'ri-user-3-line': UserCircleIcon
}

function resolveIcon(iconName?: string, path?: string, Fallback: Icon = FileTextIcon): Icon {
  const p = path?.toLowerCase().trim()
  if (p && p !== 'nopath' && p !== '#') {
    const routeMatch = PHOSPHOR_ICON_BY_ROUTE.find(r => r.test.test(p))
    if (routeMatch) return routeMatch.Icon
  }
  const trimmed = iconName?.trim()
  return (trimmed && PHOSPHOR_ICON_BY_NAME[trimmed]) || Fallback
}

export function renderMenuIcon(iconName?: string, path?: string, Fallback: Icon = FileTextIcon): ReactElement {
  const IconComp = resolveIcon(iconName, path, Fallback)
  return <IconComp size={MENU_ICON_SIZE} weight='duotone' />
}
