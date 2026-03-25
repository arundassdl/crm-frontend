'use client'

// React Imports
import { useRef } from 'react'

// Next Imports
import Link from 'next/link'

// MUI Imports
import { styled, useTheme } from '@mui/material/styles'

// Component Imports
import VerticalNav, { NavHeader } from '@menu/vertical-menu'
import VerticalMenu from './VerticalMenu'
import Logo from '@components/layout/shared/Logo'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'

// Style Imports
import navigationCustomStyles from '@core/styles/vertical/navigationCustomStyles'
import * as React from 'react';
import MuiDrawer from '@mui/material/Drawer';
import { useClickContext } from '@/app/GlobalProvider'



const StyledBoxForShadow = styled('div')(({ theme }) => ({
  top: 60,
  left: -8,
  zIndex: 2,
  opacity: 0,
  position: 'absolute',
  pointerEvents: 'none',
  width: 'calc(100% + 15px)',
  height: theme.mixins.toolbar.minHeight,
  transition: 'opacity .15s ease-in-out', 
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      overflow: 'auto',
  background: `linear-gradient(var(--mui-palette-background-default) 5%, rgb(var(--mui-palette-background-defaultChannel) / 0.85) 30%, rgb(var(--mui-palette-background-defaultChannel) / 0.5) 65%, rgb(var(--mui-palette-background-defaultChannel) / 0.3) 75%, transparent)`,
  '&.scrolled': {
    opacity: 1
  }
}))
const drawerWidth = 260; 

const openedMixin = (theme) => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme) => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(7)} + 30px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 30px)`,
  },
});

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
}));


const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    '& .MuiDrawer-paper': {
      transition: 'width 0.3s', // Smooth transition
      overflowX: 'hidden',
      backgroundColor: 'var(--mui-palette-background-default)',
      boxShadow: 'none',
      borderColor: 'transparent',
    },
    variants: [
      {
        props: ({ open }) => open,
        style: {
          ...openedMixin(theme),
          '& .MuiDrawer-paper': openedMixin(theme),
        },
      },
      {
        props: ({ open }) => !open,
        style: {
          ...closedMixin(theme),
          '& .MuiDrawer-paper': closedMixin(theme),
        },
      },
    ],
  }),
);

const Navigation = () => {
  // Hooks
  const theme = useTheme()
  const { isBreakpointReached, isToggled, toggleVerticalNav } = useVerticalNav()

  // Refs
  const shadowRef = useRef(null)

  const scrollMenu = (container: any, isPerfectScrollbar: boolean) => {
    container = isBreakpointReached || !isPerfectScrollbar ? container.target : container

    if (shadowRef && container.scrollTop > 0) {
      // @ts-ignore
      if (!shadowRef.current.classList.contains('scrolled')) {
        // @ts-ignore
        shadowRef.current.classList.add('scrolled')
      }
    } else {
      // @ts-ignore
      shadowRef.current.classList.remove('scrolled')
    }
  }

  const [open, setOpen] = React.useState((isBreakpointReached)?false:true);
  const { isClicked, setIsClicked } = useClickContext();
  

 
  const handleDrawerOpen = () => {
    setOpen(true);
    toggleVerticalNav(false)
    console.log("here", open);
  };

  const handleDrawerClose = (e) => {
    console.log("eeeee", open);
    if (open == true) {
      setOpen(false);
      toggleVerticalNav(true)
    } else {
      setOpen(true);
      toggleVerticalNav(true)
    }
  };

  const handleMouseEnter = () => {
    console.log("open=>", open);
    console.log("isClicked=>", isClicked);
    console.log("isClicked open=>isToggled", isToggled);

    if (open == false) {
      setOpen(true); // Expand drawer when hovered
    }
  };

  const handleMouseLeave = () => {
    console.log("isClicked<=", isClicked);
    if (open == true) {
      if (isToggled) {
        setOpen(false); // Collapse drawer when mouse leaves
      } else {
        setOpen(true);
      }
    }
  };
 
  React.useEffect(() => {
    
    console.log("isClicked uuu",isClicked);
    
    // setOpen(false); 
    
    if (!isToggled) {
      setOpen(true);
    }else{
    
      if (isClicked) {
        setOpen(true);
      } else {
        setOpen(false); 
        
      }
      if (!isClicked) {
        
        setOpen(false); 
      } 
    
  }
 
  }, [isClicked, setIsClicked]);

  React.useEffect(() => {
    setOpen(false);
    console.log("isBreakpointReached",isBreakpointReached);
  console.log("isClickedisBreakpointReached", isClicked);
    // setTimeout(() => { 
      if(isBreakpointReached==true){
        setOpen(false);
        toggleVerticalNav(true)
      }else{
        setOpen(true);
        toggleVerticalNav(false)
      }
    // }, 500);
  }, [isBreakpointReached]);
  return (
    // eslint-disable-next-line lines-around-comment
    // Sidebar Vertical Menu
    <VerticalNav onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave} customStyles={navigationCustomStyles(theme, open)}>

      <Drawer
        variant="permanent"
        sx={{
          width: open ? drawerWidth : (isBreakpointReached)?0:60, // Adjust the width based on hover state
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: open ? drawerWidth : (isBreakpointReached)?0:60,
          },
        }}
      >

        {/* Nav Header including Logo & nav toggle icons  */}

        <NavHeader>      
          {/* {(open == true && isToggled == false) ? (
            <IconButton onClick={handleDrawerClose}>
              {theme.direction === 'rtl' ? <i className='ri-menu-line text-xl cursor-pointer' onClick={handleDrawerClose} /> : <i className='ri-menu-line text-xl cursor-pointer' onClick={handleDrawerClose} />}
            </IconButton>
          ) : (
            <IconButton onClick={handleDrawerOpen}>
              {theme.direction === 'rtl' ? <i className='ri-menu-line text-xl cursor-pointer' onClick={handleDrawerOpen} /> : <i className='ri-menu-line text-xl cursor-pointer' onClick={handleDrawerOpen} />}
            </IconButton>
          )}

          <Link href='/'>
            {(open==true) && (
           <Logo />          
        )}
           
          </Link> */}
<></>
          {/* <LeftMenuDrawer open={open} /> */}
          {/* {isBreakpointReached && <i className='ri-close-line text-xl' onClick={() => toggleVerticalNav(false)} />} */}


        </NavHeader>
        <StyledBoxForShadow ref={shadowRef} />
        
        <VerticalMenu scrollMenu={scrollMenu} />

      </Drawer>
     
    </VerticalNav>

  )
}

export default Navigation
