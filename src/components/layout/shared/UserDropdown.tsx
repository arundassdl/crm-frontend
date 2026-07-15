'use client'

// React Imports
import { useEffect, useRef, useState } from 'react'
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
import { UserCircleIcon, SignOutIcon } from '@phosphor-icons/react'
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
import { CONSTANTS } from '@/services/config/app-config'
import {
  readUserProfileDataJsonString,
} from '@/utils/userProfileDataStorage'

/**
 * `get_profile` often returns `message` as an array of one user object.
 * Login stores that JSON verbatim, so localStorage may be `[{ user_image, ... }]` not `{ ... }`.
 */
function profileRecordFromStored(
  parsed: unknown
): Record<string, unknown> | null {
  if (parsed == null) return null
  if (Array.isArray(parsed)) {
    const first = parsed[0]
    if (first && typeof first === 'object' && !Array.isArray(first)) {
      return first as Record<string, unknown>
    }
    return null
  }
  if (typeof parsed === 'object') {
    return parsed as Record<string, unknown>
  }
  return null
}

type UserDropdownProps = {
  placement?: 'bottom-end' | 'right-end'
}

const UserDropdown = ({ placement = 'bottom-end' }: UserDropdownProps) => {
  // States
  const [open, setOpen] = useState(false);
  // const [userData, setUserData] = useState<any>({}); // Initialize with an empty object
  const [userData, setUserData] = useState<any>(() => {
    if (typeof window === 'undefined') return {}
    try {
      const raw = readUserProfileDataJsonString()
      if (!raw) return {}
      const parsed = JSON.parse(raw)
      return profileRecordFromStored(parsed) ?? {}
    } catch (e) {
      console.error('Failed to parse userProfileData:', e)
      return {}
    }
  })
  const { profileImage, setProfileImage } = useClickContext();
  const [LoggedIn, setLoggedIn] = useState<boolean>(false);

  // Refs
  const anchorRef = useRef<HTMLDivElement>(null);

  // Hooks
  const router = useRouter();
  const dispatch = useAppDispatch();
  const getFullImageUrl = (imagePath: string | undefined | null) => {
    if (!imagePath) return ''

    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath
    }

    const base = String(CONSTANTS?.API_BASE_URL ?? '').replace(/\/$/, '')
    const p = imagePath.startsWith('/') ? imagePath : `/${imagePath}`
    // Spaces in filenames (e.g. /files/Screenshot from 2026.png) must be encoded for <img src>
    return encodeURI(`${base}${p}`)
  }

  /** Same fields as User doc / `get_profile` — Frappe uses `user_image`; some payloads use `image`. */
  const applyAvatarFromProfile = (data: Record<string, unknown> | null | undefined) => {
    if (!data || typeof data !== 'object') return
    const path = String(data.user_image ?? data.image ?? '').trim()
    const fullUrl = path ? getFullImageUrl(path) : ''
    setProfileImage(fullUrl || '/images/avatars/5.png')
  }

  useEffect(() => {
    const syncFromStorage = () => {
      try {
        const stored = readUserProfileDataJsonString()
        if (!stored) {
          setProfileImage('/images/avatars/5.png')
          return
        }
        const parsed = JSON.parse(stored) as unknown
        const record = profileRecordFromStored(parsed)
        if (!record) {
          setProfileImage('/images/avatars/5.png')
          return
        }
        setUserData(record)
        applyAvatarFromProfile(record)
      } catch (e) {
        console.error('UserDropdown: userProfileData parse failed', e)
        setProfileImage('/images/avatars/5.png')
      }
    }

    syncFromStorage();
    window.addEventListener("storage", syncFromStorage);
    window.addEventListener("userProfileData-updated", syncFromStorage as EventListener);
    return () => {
      window.removeEventListener("storage", syncFromStorage);
      window.removeEventListener("userProfileData-updated", syncFromStorage as EventListener);
    };
  }, [setProfileImage]);

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
    localStorage.removeItem('menuListData');
    deleteCookie("menuListData");
    deleteCookie("userCompanyData");
    deleteCookie("userProfileData");
    deleteCookie("companyData");
    deleteCookie("userAddress");
    deleteCookie("isLoggedIn");
    deleteCookie("role_profile");
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
        placement={placement}
        anchorEl={anchorRef.current}
        className='min-is-[240px] !mbs-4 z-[1]'
      >
        {({ TransitionProps, placement: resolvedPlacement }) => (
          <Fade
            {...TransitionProps}
            style={{
              transformOrigin: resolvedPlacement === 'bottom-end' ? 'right top' : 'left top'
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
                  <MenuItem
                    className='gap-3'
                    onClick={e => handleLinkClick('/settings?tab=general&subtab=personal-settings')}
                  >
                    <UserCircleIcon size={18} weight='duotone' />
                    <Typography color='text.primary'>My Account</Typography>
                  </MenuItem>
                  <div className='flex items-center plb-2 pli-4'>
                    <Button
                      fullWidth
                      variant='contained'
                      color='error'
                      size='small'
                      endIcon={<SignOutIcon size={16} weight='bold' />}
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
