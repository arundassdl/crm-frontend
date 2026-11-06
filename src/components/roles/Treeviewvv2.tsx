// import React, { useState, useEffect } from 'react'
// import {
//   Box,
//   Paper,
//   Typography,
//   Button,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   TextField,
//   Select,
//   MenuItem,
//   FormControl,
//   InputLabel,
//   Alert,
//   Chip,
//   IconButton,
//   Tooltip,
//   Grid,
//   Card,
//   CardContent,
//   CardActions,
//   CircularProgress,
//   List,
//   ListItem,
//   ListItemText,
//   ListItemSecondaryAction
// } from '@mui/material'
// import {
//   Add,
//   Edit,
//   Delete,
//   ExpandMore,
//   ExpandLess,
//   Security,
//   AccountTree
// } from '@mui/icons-material'
// import { Collapse } from '@mui/material'
// // import { projectId } from '../../utils/supabase/info'

// // interface Role {
// //   id: string
// //   role_name: string
// //   parent_role_id?: string
// //   level: number
// //   department?: string
// //   description?: string
// //   active: boolean
// //   created_at: string
// // }

// interface Role {
//   id: string;
//   name: string;
//   level: number;
//   parent?: string;
//   children: Role[];
//   userCount: number;
//   description: string;
//   color: string;
// }


// interface RoleManagerProps {
//   user: any
//   accessToken: string
//   refreshTrigger: number
//   onRefresh: () => void
// }

// interface RoleFormData {
//   role_name: string
//   parent_role_id: string
//   department: string
//   description: string
// }

// export function RoleTreeView({ user, accessToken, refreshTrigger, onRefresh }: RoleManagerProps) {
//   // const [roles, setRoles] = useState<Role[]>([])

//   const [roles, setRoles] = useState<Role[]>([
//     {
//       id: "admin",
//       name: "Administrator",
//       level: 0,
//       children: [
//         {
//           id: "dept-head",
//           name: "Department Head", 
//           level: 1,
//           parent: "admin",
//           children: [
//             {
//               id: "manager",
//               name: "Manager",
//               level: 2,
//               parent: "dept-head",
//               children: [
//                 {
//                   id: "team-lead",
//                   name: "Team Lead",
//                   level: 3,
//                   parent: "manager",
//                   children: [
//                     {
//                       id: "executive",
//                       name: "Executive",
//                       level: 4,
//                       parent: "team-lead",
//                       children: [
//                         {
//                           id: "associate",
//                           name: "Associate",
//                           level: 5,
//                           parent: "executive",
//                           children: [
//                             {
//                               id: "intern",
//                               name: "Intern",
//                               level: 6,
//                               parent: "associate",
//                               children: [],
//                               userCount: 8,
//                               description: "Temporary learning positions",
//                               color: "role-intern"
//                             }
//                           ],
//                           userCount: 22,
//                           description: "Entry-level specialists",
//                           color: "role-associate"
//                         }
//                       ],
//                       userCount: 45,
//                       description: "Mid-level professionals",
//                       color: "role-executive"
//                     }
//                   ],
//                   userCount: 18,
//                   description: "Direct team leadership",
//                   color: "role-team-lead"
//                 }
//               ],
//               userCount: 12,
//               description: "Team and project management",
//               color: "role-manager"
//             }
//           ],
//           userCount: 6,
//           description: "Department oversight and strategy",
//           color: "role-dept-head"
//         }
//       ],
//       userCount: 2,
//       description: "Full system administration",
//       color: "role-admin"
//     }
//   ]);
  
//   const [hierarchy, setHierarchy] = useState<any>({})
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState<string | null>(null)
//   const [componentError, setComponentError] = useState<string | null>(null)
  
//   // Dialog states
//   const [isDialogOpen, setIsDialogOpen] = useState(false)
//   const [editingRole, setEditingRole] = useState<Role | null>(null)
//   const [formData, setFormData] = useState<RoleFormData>({
//     role_name: '',
//     parent_role_id: '',
//     department: '',
//     description: ''
//   })
//   const [formErrors, setFormErrors] = useState<Record<string, string>>({})

//   // Tree view state
//   const [expandedNodes, setExpandedNodes] = useState<string[]>([])

//   useEffect(() => {
//     try {
//       fetchRoles()
//     } catch (error) {
//       console.error('Error in RoleManager useEffect:', error)
//       setComponentError('Failed to initialize role manager')
//     }
//   }, [refreshTrigger])

//   // Error boundary-like error handling
//   if (componentError) {
//     return (
//       <Box sx={{ p: 3 }}>
//         <Alert severity="error" sx={{ mb: 2 }}>
//           <Typography variant="h6" gutterBottom>
//             Role Manager Error
//           </Typography>
//           <Typography variant="body2" gutterBottom>
//             {componentError}
//           </Typography>
//           <Button 
//             variant="outlined" 
//             onClick={() => {
//               setComponentError(null)
//               setError(null)
//               fetchRoles()
//             }}
//             sx={{ mt: 1 }}
//           >
//             Retry
//           </Button>
//         </Alert>
//       </Box>
//     )
//   }

//   const fetchRoles = async () => {

//     // if (!accessToken) {
//     //   setError('Authentication required. Please log in again.')
//     //   return
//     // }
    
//     // setLoading(true)
//     // setError(null)
    
//     // try {
//     //   const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-7607dae0/roles`, {
//     //     headers: {
//     //       'Content-Type': 'application/json'
//     //     }
//     //   })

//     //   if (response.ok) {
//     //     const data = await response.json()
//     //     setRoles(data.roles || [])
//     //     setHierarchy(data.hierarchy || {})
        
//     //     // Auto-expand root nodes
//     //     const rootRoles = (data.roles || []).filter((role: Role) => !role.parent_role_id)
//     //     setExpandedNodes(rootRoles.map((role: Role) => role.id))
//     //   } else {
//     //     if (response.status === 401) {
//     //       setError('Authentication failed. Please log in again.')
//     //       // Optionally trigger logout or refresh
//     //     } else {
//     //       const errorData = await response.json().catch(() => ({}))
//     //       throw new Error(errorData.error || `Failed to fetch roles (${response.status})`)
//     //     }
//     //   }
//     // } catch (error) {
//     //   console.error('Error fetching roles:', error)
//     //   if (error instanceof TypeError && error.message.includes('fetch')) {
//     //     setError('Network error. Please check your connection and try again.')
//     //   } else {
//     //     setError(error instanceof Error ? error.message : 'Failed to fetch roles')
//     //   }
//     // } finally {
//     //   setLoading(false)
//     // }
//   }

//   const handleOpenDialog = (role?: Role) => {
//     if (role) {
//       setEditingRole(role)
//       setFormData({
//         role_name: role.role_name,
//         parent_role_id: role.parent_role_id || '',
//         department: role.department || '',
//         description: role.description || ''
//       })
//     } else {
//       setEditingRole(null)
//       setFormData({
//         role_name: '',
//         parent_role_id: '',
//         department: '',
//         description: ''
//       })
//     }
//     setFormErrors({})
//     setIsDialogOpen(true)
//   }

//   const handleCloseDialog = () => {
//     setIsDialogOpen(false)
//     setEditingRole(null)
//     setFormData({
//       role_name: '',
//       parent_role_id: '',
//       department: '',
//       description: ''
//     })
//     setFormErrors({})
//   }

//   const validateForm = (): boolean => {
//     const errors: Record<string, string> = {}
    
//     if (!formData.role_name.trim()) {
//       errors.role_name = 'Role name is required'
//     } else if (roles.some(role => 
//       role.role_name.toLowerCase() === formData.role_name.toLowerCase() && 
//       role.id !== editingRole?.id
//     )) {
//       errors.role_name = 'Role name must be unique'
//     }
    
//     if (!formData.description.trim()) {
//       errors.description = 'Description is required'
//     }
    
//     setFormErrors(errors)
//     return Object.keys(errors).length === 0
//   }

//   const handleSaveRole = async () => {
//     if (!validateForm()) return
    
//     setLoading(true)
//     setError(null)
    
//     try {
//       const roleData = {
//         role_name: formData.role_name.trim(),
//         parent_role_id: formData.parent_role_id || null,
//         department: formData.department.trim() || null,
//         description: formData.description.trim(),
//         level: calculateRoleLevel(formData.parent_role_id)
//       }

//       const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-7607dae0/roles`, {
//         method: editingRole ? 'PATCH' : 'POST',
//         headers: {
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify(roleData)
//       })

//       if (response.ok) {
//         await fetchRoles()
//         onRefresh()
//         handleCloseDialog()
//       } else {
//         const errorData = await response.json()
//         throw new Error(errorData.error || 'Failed to save role')
//       }
//     } catch (error) {
//       console.error('Error saving role:', error)
//       setError(error instanceof Error ? error.message : 'Failed to save role')
//     } finally {
//       setLoading(false)
//     }
//   }

//   const calculateRoleLevel = (parentRoleId: string): number => {
//     if (!parentRoleId) return 0
//     const parentRole = roles.find(role => role.id === parentRoleId)
//     return parentRole ? parentRole.level + 1 : 0
//   }

//   const renderRoleTree = () => {
//     // Validate roles data
//     const validRoles = roles.filter(role => 
//       role && 
//       role.id && 
//       role.role_name && 
//       typeof role.level === 'number' && 
//       !isNaN(role.level)
//     )
    
//     if (validRoles.length === 0) {
//       return (
//         <Typography color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
//           No valid roles found. Create your first role to get started.
//         </Typography>
//       )
//     }
    
//     const rootRoles = validRoles.filter(role => !role.parent_role_id)
    
//     const renderRole = (role: Role, depth: number = 0, ancestors: Set<string> = new Set()): React.ReactNode => {
//       // Safety checks
//       if (!role || !role.id || !role.role_name) {
//         console.warn('Invalid role data:', role)
//         return null
//       }
      
//       // Prevent circular references
//       if (ancestors.has(role.id)) {
//         console.warn(`Circular reference detected for role: ${role.role_name}`)
//         return (
//           <Box 
//             key={`${role.id}-circular`}
//             sx={{ 
//               display: 'flex', 
//               alignItems: 'center', 
//               py: 1, 
//               pl: depth * 3,
//               backgroundColor: 'error.light',
//               color: 'error.contrastText',
//               borderRadius: 1,
//               mb: 1 
//             }}
//           >
//             <Security sx={{ mr: 1, fontSize: 18 }} color="error" />
//             <Typography variant="body1" sx={{ fontWeight: 500 }}>
//               {role.role_name || 'Unknown Role'} (Circular Reference)
//             </Typography>
//           </Box>
//         )
//       }
      
//       // Add current role to ancestors for recursion tracking
//       const newAncestors = new Set(ancestors)
//       newAncestors.add(role.id)
      
//       const children = validRoles.filter(r => r.parent_role_id === role.id)
//       const isExpanded = expandedNodes.includes(role.id)
      
//       const handleToggle = () => {
//         if (isExpanded) {
//           setExpandedNodes(prev => prev.filter(id => id !== role.id))
//         } else {
//           setExpandedNodes(prev => [...prev, role.id])
//         }
//       }
      
//       return (
//         <Box key={role.id} sx={{ mb: 1 }}>
//           <Box
//             sx={{
//               display: 'flex',
//               alignItems: 'center',
//               py: 1,
//               pl: depth * 3,
//               cursor: children.length > 0 ? 'pointer' : 'default',
//               '&:hover': { backgroundColor: 'action.hover' },
//               borderRadius: 1
//             }}
//             onClick={children.length > 0 ? handleToggle : undefined}
//           >
//             {children.length > 0 && (
//               <IconButton size="small" sx={{ mr: 1 }}>
//                 {isExpanded ? <ExpandLess /> : <ExpandMore />}
//               </IconButton>
//             )}
//             {children.length === 0 && <Box sx={{ width: 40 }} />}
            
//             <Security sx={{ mr: 1, fontSize: 18 }} color="primary" />
//             <Typography variant="body1" sx={{ fontWeight: 500, mr: 2 }}>
//               {role.role_name}
//             </Typography>
//             <Chip 
//               label={`Level ${role.level || 0}`} 
//               size="small" 
//               color="primary" 
//               variant="outlined"
//               sx={{ mr: 1 }}
//             />
//             {role.department && (
//               <Chip 
//                 label={role.department} 
//                 size="small" 
//                 color="secondary" 
//                 variant="outlined"
//                 sx={{ mr: 1 }}
//               />
//             )}
//             <Box sx={{ ml: 'auto' }}>
//               <Tooltip title="Edit Role">
//                 <IconButton 
//                   size="small" 
//                   onClick={(e) => {
//                     e.stopPropagation()
//                     handleOpenDialog(role)
//                   }}
//                 >
//                   <Edit fontSize="small" />
//                 </IconButton>
//               </Tooltip>
//             </Box>
//           </Box>
          
//           {children.length > 0 && (
//             <Collapse in={isExpanded}>
//               <Box sx={{ ml: 2 }}>
//                 {children.map(child => renderRole(child, depth + 1, newAncestors))}
//               </Box>
//             </Collapse>
//           )}
//         </Box>
//       )
//     }

//     return (
//       <Box sx={{ flexGrow: 1, overflowY: 'auto', maxHeight: '500px' }}>
//         {rootRoles.map(role => renderRole(role))}
//       </Box>
//     )
//   }

//   return (
//     <Box>
//       <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
//         <Typography variant="h5" component="h2">
//           Role Management
//         </Typography>
//         <Button
//           variant="contained"
//           startIcon={<Add />}
//           onClick={() => handleOpenDialog()}
//         >
//           Create Role
//         </Button>
//       </Box>

//       {error && (
//         <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
//           {error}
//         </Alert>
//       )}

//       <Grid container spacing={3}>
//         {/* Role Hierarchy Tree */}
//         <Grid item xs={12} md={8}>
//           <Paper sx={{ p: 3, minHeight: '600px' }}>
//             <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
//               <AccountTree sx={{ mr: 1 }} />
//               <Typography variant="h6">
//                 Role Hierarchy
//               </Typography>
//             </Box>
            
//             {loading ? (
//               <Box display="flex" justifyContent="center" py={4}>
//                 <CircularProgress />
//               </Box>
//             ) : roles.length === 0 ? (
//               <Typography color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
//                 No roles found. Create your first role to get started.
//               </Typography>
//             ) : (
//               renderRoleTree()
//             )}
//           </Paper>
//         </Grid>

//         {/* Role Statistics */}
//         <Grid item xs={12} md={4}>
//           <Paper sx={{ p: 3 }}>
//             <Typography variant="h6" gutterBottom>
//               Role Statistics
//             </Typography>
            
//             <List>
//               <ListItem key="total-roles">
//                 <ListItemText
//                   primary="Total Roles"
//                   secondary={roles.length || 0}
//                 />
//               </ListItem>
//               <ListItem key="root-roles">
//                 <ListItemText
//                   primary="Root Roles"
//                   secondary={roles.filter(r => r && !r.parent_role_id).length || 0}
//                 />
//               </ListItem>
//               <ListItem key="max-depth">
//                 <ListItemText
//                   primary="Maximum Depth"
//                   secondary={roles.length > 0 ? Math.max(...roles.filter(r => r && typeof r.level === 'number' && !isNaN(r.level)).map(r => r.level), 0) : 0}
//                 />
//               </ListItem>
//               <ListItem key="departments">
//                 <ListItemText
//                   primary="Departments"
//                   secondary={new Set(roles.filter(r => r && r.department).map(r => r.department)).size || 0}
//                 />
//               </ListItem>
//             </List>
//           </Paper>

//           {/* Quick Actions */}
//           <Paper sx={{ p: 3, mt: 2 }}>
//             <Typography variant="h6" gutterBottom>
//               Quick Actions
//             </Typography>
            
//             <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
//               <Button
//                 variant="outlined"
//                 startIcon={<Add />}
//                 onClick={() => handleOpenDialog()}
//                 fullWidth
//               >
//                 Create New Role
//               </Button>
//               <Button
//                 variant="outlined"
//                 onClick={fetchRoles}
//                 fullWidth
//               >
//                 Refresh Roles
//               </Button>
//             </Box>
//           </Paper>
//         </Grid>
//       </Grid>

//       {/* Create/Edit Role Dialog */}
//       <Dialog 
//         open={isDialogOpen} 
//         onClose={handleCloseDialog}
//         maxWidth="md"
//         fullWidth
//       >
//         <DialogTitle>
//           {editingRole ? 'Edit Role' : 'Create New Role'}
//         </DialogTitle>
        
//         <DialogContent>
//           <Box sx={{ pt: 1 }}>
//             <TextField
//               fullWidth
//               label="Role Name"
//               value={formData.role_name}
//               onChange={(e) => setFormData(prev => ({ ...prev, role_name: e.target.value }))}
//               error={!!formErrors.role_name}
//               helperText={formErrors.role_name}
//               margin="normal"
//               required
//             />

//             <FormControl fullWidth margin="normal">
//               <InputLabel>Parent Role (Optional)</InputLabel>
//               <Select
//                 value={formData.parent_role_id}
//                 onChange={(e) => setFormData(prev => ({ ...prev, parent_role_id: e.target.value as string }))}
//                 label="Parent Role (Optional)"
//               >
//                 <MenuItem value="">
//                   <em>None (Root Role)</em>
//                 </MenuItem>
//                 {roles
//                   .filter(role => role.id !== editingRole?.id) // Don't allow self-parent
//                   .map(role => (
//                     <MenuItem key={role.id} value={role.id}>
//                       {role.role_name} (Level {role.level})
//                     </MenuItem>
//                   ))}
//               </Select>
//             </FormControl>

//             <TextField
//               fullWidth
//               label="Department"
//               value={formData.department}
//               onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
//               margin="normal"
//               placeholder="e.g., Sales, Engineering, HR"
//             />

//             <TextField
//               fullWidth
//               label="Description"
//               value={formData.description}
//               onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
//               error={!!formErrors.description}
//               helperText={formErrors.description}
//               margin="normal"
//               multiline
//               rows={3}
//               required
//             />
//           </Box>
//         </DialogContent>
        
//         <DialogActions>
//           <Button onClick={handleCloseDialog}>
//             Cancel
//           </Button>
//           <Button 
//             onClick={handleSaveRole} 
//             variant="contained"
//             disabled={loading}
//             startIcon={loading ? <CircularProgress size={18} /> : null}
//           >
//             {editingRole ? 'Update Role' : 'Create Role'}
//           </Button>
//         </DialogActions>
//       </Dialog>
//     </Box>
//   )
// }
