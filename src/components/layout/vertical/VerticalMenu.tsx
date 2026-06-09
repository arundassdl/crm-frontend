import { readAccessTokenDataJsonString } from '@/utils/accessTokenDataStorage'
// MUI Imports
import Chip from '@mui/material/Chip'
import { useTheme } from '@mui/material/styles'

// Third-party Imports
import PerfectScrollbar from 'react-perfect-scrollbar'

// Type Imports
import type { VerticalMenuContextProps } from '@menu/components/vertical-menu/Menu'

// Component Imports
import { Menu, SubMenu, MenuItem, MenuSection } from '@menu/vertical-menu'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'

// Styled Component Imports
import StyledVerticalNavExpandIcon from '@menu/styles/vertical/StyledVerticalNavExpandIcon'


// Style Imports
import menuItemStyles from '@core/styles/vertical/menuItemStyles'
import menuSectionStyles from '@core/styles/vertical/menuSectionStyles'
import useMultilangHook from '@/hooks/LanguageHook/Multilanguages-hook'
import { useEffect, useState, type ReactNode } from 'react'
 import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import ArticleIcon from '@mui/icons-material/Article';
// import CorporateFareIcon from '@mui/icons-material/CorporateFare';
// import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
// import PortraitIcon from '@mui/icons-material/Portrait';
// import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
// import EventNoteIcon from '@mui/icons-material/EventNote';
// import TaskAltIcon from '@mui/icons-material/TaskAlt';
import { verticalMenuItems } from '@/components/layout/vertical/vertical-menu-config';
import { renderMenuIcon } from '@/utils/muiIconByName';

type RenderExpandIconProps = {
  open?: boolean
  transitionDuration?: VerticalMenuContextProps['transitionDuration']
}

const RenderExpandIcon = ({ open, transitionDuration }: RenderExpandIconProps) => (
  <StyledVerticalNavExpandIcon open={open} transitionDuration={transitionDuration}>
    <i className='ri-arrow-right-s-line' />
  </StyledVerticalNavExpandIcon>
)

const VerticalMenu = ({ scrollMenu }: { scrollMenu: (container: any, isPerfectScrollbar: boolean) => void }) => {
  // Hooks
  const theme = useTheme()
  const { isBreakpointReached, transitionDuration } = useVerticalNav()

  const ScrollWrapper = isBreakpointReached ? 'div' : PerfectScrollbar

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

    console.log('verticalMenuItems', verticalMenuItems, menuList);

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
    console.log(withManagementFirstFlattened, 'filteredMenu', filteredMenu);
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
  const getIcon = (iconName?: string) => renderMenuIcon(iconName)

  /** Recursively render a menu item: SubMenu for items with children, MenuItem for leaves. */
  const renderMenuItem = (item: any, keyPrefix = '', depth = 0): ReactNode => {
    const pathPart = item.path != null && String(item.path).length > 0 ? String(item.path) : 'nopath'
    const key = keyPrefix || `${pathPart}-${item.label}-${depth}`
    /** API may omit `submenu`; nested items are defined by non-empty `children`. */
    const hasSubmenu = Array.isArray(item.children) && item.children.length > 0

    if (hasSubmenu) {
      /** Do not pass href on group rows — RouterLink + /settings breaks expand / sibling items. */
      return (
        <SubMenu key={key} label={item.label} href={item.path ?? '#'} icon={getIcon(item.icon)}>
          {(item.children || []).map((child: any, idx: number) =>
            renderMenuItem(child, `${key}-c${idx}-${child.path ?? child.label}`, depth + 1)
          )}
        </SubMenu>
      );
    }
    return (
      <MenuItem key={key} href={item.path ?? '#'} icon={getIcon(item.icon)}>
        {item.label}
      </MenuItem>
    );
  };

  return (
    // eslint-disable-next-line lines-around-comment
    /* Custom scrollbar instead of browser scroll, remove if you want browser scroll only */
    <ScrollWrapper
      {...(isBreakpointReached
        ? {
          className: 'bs-full overflow-y-auto overflow-x-hidden',
          onScroll: container => scrollMenu(container, false)
        }
        : {
          options: { wheelPropagation: false, suppressScrollX: true },
          onScrollY: container => scrollMenu(container, true)
        })}
    >
      {/* Incase you also want to scroll NavHeader to scroll with Vertical Menu, remove NavHeader from above and paste it below this comment */}
      {/* Vertical Menu */}
      <Menu
        subMenuOpenBehavior='collapse'
        menuItemStyles={menuItemStyles(theme)}
        renderExpandIcon={({ open }) => <RenderExpandIcon open={open} transitionDuration={transitionDuration} />}
        renderExpandedMenuItemIcon={{ icon: <i className='ri-circle-line' /> }}
        menuSectionStyles={menuSectionStyles(theme)}
      >
       {filteredMenu.map((section, secIdx) => (
        <MenuSection label='' key={`${section.section}-${secIdx}`}>
          {section.items.map((item: any, idx: number) =>
            renderMenuItem(item, `${section.section}-${secIdx}-${idx}-${item.label ?? 'item'}`)
          )}
        </MenuSection>
      ))}
       
      </Menu>
    </ScrollWrapper>
  )
}

// const VerticalMenu = ({ scrollMenu }: { scrollMenu: (container: any, isPerfectScrollbar: boolean) => void }) => {
//   // Hooks
//   const theme = useTheme()
//   const { isBreakpointReached, transitionDuration } = useVerticalNav()

//   const ScrollWrapper = isBreakpointReached ? 'div' : PerfectScrollbar

//   const { handleLanguageChange, multiLanguagesData }: any = useMultilangHook();
//   const [multiLang, setMultiLang] = useState<any>([])
//   const [userData, setuserData] = useState<any>([]);

//   useEffect(() => {
//     if (multiLanguagesData[0]?.value != undefined) {
//       console.log("multi_lang?.multi_lang", multiLanguagesData[0]?.value);
//       setMultiLang(multiLanguagesData[0]?.value);
//     }

//   });

//   useEffect(() => {


//     if (typeof window !== 'undefined') {
//       if (localStorage.getItem('userProfileData') != 'undefined') {
//         // alert(localStorage.getItem('userData'))
//         setuserData(JSON.parse(localStorage.getItem('userProfileData') || '[]'))
//       }
//     }
//   }, []);
//   return (
//     // eslint-disable-next-line lines-around-comment
//     /* Custom scrollbar instead of browser scroll, remove if you want browser scroll only */
//     <ScrollWrapper
//       {...(isBreakpointReached
//         ? {
//           className: 'bs-full overflow-y-auto overflow-x-hidden',
//           onScroll: container => scrollMenu(container, false)
//         }
//         : {
//           options: { wheelPropagation: false, suppressScrollX: true },
//           onScrollY: container => scrollMenu(container, true)
//         })}
//     >
//       {/* Incase you also want to scroll NavHeader to scroll with Vertical Menu, remove NavHeader from above and paste it below this comment */}
//       {/* Vertical Menu */}
//       <Menu
//         menuItemStyles={menuItemStyles(theme)}
//         renderExpandIcon={({ open }) => <RenderExpandIcon open={open} transitionDuration={transitionDuration} />}
//         renderExpandedMenuItemIcon={{ icon: <i className='ri-circle-line' /> }}
//         menuSectionStyles={menuSectionStyles(theme)}
//       >
       
//         <MenuItem
//           href={`/`}
//           icon={<i className='ri-home-smile-line' />}
//         // suffix={<Chip label='Pro' size='small' color='primary' variant='tonal' />}
//         // target='_blank'
//         >
//           {(multiLang?.menu_dashboard) ? multiLang?.menu_dashboard : "Dashboard"}
//         </MenuItem>
 
//               <MenuItem href='/leads' icon={<PeopleOutlineIcon />} >
//                 {(multiLang?.menu_leads) ? multiLang?.menu_leads : "Leads"}
//               </MenuItem>
//                <MenuItem href='/deals' icon={<ElectricBoltIcon />} >
//                 {(multiLang?.menu_deals) ? multiLang?.menu_deals : "Deals"}
//               </MenuItem>
         

          
//                <MenuItem href='/contacts' icon={<PortraitIcon />} >
//                 {(multiLang?.menu_contacts) ? multiLang?.menu_contacts : "Contacts"}
//               </MenuItem>
//               <MenuItem href='/accounts' icon={<CorporateFareIcon />}>
//                 {(multiLang?.menu_accounts) ? multiLang?.menu_accounts : "Accounts"}
//               </MenuItem>
 
//               {/* <MenuItem href='#' icon={<EventNoteIcon />}>
//                 {(multiLang?.menu_notes) ? multiLang?.menu_notes : "Notes"}
//               </MenuItem> */}
//               <MenuItem href='/tasks' icon={<TaskAltIcon />}>
//                 {(multiLang?.menu_tasks) ? multiLang?.menu_tasks : "Tasks"}
//               </MenuItem>
           

//             <SubMenu label='Customer Communications' icon={<i className='ri-service-line' />}>
              
//               <MenuItem href='#'>
//               {(multiLang?.menu_chatbot) ? multiLang?.menu_chatbot : "Chatbot"}
//               </MenuItem>  
                
//             </SubMenu>   
 

          
        
        
//           <MenuSection label=''>
//           <MenuItem  icon={<i className='ri-admin-line' />}>
//               {"ADMIN OPTIONS"}
//             </MenuItem>
          
//             <SubMenu label='User' icon={<i className='ri-user-2-fill' />}>
//               <MenuItem href='/user/users'>
//                 {(multiLang?.menu_users) ? multiLang?.menu_users : "Users"}
//               </MenuItem>
            
//               <MenuItem href='/user/roles'>
//               {(multiLang?.menu_roles) ? multiLang?.menu_roles : "Roles"}
//               </MenuItem>  
//             </SubMenu>           
//             <SubMenu label='Settings' icon={<i className='ri-settings-2-line' />}>
//               <MenuItem href='/my-company'>
//                 {(multiLang?.menu_my_company) ? multiLang?.menu_my_company : "Organization"}
//               </MenuItem>
//             </SubMenu>
//           </MenuSection>
//       </Menu>
//     </ScrollWrapper>
//   )
// }

export default VerticalMenu
