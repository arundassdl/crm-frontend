import type { ReactNode, ReactElement } from 'react'
import type { SvgIconComponent } from '@mui/icons-material'
import ArticleIcon from '@mui/icons-material/Article'
import CorporateFareIcon from '@mui/icons-material/CorporateFare'
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt'
import FolderIcon from '@mui/icons-material/Folder'
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline'
import PortraitIcon from '@mui/icons-material/Portrait'
import SettingsIcon from '@mui/icons-material/Settings'
import TaskAltIcon from '@mui/icons-material/TaskAlt'
import ViewModuleIcon from '@mui/icons-material/ViewModule'

/** Explicit registry — avoids `import * from '@mui/icons-material'` (~2k modules on every compile). */
const MUI_ICON_BY_NAME: Record<string, SvgIconComponent> = {
  Article: ArticleIcon,
  CorporateFare: CorporateFareIcon,
  ElectricBolt: ElectricBoltIcon,
  Folder: FolderIcon,
  PeopleOutline: PeopleOutlineIcon,
  Portrait: PortraitIcon,
  Settings: SettingsIcon,
  TaskAlt: TaskAltIcon,
  ViewModule: ViewModuleIcon,
}

export function getMuiIconByName(
  iconName?: string,
  fallback: SvgIconComponent = ArticleIcon
): SvgIconComponent {
  const trimmed = iconName?.trim()
  if (!trimmed || trimmed.startsWith('ri-')) return fallback
  return MUI_ICON_BY_NAME[trimmed] ?? fallback
}

export function renderMenuIcon(
  iconName?: string,
  Fallback: SvgIconComponent = ArticleIcon
): ReactElement {
  const trimmed = iconName?.trim()
  if (!trimmed) return <Fallback fontSize="small" />
  if (trimmed.startsWith('ri-')) return <i className={trimmed} />
  const Icon = MUI_ICON_BY_NAME[trimmed]
  return Icon ? <Icon fontSize="small" /> : <i className={trimmed} />
}
