'use client'

// React Imports
import { useRef, useState } from 'react'
import type { MouseEvent } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'

// MUI Imports
import { styled } from '@mui/material/styles'
import Badge from '@mui/material/Badge'
import Avatar from '@mui/material/Avatar'
import Popper from '@mui/material/Popper'
import Fade from '@mui/material/Fade'
import Paper from '@mui/material/Paper'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import MenuList from '@mui/material/MenuList'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import { useAppDispatch } from '@/libs/hooks'
import { fetchLoginUser } from '@/store/slices/auth/login_slice'
import LogoutList from '@/services/api/auth/logout_api'
import { useClickContext } from '@/app/GlobalProvider'


// Styled component for badge content
const BadgeContentSpan = styled('span')({
  width: 8,
  height: 8,
  borderRadius: '50%',
  cursor: 'pointer',
  backgroundColor: 'var(--mui-palette-success-main)',
  boxShadow: '0 0 0 2px var(--mui-palette-background-paper)'
})
import { useEffect } from 'react'; // Add this import
import { CONSTANTS } from '@/services/config/app-config'

const UserDropdown = () => {
  // States
  const [open, setOpen] = useState(false);
  // const [userData, setUserData] = useState<any>({}); // Initialize with an empty object
  const [userData, setUserData] = useState<any>(() => {
        const  userValue = JSON.parse(
          localStorage.getItem("userProfileData") || "{}"
        );
        return  userValue || "";
      });
  const { profileImage, setProfileImage } = useClickContext();
  const [LoggedIn, setLoggedIn] = useState<boolean>(false);

  // Refs
  const anchorRef = useRef<HTMLDivElement>(null);

  // Hooks
  const router = useRouter();
  const dispatch = useAppDispatch();
  const getFullImageUrl = (imagePath: string) => {
    if (!imagePath) return "";

    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath;
    }

    return `${CONSTANTS?.API_BASE_URL}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
  };

  // Use useEffect to update profileImage after the component renders
  useEffect(() => {
    console.log("userProfileDataMNEw",userData);
    
    const storedData = localStorage.getItem('userProfileData');
      
    if (userData) {
      try {
        // const parsedData = JSON.parse(storedData);
        setUserData(userData);
        const fullUrl = getFullImageUrl(userData?.user_image);
        setProfileImage(fullUrl); // Update profileImage after render
      } catch (error) {
        console.error("Error parsing JSON from localStorage", error);
      }
    }
  }, [setProfileImage]); // Add setProfileImage as a dependency

  const handleDropdownOpen = () => {
    setOpen(!open);
  };

  const handleDropdownClose = (event?: MouseEvent<HTMLLIElement> | (MouseEvent | TouchEvent), url?: string) => {
    if (url) {
      router.push(url);
    }

    if (anchorRef.current && anchorRef.current.contains(event?.target as HTMLElement)) {
      return;
    }

    setOpen(false);
  };

  const handleClick = async () => {
    let obj = {
      Logouts: true,
    };

    function deleteCookie(name) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }
    dispatch(fetchLoginUser(obj));
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('isDealer');
    localStorage.removeItem('isSuperAdmin');
    document.cookie = "isLoggedIn=false;";
    localStorage.removeItem('userCompanyData');
    deleteCookie("userCompanyData");
    deleteCookie("userProfileData");
    deleteCookie("userAddress");
    deleteCookie("isLoggedIn");
    setLoggedIn(false);
    localStorage.clear();
    router.push('/login');

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  };

  const handleBeforeUnload = async () => {
    const logoutAPI = await LogoutList();
  };

  const handleLinkClick = async (url) => {
    router.push(url);
  };

  return (
    <>
      <Badge
        ref={anchorRef}
        overlap='circular'
        badgeContent={<BadgeContentSpan onClick={handleDropdownOpen} />}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        className='mis-2'
      >
        <Avatar
          ref={anchorRef}
          alt={userData?.full_name || "User"}
          src={profileImage}
          onClick={handleDropdownOpen}
          className='cursor-pointer bs-[38px] is-[38px]'
        />
      </Badge>
      <Popper
        open={open}
        transition
        disablePortal
        placement='bottom-end'
        anchorEl={anchorRef.current}
        className='min-is-[240px] !mbs-4 z-[1]'
      >
        {({ TransitionProps, placement }) => (
          <Fade
            {...TransitionProps}
            style={{
              transformOrigin: placement === 'bottom-end' ? 'right top' : 'left top'
            }}
          >
            <Paper className='shadow-lg'>
              <ClickAwayListener onClickAway={e => handleDropdownClose(e as MouseEvent | TouchEvent)}>
                <MenuList>
                  <div className='flex items-center plb-2 pli-4 gap-2' tabIndex={-1}>
                    <Avatar alt={userData?.full_name || "User"} src={profileImage} />
                    <div className='flex items-start flex-col'>
                      <Typography className='font-medium' color='text.primary'>
                        {userData?.full_name || "User"}
                      </Typography>
                      <Typography variant='caption'>{userData?.userType || ""}</Typography>
                    </div>
                  </div>
                  <Divider className='mlb-1' />
                  <MenuItem className='gap-3' onClick={e => handleLinkClick("/my-account")}>
                    <i className='ri-user-3-line' />
                    <Typography color='text.primary'>My Account</Typography>
                  </MenuItem>
                  <div className='flex items-center plb-2 pli-4'>
                    <Button
                      fullWidth
                      variant='contained'
                      color='error'
                      size='small'
                      endIcon={<i className='ri-logout-box-r-line' />}
                      onClick={handleClick}
                      sx={{ '& .MuiButton-endIcon': { marginInlineStart: 1.5 } }}
                    >
                      Logout
                    </Button>
                  </div>
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Fade>
        )}
      </Popper>
    </>
  );
};

export default UserDropdown;
