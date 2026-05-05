import { readAccessTokenString, readRoleProfileFromStorage } from '@/utils/accessTokenDataStorage'
import React, { useEffect, useState, useCallback } from 'react';
import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, FormControl, InputLabel, Select, MenuItem, Button, Radio, CircularProgress, TextField, InputAdornment, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { getFieldPermissions, saveFieldPermissions } from '@/services/api/general_apis/permission-api';
import { getCustomFields } from '@/services/api/general_apis/custom-field-api';
import { getRole } from '@/components/Common/Form/fetchCommonData';
import { getLayoutList } from '@/services/api/general_apis/layout-api';
import { useRouter } from 'next/navigation';

interface FieldPermissionTabProps {
    module: string;
    layoutRows?: { name: string; layout_name?: string }[];
}

const FieldPermissionTab: React.FC<FieldPermissionTabProps> = ({ module, layoutRows: layoutRowsProp }) => {
    const router = useRouter();
    const [roles, setRoles] = useState<any[]>([]);
    const [selectedRole, setSelectedRole] = useState('');
    const [fields, setFields] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [permissions, setPermissions] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [openLayoutDialog, setOpenLayoutDialog] = useState(false);
    const [selectedLayoutId, setSelectedLayoutId] = useState('');
    const [layoutOptions, setLayoutOptions] = useState<{ value: string; label: string }[]>([]);

    const token = readAccessTokenString();
    const roleProfile = readRoleProfileFromStorage();

    // Fetch Roles - assuming we can fetch roles or use a static list for now, or fetch from existing API if available.
    // For now, let's assume we fetch generic User Roles or just hardcode some common ones if no API found.
    // Better: Fetch from backend. I saw 'services/api/auth/get_userrole_api.ts' in step 5.

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const res = await getRole();
                if (res && Array.isArray(res)) {
                    setRoles(res);
                    if (res.length > 0) {
                        const adminRole = res.find((r: any) => r.label === 'Administrator' || r.value === 'Administrator');
                        setSelectedRole(adminRole ? adminRole.label : res[0].label);
                    }
                }
            } catch (error) {
                console.error('Error fetching roles:', error);
            }
        };
        fetchRoles();
    }, []);

    const fetchFieldsAndPermissions = useCallback(async () => {
        if (!selectedRole || !token) return;
        setLoading(true);

        const fieldsRes = await getCustomFields(module, token);
        let extractedFields: any[] = [];
        if (fieldsRes?.layout_json) {
            const layout = typeof fieldsRes.layout_json === 'string' ? JSON.parse(fieldsRes.layout_json) : fieldsRes.layout_json;
            if (Array.isArray(layout)) {
                layout.forEach((section: any) => {
                    section.columns?.forEach((col: any) => {
                        col.fields?.forEach((field: any) => {
                            extractedFields.push({ ...field });
                        });
                    });
                });
            }
        } else if (Array.isArray(fieldsRes)) {
            extractedFields = fieldsRes;
        }
        setFields(extractedFields);

        const permRes = await getFieldPermissions(module, selectedRole, token);
        // Assuming permRes returns a map of fieldname -> permission object
        // e.g. { "field_1": { read: 1, write: 1 }, ... }
        // If empty, default to read/write based on field settings or 0.
        if (permRes && typeof permRes === 'object') {
            setPermissions(permRes);
        } else {
            setPermissions({});
        }

        setLoading(false);
    }, [module, selectedRole, token]);


    useEffect(() => {
        fetchFieldsAndPermissions();
    }, [fetchFieldsAndPermissions]);

    const handlePermissionChange = (fieldname: string, mode: 'read_write' | 'read_only' | 'hidden') => {
        setPermissions(prev => ({
            ...prev,
            [fieldname]: {
                read: mode !== 'hidden' ? 1 : 0,
                write: mode === 'read_write' ? 1 : 0,
                perm_level: 0 // Default perm level if needed
            }
        }));
    };

    const handleSave = async () => {
        if (!token) return;
        setSaving(true);
        try {
            const payload = {
                module,
                role: selectedRole,
                permissions: permissions
            };
            await saveFieldPermissions(payload, token);
        } finally {
            setSaving(false);
        }
    };

    const loadLayoutOptions = useCallback(async () => {
        if (!token || !module) return;
        const list = layoutRowsProp?.length
            ? layoutRowsProp.map((r) => ({ value: r.name, label: r.layout_name ?? r.name }))
            : await getLayoutList(module, token, roleProfile);
        setLayoutOptions(Array.isArray(list) ? list : []);
    }, [module, token, roleProfile, layoutRowsProp]);

    useEffect(() => {
        if (openLayoutDialog) {
            loadLayoutOptions();
            setSelectedLayoutId('');
        }
    }, [openLayoutDialog, loadLayoutOptions]);

    const handleCreateAndEditFields = () => setOpenLayoutDialog(true);

    const handleLayoutDialogContinue = () => {
        if (!selectedLayoutId) return;
        setOpenLayoutDialog(false);
        router.push(
            `/setup/customization/modules/${encodeURIComponent(module)}/layouts/edit/${encodeURIComponent(selectedLayoutId)}`
        );
    };

    // Helper to determine current mode
    const getMode = (fieldname: string) => {
        const perm = permissions[fieldname];
        if (!perm) return 'read_write'; // Default
        if (perm.read && perm.write) return 'read_write';
        if (perm.read && !perm.write) return 'read_only';
        return 'hidden';
    };

    return (
        <Box>
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <Select
                            labelId="select-role-label"
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                        >
                            {roles.map(role => (
                                <MenuItem key={role.label} value={role.label}>{role.label}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField
                        placeholder="Search Fields"
                        size="small"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ width: 300 }}
                    />
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="contained" onClick={handleSave} disabled={saving || !token}>
                        {saving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button variant="outlined" onClick={handleCreateAndEditFields}>
                        Create and Edit Fields
                    </Button>
                </Box>
            </Box>

            <Dialog open={openLayoutDialog} onClose={() => setOpenLayoutDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 600 }}>
                    Create and Edit Fields in Layout Editor
                </DialogTitle>
                <DialogContent>
                    <FormControl fullWidth sx={{ mt: 2 }} size="medium">
                        <InputLabel id="select-layout-label">Select Layout</InputLabel>
                        <Select
                            labelId="select-layout-label"
                            value={selectedLayoutId}
                            label="Select Layout"
                            onChange={(e) => setSelectedLayoutId(e.target.value)}
                            displayEmpty
                            renderValue={(v) => (v ? layoutOptions.find((l) => l.value === v)?.label ?? v : 'None')}
                        >
                            <MenuItem value=""><em>None</em></MenuItem>
                            {layoutOptions.map((l) => (
                                <MenuItem key={l.value} value={l.value}>{l.label}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setOpenLayoutDialog(false)} color="inherit">Cancel</Button>
                    <Button onClick={handleLayoutDialogContinue} variant="contained" color="primary" disabled={!selectedLayoutId}>
                        Continue
                    </Button>
                </DialogActions>
            </Dialog>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
            ) : (
                <TableContainer
                    component={Paper}
                    sx={{
                        mt: 2,
                        border: 1,
                        borderColor: 'divider',
                        maxHeight: 600,
                    }}
                >
                    <Table stickyHeader sx={{ minWidth: 500, tableLayout: 'fixed' }}>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600, width: '25%' }}>Fields</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600, width: '25%' }}>Read and Write</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600, width: '25%' }}>Read Only</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600, width: '25%' }}>Don't Show</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {fields.filter((field) =>
                                (field.label ?? field.fieldname ?? '')
                                    .toLowerCase()
                                    .includes(searchQuery.toLowerCase())
                            ).map((field) => {
                                const fieldname = field.fieldname ?? field.name;
                                const fieldLabel = field.label ?? fieldname ?? '—';
                                const mode = getMode(fieldname);
                                return (
                                    <TableRow key={fieldname} hover>
                                        <TableCell sx={{ width: '25%' }}>{fieldLabel}</TableCell>
                                        <TableCell align="center" padding="checkbox" sx={{ width: '25%' }}>
                                            <Radio
                                                checked={mode === 'read_write'}
                                                onChange={() => handlePermissionChange(fieldname, 'read_write')}
                                                value="read_write"
                                                name={`perm-${fieldname}`}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell align="center" padding="checkbox" sx={{ width: '25%' }}>
                                            <Radio
                                                checked={mode === 'read_only'}
                                                onChange={() => handlePermissionChange(fieldname, 'read_only')}
                                                value="read_only"
                                                name={`perm-${fieldname}`}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell align="center" padding="checkbox" sx={{ width: '25%' }}>
                                            <Radio
                                                checked={mode === 'hidden'}
                                                onChange={() => handlePermissionChange(fieldname, 'hidden')}
                                                value="hidden"
                                                name={`perm-${fieldname}`}
                                                size="small"
                                            />
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
};

export default FieldPermissionTab;
