import { readAccessTokenDataJsonString } from '@/utils/accessTokenDataStorage'
// Next Imports
import { usePathname } from 'next/navigation'

// MUI Imports
import { useTheme } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'

// Component Imports
import { Menu, MenuItem, MenuSection } from '@menu/vertical-menu'
import RailSubMenuFlyout from './RailSubMenuFlyout'

// Style Imports
import menuItemStyles from '@core/styles/vertical/menuItemStyles'
import menuSectionStyles from '@core/styles/vertical/menuSectionStyles'
import { menuClasses } from '@menu/utils/menuClasses'
import useMultilangHook from '@/hooks/LanguageHook/Multilanguages-hook'
import { useEffect, useState, type ReactNode } from 'react'
import { renderMenuIcon } from '@/utils/phosphorMenuIcon';

type VerticalMenuProps = {
  scrollMenu: (container: any, isPerfectScrollbar: boolean) => void
  collapsed: boolean
}

const VerticalMenu = ({ scrollMenu, collapsed }: VerticalMenuProps) => {
  // Hooks
  const theme = useTheme()
  const pathname = usePathname()

  const { handleLanguageChange, multiLanguagesData }: any = useMultilangHook();
  const [multiLang, setMultiLang] = useState<any>([])
  const [userData, setuserData] = useState<any>([]);
  const [menuList, setMenuList] = useState<any>([]);
  const [filteredMenu, setFilteredMenu] = useState<any[]>([]);

  useEffect(() => {
    if (multiLanguagesData[0]?.value != undefined) {
      // console.log("multi_lang?.multi_lang", multiLanguagesData[0]?.value);
      setMultiLang(multiLanguagesData[0]?.value);
    }

  });

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const tokenRaw = readAccessTokenDataJsonString()
      if (tokenRaw != null && tokenRaw !== 'undefined' && tokenRaw.trim() !== '') {
        setuserData(JSON.parse(tokenRaw))
      }
    } catch {
      /* ignore */
    }

    try {
      const menuRaw = localStorage.getItem('menuListData')
      if (menuRaw != null && menuRaw !== 'undefined' && menuRaw.trim() !== '') {
        setMenuList(JSON.parse(menuRaw || '[]'))
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const onMenuListDataRefreshed = () => {
      try {
        const raw = localStorage.getItem('menuListData');
        if (raw != null && raw !== 'undefined') {
          setMenuList(JSON.parse(raw || '[]'));
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener('menuListData-refreshed', onMenuListDataRefreshed);
    return () => window.removeEventListener('menuListData-refreshed', onMenuListDataRefreshed);
  }, []);

  const readRoleProfileFromStorage = (): unknown => {
    if (typeof window === 'undefined') return undefined
    try {
      const raw = readAccessTokenDataJsonString()
      if (!raw || raw === 'undefined') return undefined
      const parsed = JSON.parse(raw)
      return parsed?.role_profile ?? parsed?.data?.role_profile ?? parsed?.user?.role_profile
    } catch {
      return undefined
    }
  }

  const readUserRoleProfile = (): unknown => {
    return userData?.role_profile ?? userData?.data?.role_profile ?? readRoleProfileFromStorage()
  }

  const normalizeRoles = (roleProfile: unknown): string[] => {
    if (Array.isArray(roleProfile)) return roleProfile as string[]
    if (typeof roleProfile === 'string' && roleProfile.trim() !== '') return [roleProfile]
    return []
  }

  const roleMatchesUser = (itemRoles: string[] | undefined, roles: string[]): boolean => {
    if (!itemRoles?.length) return true
    return itemRoles.some((role: string) =>
      roles.some(r => String(r).toLowerCase().trim() === String(role).toLowerCase().trim())
    )
  }

  /** Recursively filter menu items by roles; supports multi-level children. */
  const filterItemByRoles = (item: any, roles: string[]): any | null => {
    const hasNestedChildren = Array.isArray(item.children) && item.children.length > 0
    if (hasNestedChildren) {
      const filteredChildren = item.children
        .map((child: any) => filterItemByRoles(child, roles))
        .filter(Boolean);
      return filteredChildren.length ? { ...item, children: filteredChildren } : null;
    }
    if (!roles.length) {
      return item
    }
    return roleMatchesUser(item.roles, roles) ? item : null;
  };

  /** Management: first top-level item is a single link (no nested children / submenu). */
  const stripManagementFirstItemChildren = (sections: any[]): any[] => {
    return sections.map((section: any) => {
      if (String(section.section ?? '').toLowerCase() !== 'management') return section
      const items = section.items || []
      if (items.length === 0) return section
      const firstFlat = { ...items[0], submenu: false }
      delete firstFlat.children
      return { ...section, items: [firstFlat, ...items.slice(1)] }
    })
  }

  const filterMenuItems = (roleProfile: unknown) => {
    const roles = normalizeRoles(roleProfile)

    const filtered = menuList
      .map((section: any) => {
        const items = (section.items || [])
          .map((item: any) => filterItemByRoles(item, roles))
          .filter(Boolean);
        return items.length ? { section: section.section, items } : null;
      })
      .filter(Boolean);

    const withManagementFirstFlattened = stripManagementFirstItemChildren(filtered)

    setFilteredMenu(withManagementFirstFlattened)
  };

  /** Re-run when menu or auth loads; `role_profile` may arrive after `menuList`. */
  useEffect(() => {
    if (!Array.isArray(menuList) || menuList.length === 0) {
      setFilteredMenu([])
      return
    }
    const roleProfile = readUserRoleProfile()
    filterMenuItems(roleProfile)
    // filterMenuItems closes over latest menuList each render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuList, userData])

  /**
   * Menu `icon` from API is usually a Remix Icon class, e.g. `"ri-settings-2-line"` on
   * `{ label: "Settings", submenu: true, path: "/settings", icon: "ri-settings-2-line", ... }`.
   * Those render as `<i className="ri-…">`; other strings fall back to `@mui/icons-material` by name.
   */
  const getIcon = (iconName?: string, path?: string) => renderMenuIcon(iconName, path)

  /** Collapsed rail: label is hidden, so it's shown as a hover tooltip on the icon instead. */
  const getIconWithTooltip = (iconName: string | undefined, label: ReactNode, path?: string) => {
    // Wrapped in both modes: an unwrapped <svg> and a wrapped one measure differently
    // (inline vs inline-flex baseline), which shifted the icon a pixel against the label.
    const icon = <span style={{ display: 'inline-flex' }}>{getIcon(iconName, path)}</span>
    return collapsed ? (
      <Tooltip title={label} placement='right'>
        {icon}
      </Tooltip>
    ) : (
      icon
    )
  }

  /** Small dot shown after the active item's label (expanded mode only — reference: `Sidebar.tsx`). */
  const ActiveDot = (
    <Box
      component='span'
      sx={{ inlineSize: 6, blockSize: 6, borderRadius: '50%', backgroundColor: 'var(--nav-chrome-active-text)' }}
    />
  )

  /**
   * Render a menu item. Leaves render as `MenuItem`; items with children render as a
   * `RailSubMenuFlyout` (a popover listing the children) instead of `@menu`'s `SubMenu`,
   * since `SubMenu` only supports inline accordion expansion, which doesn't fit the
   * collapsed 68px icon-only rail.
   */
  const renderMenuItem = (item: any, keyPrefix = '', depth = 0): ReactNode => {
    const pathPart = item.path != null && String(item.path).length > 0 ? String(item.path) : 'nopath'
    const key = keyPrefix || `${pathPart}-${item.label}-${depth}`
    /** API may omit `submenu`; nested items are defined by non-empty `children`. */
    const hasSubmenu = Array.isArray(item.children) && item.children.length > 0

    if (hasSubmenu) {
      return (
        <RailSubMenuFlyout
          key={key}
          label={item.label}
          icon={getIcon(item.icon, item.path)}
          collapsed={collapsed}
          children={(item.children || []).map((child: any) => ({ label: child.label, path: child.path }))}
        />
      )
    }
    const isActive = item.path != null && pathname === item.path
    return (
      <MenuItem
        key={key}
        href={item.path ?? '#'}
        icon={getIconWithTooltip(item.icon, item.label, item.path)}
        suffix={isActive ? ActiveDot : undefined}
      >
        {item.label}
      </MenuItem>
    );
  };

  /**
   * The reference design pins Settings to the sidebar bottom, away from the module list.
   * It still comes from the same role-filtered API menu (so permissions and its submenu
   * children are unchanged) — it is only pulled out of the scrolling group and rendered in
   * the footer below, rather than being hardcoded here.
   */
  const isSettingsItem = (item: any) => String(item?.label ?? '').trim().toLowerCase() === 'settings'

  const mainSections = filteredMenu
    .map((section: any) => ({ ...section, items: (section.items || []).filter((i: any) => !isSettingsItem(i)) }))
    .filter((section: any) => section.items.length > 0)

  const settingsItems = filteredMenu.flatMap((section: any) => (section.items || []).filter(isSettingsItem))

  return (
    <Box sx={{ flex: '1 1 auto', minBlockSize: 0, display: 'flex', flexDirection: 'column' }}>
    <Box
      className='sidebar-menu-scroll'
      onScroll={event => scrollMenu(event, false)}
      sx={{
        flex: '1 1 auto',
        minHeight: 0,
        overflowY: 'auto',
        overflowX: 'hidden'
      }}
    >
      {/* Incase you also want to scroll NavHeader to scroll with Vertical Menu, remove NavHeader from above and paste it below this comment */}
      {/* Vertical Menu */}
      <Menu menuItemStyles={menuItemStyles(theme)} menuSectionStyles={menuSectionStyles(theme)}>
       {mainSections.map((section, secIdx) => (
        <MenuSection label='' key={`${section.section}-${secIdx}`}>
          {section.items.map((item: any, idx: number) =>
            renderMenuItem(item, `${section.section}-${secIdx}-${idx}-${item.label ?? 'item'}`)
          )}
        </MenuSection>
      ))}
       
      </Menu>
    </Box>

    {/* Pinned Settings — the scroll area above takes the remaining height, so this stays
        at the bottom and is visually separated from the module list at any viewport height. */}
    {settingsItems.length > 0 && (
      <Box
        sx={{
          flexShrink: 0,
          // The footer Menu inherits the shared `menuClasses.root` inset (so Settings lines up
          // with the rows above) but not its top/bottom padding, which would double up here.
          [`& .${menuClasses.root}`]: { paddingBlock: '0 !important' }
        }}
      >
        <Menu menuItemStyles={menuItemStyles(theme)} menuSectionStyles={menuSectionStyles(theme)}>
          {settingsItems.map((item: any, idx: number) => renderMenuItem(item, `settings-${idx}-${item.label ?? 'item'}`))}
        </Menu>
      </Box>
    )}
    </Box>
  )
}

export default VerticalMenu
