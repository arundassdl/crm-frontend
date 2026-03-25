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
import { useEffect, useState } from 'react'
 import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import ArticleIcon from '@mui/icons-material/Article';
import CorporateFareIcon from '@mui/icons-material/CorporateFare';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import PortraitIcon from '@mui/icons-material/Portrait';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import EventNoteIcon from '@mui/icons-material/EventNote';
import TaskAltIcon from '@mui/icons-material/TaskAlt';

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

  useEffect(() => {
    if (multiLanguagesData[0]?.value != undefined) {
      console.log("multi_lang?.multi_lang", multiLanguagesData[0]?.value);
      setMultiLang(multiLanguagesData[0]?.value);
    }

  });

  useEffect(() => {


    if (typeof window !== 'undefined') {
      if (localStorage.getItem('userProfileData') != 'undefined') {
        // alert(localStorage.getItem('userData'))
        setuserData(JSON.parse(localStorage.getItem('userProfileData') || '[]'))
      }
    }
  }, []);
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
        menuItemStyles={menuItemStyles(theme)}
        renderExpandIcon={({ open }) => <RenderExpandIcon open={open} transitionDuration={transitionDuration} />}
        renderExpandedMenuItemIcon={{ icon: <i className='ri-circle-line' /> }}
        menuSectionStyles={menuSectionStyles(theme)}
      >
       
        <MenuItem
          href={`/`}
          icon={<i className='ri-home-smile-line' />}
        // suffix={<Chip label='Pro' size='small' color='primary' variant='tonal' />}
        // target='_blank'
        >
          {(multiLang?.menu_dashboard) ? multiLang?.menu_dashboard : "Dashboard"}
        </MenuItem>
 
              <MenuItem href='/leads' icon={<PeopleOutlineIcon />} >
                {(multiLang?.menu_leads) ? multiLang?.menu_leads : "Leads"}
              </MenuItem>
               <MenuItem href='/deals' icon={<ElectricBoltIcon />} >
                {(multiLang?.menu_deals) ? multiLang?.menu_deals : "Deals"}
              </MenuItem>
         

          
               <MenuItem href='/contacts' icon={<PortraitIcon />} >
                {(multiLang?.menu_contacts) ? multiLang?.menu_contacts : "Contacts"}
              </MenuItem>
              <MenuItem href='/accounts' icon={<CorporateFareIcon />}>
                {(multiLang?.menu_accounts) ? multiLang?.menu_accounts : "Accounts"}
              </MenuItem>
 
              {/* <MenuItem href='#' icon={<EventNoteIcon />}>
                {(multiLang?.menu_notes) ? multiLang?.menu_notes : "Notes"}
              </MenuItem> */}
              <MenuItem href='/tasks' icon={<TaskAltIcon />}>
                {(multiLang?.menu_tasks) ? multiLang?.menu_tasks : "Tasks"}
              </MenuItem>
           

            <SubMenu label='Customer Communications' icon={<i className='ri-service-line' />}>
              
              <MenuItem href='#'>
              {(multiLang?.menu_chatbot) ? multiLang?.menu_chatbot : "Chatbot"}
              </MenuItem>  
                
            </SubMenu>   
 

          
        
        
          <MenuSection label=''>
          <MenuItem  icon={<i className='ri-admin-line' />}>
              {"ADMIN OPTIONS"}
            </MenuItem>
          
            <SubMenu label='User' icon={<i className='ri-user-2-fill' />}>
              <MenuItem href='/user/users'>
                {(multiLang?.menu_users) ? multiLang?.menu_users : "Users"}
              </MenuItem>
            
              <MenuItem href='/user/roles'>
              {(multiLang?.menu_roles) ? multiLang?.menu_roles : "Roles"}
              </MenuItem>  
            </SubMenu>           
            <SubMenu label='Settings' icon={<i className='ri-settings-2-line' />}>
              <MenuItem href='/my-company'>
                {(multiLang?.menu_my_company) ? multiLang?.menu_my_company : "Organization"}
              </MenuItem>
            </SubMenu>
          </MenuSection>
      </Menu>
    </ScrollWrapper>
  )
}

export default VerticalMenu
