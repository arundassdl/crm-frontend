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
import { useCrmSession } from '@/components/CrmSessionContext'

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
  // R56: sessions opened from CTRL carry the user and organization; the legacy
  // localStorage profile is empty for them.
  const crmSession = useCrmSession();
  const [tenantUser, setTenantUser] = useState<{ full_name?: string; user_image?: string } | null>(null);
  useEffect(() => {
    if (!crmSession?.userId) return;
    const params = new URLSearchParams({
      doctype: 'User',
      filters: JSON.stringify({ name: crmSession.userId }),
      fieldname: JSON.stringify(['full_name', 'user_image']),
    });
    fetch(`/api/proxy/api/method/frappe.client.get_value?${params}`, { headers: { Accept: 'application/json' } })
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (d?.message) {
          setTenantUser(d.message);
          if (d.message.user_image) setProfileImage(getFullImageUrl(d.message.user_image));
        }
      })
      .catch(() => {});
  }, [crmSession?.userId]);
  const displayName = crmSession ? tenantUser?.full_name || crmSession.userId : userData?.full_name || "User";
  const displayCaption = crmSession ? crmSession.organization : userData?.userType || "";

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
    if (crmSession) {
      // R59: global sign-out. A POST (not a link) so it cannot be triggered from another site;
      // the server ends every session and the browser lands on the Evoq One homepage.
      try { localStorage.clear(); sessionStorage.clear(); } catch {}
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = '/api/auth/logout';
      document.body.appendChild(form);
      form.submit();
      return;
    }
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
          alt={displayName}
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
                    <Avatar alt={displayName} src={profileImage} />
                    <div className='flex items-start flex-col'>
                      <Typography className='font-medium' color='text.primary' data-testid='crm-user-name'>
                        {displayName}
                      </Typography>
                      {crmSession && tenantUser?.full_name && (
                        <Typography variant='caption'>{crmSession.userId}</Typography>
                      )}
                      <Typography variant='caption' data-testid='crm-user-org'>{displayCaption}</Typography>
                    </div>
                  </div>
                  <Divider className='mlb-1' />
                  {crmSession ? (
                    <MenuItem className='gap-3' component='a' href='/api/auth/switch-org' data-testid='crm-switch-org'>
                      <i className='ri-building-line' />
                      <Typography color='text.primary'>Switch organization</Typography>
                    </MenuItem>
                  ) : (
                    <MenuItem className='gap-3' onClick={e => handleLinkClick("/my-account")}>
                      <i className='ri-user-3-line' />
                      <Typography color='text.primary'>My Account</Typography>
                    </MenuItem>
                  )}
                  <div className='flex items-center plb-2 pli-4'>
                    <Button
                      fullWidth
                      variant='contained'
                      color='error'
                      size='small'
                      endIcon={<i className='ri-logout-box-r-line' />}
                      onClick={handleClick}
                      data-testid='crm-logout'
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
