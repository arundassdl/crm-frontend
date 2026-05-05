import { readAccessTokenDataRaw } from '@/utils/accessTokenDataStorage'
import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Switch,
  Button,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Tabs,
  Tab,
  Grid,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Backdrop,
} from "@mui/material";
import {
  Save as SaveIcon,
  Visibility as EyeIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Print as PrintIcon,
  FileUpload as ImportIcon,
  FileDownload as ExportIcon,
  Email as EmailIcon,
  Public as PublicIcon,
  Lock as LockIcon,
} from "@mui/icons-material";
import { getPermissionsMatrix, savePermissionsMatrix, getAllRoles, getAllModules } from "@/services/api/permissions/permissions-api";
import { showToast } from "@/components/ToastNotificationNew";

interface Permission {
  fullAccess: boolean;
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
  print: boolean;
  import: boolean;
  export: boolean;
  email: boolean;
  dataSharing: 'Private' | 'Public';
}

interface ModulePermissions {
  [roleName: string]: Permission;
}

interface Modules {
  [moduleName: string]: ModulePermissions;
}

const PermissionMatrix: React.FC = () => {
  const [roles, setRoles] = useState<{ name: string }[]>([]);
  const [modules, setModules] = useState<{ name: string }[]>([]);

  const [permissions, setPermissions] = useState<Modules>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tabValue, setTabValue] = useState(0);

  const [userToken, setUserToken] = useState<any>(() => {
    const initialValue = JSON.parse(
      readAccessTokenDataRaw()
    );
    return initialValue || "";
  });

  // Ref to track the scroll container
  const tableContainerRef = useRef<HTMLDivElement | null>(null);
  const tableContainerInnerRef = useRef<HTMLDivElement | null>(null);
  const topScrollbarRef = useRef<HTMLDivElement | null>(null);
  const scrollPositionRef = useRef<number>(0);
  const horizontalScrollRef = useRef<number>(0);
  const isScrollingRef = useRef<boolean>(false);
  
  // Touch/swipe gesture state
  const touchStartXRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);

  // Function to find the actual scrollable element within the table container
  const findScrollableElement = (): HTMLElement | null => {
    // First try the inner TableContainer ref
    if (tableContainerInnerRef.current) {
      const style = window.getComputedStyle(tableContainerInnerRef.current);
      if (style.overflow === 'auto' || style.overflowY === 'auto' || style.overflowX === 'auto' || 
          style.overflow === 'scroll' || style.overflowY === 'scroll' || style.overflowX === 'scroll') {
        return tableContainerInnerRef.current;
      }
    }
    
    // Fallback to checking tableContainerRef
    if (!tableContainerRef.current) return null;
    
    // Check the container itself
    const container = tableContainerRef.current;
    const style = window.getComputedStyle(container);
    if (style.overflow === 'auto' || style.overflowY === 'auto' || style.overflowX === 'auto' || 
        style.overflow === 'scroll' || style.overflowY === 'scroll' || style.overflowX === 'scroll') {
      return container;
    }
    
    // Check children recursively
    const checkElement = (element: HTMLElement): HTMLElement | null => {
      const style = window.getComputedStyle(element);
      if (style.overflow === 'auto' || style.overflowY === 'auto' || style.overflowX === 'auto' || 
          style.overflow === 'scroll' || style.overflowY === 'scroll' || style.overflowX === 'scroll') {
        return element;
      }
      for (let i = 0; i < element.children.length; i++) {
        const child = element.children[i] as HTMLElement;
        const found = checkElement(child);
        if (found) return found;
      }
      return null;
    };
    
    return checkElement(container);
  };

  // Sync scrollbars when main table scrolls
  useEffect(() => {
    if (loading || roles.length === 0) return;

    let scrollableElement: HTMLElement | null = null;
    let cleanup: (() => void) | null = null;

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      scrollableElement = findScrollableElement();
      if (!scrollableElement || !topScrollbarRef.current) return;

      const handleScroll = () => {
        if (!isScrollingRef.current) {
          isScrollingRef.current = true;
          const scrollLeft = scrollableElement!.scrollLeft;
          horizontalScrollRef.current = scrollLeft;
          
          // Sync top scrollbar
          if (topScrollbarRef.current) {
            topScrollbarRef.current.scrollLeft = scrollLeft;
          }
          
          requestAnimationFrame(() => {
            isScrollingRef.current = false;
          });
        }
      };

      scrollableElement.addEventListener('scroll', handleScroll, { passive: true });
      
      cleanup = () => {
        scrollableElement?.removeEventListener('scroll', handleScroll);
      };
    }, 100);

    return () => {
      clearTimeout(timer);
      if (cleanup) cleanup();
    };
  }, [permissions, roles.length, loading]);

  // Sync top scrollbar when it's scrolled
  useEffect(() => {
    if (loading || roles.length === 0) return;

    let topScrollbar: HTMLElement | null = null;
    let cleanup: (() => void) | null = null;

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      topScrollbar = topScrollbarRef.current;
      if (!topScrollbar) return;

      const handleTopScroll = () => {
        if (!isScrollingRef.current) {
          isScrollingRef.current = true;
          const scrollLeft = topScrollbar!.scrollLeft;
          horizontalScrollRef.current = scrollLeft;
          
          // Sync main table scroll
          const scrollableElement = findScrollableElement();
          if (scrollableElement) {
            scrollableElement.scrollLeft = scrollLeft;
          }
          
          requestAnimationFrame(() => {
            isScrollingRef.current = false;
          });
        }
      };

      topScrollbar.addEventListener('scroll', handleTopScroll, { passive: true });
      
      cleanup = () => {
        topScrollbar?.removeEventListener('scroll', handleTopScroll);
      };
    }, 100);

    return () => {
      clearTimeout(timer);
      if (cleanup) cleanup();
    };
  }, [permissions, roles.length, loading]);

  // Restore scroll position after permissions update
  useEffect(() => {
    if (scrollPositionRef.current > 0 || horizontalScrollRef.current > 0) {
      // Use requestAnimationFrame to ensure DOM has updated after state change
      requestAnimationFrame(() => {
        const scrollableElement = findScrollableElement();
        if (scrollableElement) {
          if (scrollPositionRef.current > 0) {
            scrollableElement.scrollTop = scrollPositionRef.current;
          }
          if (horizontalScrollRef.current > 0) {
            scrollableElement.scrollLeft = horizontalScrollRef.current;
            // Sync top scrollbar
            if (topScrollbarRef.current) {
              topScrollbarRef.current.scrollLeft = horizontalScrollRef.current;
            }
          }
        }
      });
    }
  }, [permissions]);

  // Touch/swipe handlers for horizontal scrolling
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    isScrollingRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartXRef.current || !touchStartYRef.current) return;
    
    const touchCurrentX = e.touches[0].clientX;
    const touchCurrentY = e.touches[0].clientY;
    const diffX = touchStartXRef.current - touchCurrentX;
    const diffY = touchStartYRef.current - touchCurrentY;
    
    // Determine if this is a horizontal or vertical scroll (with threshold)
    const isHorizontalSwipe = Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10;
    
    if (isHorizontalSwipe) {
      isScrollingRef.current = true;
      const scrollableElement = findScrollableElement();
      if (scrollableElement) {
        const newScrollLeft = scrollableElement.scrollLeft + diffX;
        scrollableElement.scrollLeft = newScrollLeft;
        horizontalScrollRef.current = newScrollLeft;
        touchStartXRef.current = touchCurrentX;
        touchStartYRef.current = touchCurrentY;
        // Prevent default only for horizontal swipes to allow smooth scrolling
        e.preventDefault();
      }
    } else if (Math.abs(diffY) > 10) {
      // Vertical scroll detected, allow normal scrolling
      isScrollingRef.current = false;
    }
  };

  const handleTouchEnd = () => {
    touchStartXRef.current = 0;
    touchStartYRef.current = 0;
    isScrollingRef.current = false;
  };

  const updatePermission = (module: string, role: string, action: keyof Permission, value: boolean) => {
    // Store current scroll position (both vertical and horizontal) before state update
    const scrollableElement = findScrollableElement();
    if (scrollableElement) {
      scrollPositionRef.current = scrollableElement.scrollTop;
      horizontalScrollRef.current = scrollableElement.scrollLeft;
    }
    
    setPermissions(prev => {
      const currentRolePerms = prev[module]?.[role] as Permission

      if (action === 'fullAccess') {
        const updated: Permission = {
          fullAccess: value,
          create: value,
          read: value,
          update: value,
          delete: value,
          print: value,
          import: value,
          export: value,
          email: value,
          // Do not change Data Sharing when toggling Full Access
          dataSharing: currentRolePerms?.dataSharing || 'Private'
        }

        return {
          ...prev,
          [module]: {
            ...prev[module],
            [role]: updated
          }
        }
      }

      if (action === 'dataSharing') {
        const updated: Permission = {
          ...currentRolePerms,
          dataSharing: value ? 'Public' : 'Private',
          // Do not alter fullAccess when only dataSharing changes
          fullAccess: currentRolePerms.fullAccess
        }

        return {
          ...prev,
          [module]: {
            ...prev[module],
            [role]: updated
          }
        }
      }

      const updated: Permission = {
        ...currentRolePerms,
        [action]: value,
        fullAccess: value ? currentRolePerms.fullAccess : false
      }

      return {
        ...prev,
        [module]: {
          ...prev[module],
          [role]: updated
        }
      }
    });
  };

  const getPermissionIcon = (hasPermission: boolean, action: keyof Permission) => {
    const onColor: any = {
      fullAccess: 'success.main',
      create: 'success.main',
      read: 'info.main',
      update: 'warning.main',
      delete: 'error.main',
      print: 'text.secondary',
      import: 'text.secondary',
      export: 'text.secondary',
      email: 'text.secondary'
    }[action]

    const offColor = 'action.disabled'

    const sx = { fontSize: 16, color: hasPermission ? onColor : offColor }

    const iconMap = {
      fullAccess: <SaveIcon sx={sx} />,
      create: <AddIcon sx={sx} />,
      read: <EyeIcon sx={sx} />,
      update: <EditIcon sx={sx} />,
      delete: <DeleteIcon sx={sx} />,
      print: <PrintIcon sx={sx} />,
      import: <ImportIcon sx={sx} />,
      export: <ExportIcon sx={sx} />,
      email: <EmailIcon sx={sx} />
    }

    return iconMap[action]
  };

  const getActionLabel = (action: keyof Permission) => {
    const map = {
      fullAccess: 'Full Access',
      create: 'Create',
      read: 'Read',
      update: 'Update',
      delete: 'Delete',
      print: 'Print',
      import: 'Import',
      export: 'Export',
      email: 'Email',
      dataSharing: 'Data Sharing'
    } as const
    return map[action]
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };


  // Load roles, modules, and permissions matrix on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load roles and modules in parallel
        const [rolesResponse, modulesResponse, permissionsResponse] = await Promise.all([
          getAllRoles(userToken?.access_token).catch((err: any) => {
            console.error('Error loading roles:', err);
            throw new Error(`Failed to load roles: ${err.message || 'Unknown error'}`);
          }),
          getAllModules(userToken?.access_token).catch((err: any) => {
            console.error('Error loading modules:', err);
            throw new Error(`Failed to load modules: ${err.message || 'Unknown error'}`);
          }),
          getPermissionsMatrix(userToken?.access_token).catch((err: any) => {
            console.error('Error loading permissions:', err);
            throw new Error(`Failed to load permissions: ${err.message || 'Unknown error'}`);
          })
        ]);
        
        // Transform roles data - handle both array of strings and array of objects
        const rolesData = rolesResponse.map(role => {
          // If role is a string, use it directly
          if (typeof role === 'string') {
            return { name: role };
          }
          // If role is an object, extract name
          return { name: role.role_name || role.name };
        });
        
        // Transform modules data - handle both array of strings and array of objects
        const modulesData = modulesResponse.map(module => {
          // If module is a string, use it directly
          if (typeof module === 'string') {
            return { name: module };
          }
          // If module is an object, extract name
          return { name: module.module_name || module.name };
        });
        console.log(rolesData, 'rolesData');
        console.log(modulesData, 'modulesData');
        console.log(permissionsResponse, 'permissionsResponse');
        setRoles(rolesData);
        setModules(modulesData);
        setPermissions(permissionsResponse.matrix || {});
      } catch (err: any) {
        console.error('Error loading data:', err);
        console.error('Error details:', {
          message: (err as any).message,
          status: (err as any).response?.status,
          data: (err as any).response?.data
        });
        setError(`Failed to load data: ${(err as any).message || 'Unknown error'}`);
        showToast(`Failed to load data: ${(err as any).message || 'Unknown error'}`, 'error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const response = await savePermissionsMatrix(userToken?.access_token, permissions);
      
      // Check if the response indicates success
      if (response && response.message && response.message.msg === 'success') {
        showToast('Permissions saved successfully', 'success');
      } else {
        // If response doesn't indicate success, treat as error
        const errorMessage = response?.message?.error || 'Unknown error occurred';
        setError(errorMessage);
        showToast(`Failed to save permissions: ${errorMessage}`, 'error');
      }
    } catch (err: any) {
      console.error('Error saving permissions:', err);
      const errorMessage = err.message || 'Failed to save permissions. Please try again.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setSaving(false);
    }
  };

  const TabPanel = ({ children, value, index, ...other }: any) => {
    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`permission-tabpanel-${index}`}
        aria-labelledby={`permission-tab-${index}`}
        {...other}
      >
        {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
      </div>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Permissions
          </Typography>
        </Box>
        
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={20} sx={{ color: 'inherit' }} /> : <SaveIcon />}
          onClick={handleSave}
          disabled={saving || loading}
          sx={{ minWidth: 150 }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </Box>

      {/* Loading backdrop when saving */}
      <Backdrop
        sx={{ 
          color: '#fff', 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: 'rgba(0, 0, 0, 0.3)'
        }}
        open={saving}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CircularProgress color="inherit" size={60} />
          <Typography variant="h6" sx={{ color: 'white' }}>
            Saving permissions...
          </Typography>
        </Box>
      </Backdrop>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress size={60} />
        </Box>
      ) : (
        <>
          <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="permission tabs">
            <Tab label="Permission Matrix" />
            <Tab label="Summary View" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <CardContent>
            {/* Top horizontal scrollbar */}
            {!loading && roles.length > 0 && (
              <Box
                ref={topScrollbarRef}
                sx={{
                  overflowX: 'auto',
                  overflowY: 'hidden',
                  height: '17px',
                  marginBottom: '4px',
                  cursor: 'grab',
                  '&:active': {
                    cursor: 'grabbing',
                  },
                  '&::-webkit-scrollbar': {
                    height: 8,
                  },
                  '&::-webkit-scrollbar-track': {
                    backgroundColor: 'rgba(0,0,0,0.1)',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    borderRadius: 4,
                    '&:hover': {
                      backgroundColor: 'rgba(0,0,0,0.5)',
                    },
                  },
                }}
              >
                <Box 
                  sx={{ 
                    height: '1px',
                    minWidth: `calc(200px + ${roles.length * 200}px)`,
                    width: `calc(200px + ${roles.length * 200}px)`
                  }} 
                />
              </Box>
            )}
            
            <Box
              ref={tableContainerRef}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              sx={{ 
                overflowX: 'auto',
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
                touchAction: 'pan-x pan-y',
                width: '100%',
                position: 'relative'
              }}
            >
              <TableContainer 
                ref={tableContainerInnerRef}
                component={Paper} 
                sx={{ 
                  maxHeight: 600,
                  overflowX: 'auto',
                  overflowY: 'auto',
                  '&::-webkit-scrollbar': {
                    height: 8,
                    width: 8,
                  },
                  '&::-webkit-scrollbar-track': {
                    backgroundColor: 'rgba(0,0,0,0.1)',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    borderRadius: 4,
                  },
                }}
              >
              <Table stickyHeader sx={{ minWidth: 400 }}>
                <TableHead sx={{ backgroundColor: 'common.white' }}>
                  <TableRow sx={{ backgroundColor: 'common.white' }}>
                    <TableCell 
                      sx={{ 
                        fontWeight: 'bold', 
                        minWidth: 120, 
                        width: 200, 
                        backgroundColor: 'common.white',
                        position: 'sticky',
                        left: 0,
                        zIndex: 3,
                        boxShadow: '2px 0 4px rgba(0,0,0,0.1)'
                      }}
                    >
                      Module
                    </TableCell>
                    {roles.map(role => (
                      <TableCell key={role.name} align="center" sx={{ minWidth: 200, width: 200, backgroundColor: 'common.white', whiteSpace: 'nowrap' }}>
                        <Chip 
                          label={role.name}
                          color="primary"
                          size="small"
                          variant="filled"
                          sx={{ color: 'common.white' }}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {modules.map(module => (
                    <TableRow key={module.name} hover>
                      <TableCell 
                        sx={{ 
                          fontWeight: 'medium', 
                          minWidth: 120, 
                          width: 200,
                          position: 'sticky',
                          left: 0,
                          zIndex: 2,
                          backgroundColor: 'background.paper',
                          boxShadow: '2px 0 4px rgba(0,0,0,0.1)'
                        }}
                      >
                        {module.name}
                      </TableCell>
                      {roles.map(role => (
                        <TableCell key={role.name} align="center" sx={{ width: 200, minWidth: 200 }}>
                          <Grid container spacing={1} sx={{ width: '100%' }}>
                            {(["fullAccess", "create", "read", "update", "delete", "print", "import", "export", "email", "dataSharing"] as const).map((action, index) => {
                              const row = Math.floor(index / 2);
                              const col = index % 2;
                              
                              return (
                                <Grid item xs={6} key={action} sx={{ display: 'flex', justifyContent: 'center' }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                    {action === 'dataSharing' ? (
                                      <>
                                        <Tooltip title={`Toggle Data Sharing for ${role.name} on ${module.name}`} arrow>
                                          <Switch
                                            checked={permissions[module.name]?.[role.name]?.dataSharing === 'Public'}
                                            onChange={(e) =>
                                              updatePermission(module.name, role.name, 'dataSharing' as any, e.target.checked)
                                            }
                                            size="small"
                                          />
                                        </Tooltip>
                                        <Tooltip
                                          title={`Data Sharing: ${permissions[module.name]?.[role.name]?.dataSharing}`}
                                          arrow
                                        >
                                          <span>
                                            {permissions[module.name]?.[role.name]?.dataSharing === 'Public' ? (
                                              <PublicIcon sx={{ fontSize: 16, color: 'success.main' }} />
                                            ) : (
                                              <LockIcon sx={{ fontSize: 16, color: 'action.disabled' }} />
                                            )}
                                          </span>
                                        </Tooltip>
                                      </>
                                    ) : (
                                      <>
                                        <Tooltip title={`Toggle ${getActionLabel(action)} for ${role.name} on ${module.name}`} arrow>
                                          <Switch
                                            checked={permissions[module.name]?.[role.name]?.[action] || false}
                                            onChange={(e) => 
                                              updatePermission(module.name, role.name, action, e.target.checked)
                                            }
                                            size="small"
                                          />
                                        </Tooltip>
                                        <Tooltip
                                          title={`${getActionLabel(action)}: ${permissions[module.name]?.[role.name]?.[action] ? 'Enabled' : 'Disabled'}`}
                                          arrow
                                        >
                                          <span>
                                            {getPermissionIcon(permissions[module.name]?.[role.name]?.[action] || false, action)}
                                          </span>
                                        </Tooltip>
                                      </>
                                    )}
                                  </Box>
                                </Grid>
                              );
                            })}
                          </Grid>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            </Box>
          </CardContent>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <CardContent>
            <Grid container spacing={3}>
              {roles.map(role => (
                <Grid item xs={12} sm={6} md={4} key={role.name}>
                  <Card variant="outlined">
                    <CardHeader
                      title={
                        <Chip 
                          label={role.name}
                          color="primary"
                          variant="filled"
                          sx={{ color: 'common.white' }}
                        />
                      }
                    />
                    <CardContent>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {modules.map(module => {
                          const rolePerms = permissions[module.name]?.[role.name];
                          const permCount = rolePerms ? 
                            Object.values(rolePerms).filter(Boolean).length : 0;
                          
                          return (
                            <Box key={module.name} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2">{module.name}</Typography>
                              <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                                {rolePerms?.fullAccess && <SaveIcon sx={{ fontSize: 16, color: "success.main" }} />}
                                {rolePerms?.create && <AddIcon sx={{ fontSize: 16, color: "success.main" }} />}
                                {rolePerms?.read && <EyeIcon sx={{ fontSize: 16, color: "info.main" }} />}
                                {rolePerms?.update && <EditIcon sx={{ fontSize: 16, color: "warning.main" }} />}
                                {rolePerms?.delete && <DeleteIcon sx={{ fontSize: 16, color: "error.main" }} />}
                                {rolePerms?.print && <PrintIcon sx={{ fontSize: 16, color: 'text.secondary' }} />}
                                {rolePerms?.import && <ImportIcon sx={{ fontSize: 16, color: 'text.secondary' }} />}
                                {rolePerms?.export && <ExportIcon sx={{ fontSize: 16, color: 'text.secondary' }} />}
                                {rolePerms?.email && <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />}
                                <Tooltip title={`Data Sharing: ${rolePerms?.dataSharing || 'Private'}`} arrow>
                                  <span>
                                    {rolePerms?.dataSharing === 'Public' ? (
                                      <PublicIcon sx={{ fontSize: 16, color: 'success.main' }} />
                                    ) : (
                                      <LockIcon sx={{ fontSize: 16, color: 'action.disabled' }} />
                                    )}
                                  </span>
                                </Tooltip>
                                {permCount === 0 && (
                                  <Typography variant="caption" color="text.secondary">
                                    None
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          );
                        })}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </TabPanel>
      </Card>

      {/* Legend */}
      <Card sx={{ mt: 3 }}>
        <CardHeader title="Permission Legend" />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={6} sm={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SaveIcon sx={{ color: 'success.main' }} />
                <Typography variant="body2">Full Access</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AddIcon sx={{ color: "success.main" }} />
                <Typography variant="body2">Create</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EyeIcon sx={{ color: "info.main" }} />
                <Typography variant="body2">Read</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EditIcon sx={{ color: "warning.main" }} />
                <Typography variant="body2">Update</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DeleteIcon sx={{ color: "error.main" }} />
                <Typography variant="body2">Delete</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PrintIcon sx={{ color: 'text.secondary' }} />
                <Typography variant="body2">Print</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ImportIcon sx={{ color: 'text.secondary' }} />
                <Typography variant="body2">Import</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ExportIcon sx={{ color: 'text.secondary' }} />
                <Typography variant="body2">Export</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EmailIcon sx={{ color: 'text.secondary' }} />
                <Typography variant="body2">Email</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PublicIcon sx={{ color: 'success.main' }} />
                <Typography variant="body2">Data Sharing (Public)</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LockIcon sx={{ color: 'action.disabled' }} />
                <Typography variant="body2">Data Sharing (Private)</Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
        </>
      )}
    </Box>
  );
};

export default PermissionMatrix;
