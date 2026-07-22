import { readAccessTokenString, readRoleProfileFromStorage } from '@/utils/accessTokenDataStorage'
import React, { useEffect, useState, useCallback } from 'react';
import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, FormControl, InputLabel, Select, MenuItem, Button, Radio, CircularProgress, TextField, InputAdornment, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { MagnifyingGlass, CaretDown } from '@phosphor-icons/react';
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
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
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
            {/* Toolbar */}
            <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                    <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className={`appearance-none pl-3 pr-8 py-2 text-[13px] border rounded-lg focus:outline-none focus:border-[#1D4ED8] cursor-pointer min-w-[160px] ${isDark ? 'border-[#3F3F46] bg-[#18181B] text-[#D4D4D8]' : 'border-[#E3ECFC] bg-white text-slate-700'}`}
                    >
                        {roles.map(role => (
                            <option key={role.label} value={role.label}>{role.label}</option>
                        ))}
                    </select>
                    <CaretDown size={10} weight="bold" color="#94A3B8" className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <div className="flex-1 relative">
                    <MagnifyingGlass size={13} weight="duotone" color="#94A3B8" className="absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search Fields"
                        className={`w-full pl-8 pr-3 py-2 text-[13px] border rounded-lg focus:outline-none focus:border-[#1D4ED8] ${isDark ? 'border-[#3F3F46] bg-[#18181B] text-[#D4D4D8] placeholder:text-[#71717A]' : 'border-[#E3ECFC] bg-white text-slate-700 placeholder:text-slate-400'}`}
                    />
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving || !token}
                    className="px-4 py-2 text-[13px] font-bold text-white bg-[#1D4ED8] rounded-lg hover:bg-[#2563EB] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                    onClick={handleCreateAndEditFields}
                    className={`px-4 py-2 text-[13px] font-semibold border border-[#1D4ED8] rounded-lg transition-colors whitespace-nowrap ${isDark ? 'text-[#60A5FA] hover:bg-[#18181B]' : 'text-[#1D4ED8] hover:bg-[#EFF6FF]'}`}
                >
                    Create and Edit Fields
                </button>
            </div>

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
                <div className={`border rounded-xl overflow-hidden ${isDark ? 'border-[#27272A]' : 'border-[#E3ECFC]'}`}>
                    <table className="w-full border-collapse text-left">
                        <thead>
                            <tr className={isDark ? 'bg-[#111113] border-b border-[#27272A]' : 'bg-[#f9fbff] border-b border-[#E3ECFC]'}>
                                <th className={`px-4 py-3 text-[11.5px] font-bold uppercase tracking-wider w-[40%] ${isDark ? 'text-[#71717A]' : 'text-slate-500'}`}>Fields</th>
                                <th className={`px-4 py-3 text-[11.5px] font-bold uppercase tracking-wider text-center ${isDark ? 'text-[#71717A]' : 'text-slate-500'}`}>Read and Write</th>
                                <th className={`px-4 py-3 text-[11.5px] font-bold uppercase tracking-wider text-center ${isDark ? 'text-[#71717A]' : 'text-slate-500'}`}>Read Only</th>
                                <th className={`px-4 py-3 text-[11.5px] font-bold uppercase tracking-wider text-center ${isDark ? 'text-[#71717A]' : 'text-slate-500'}`}>Don&apos;t Show</th>
                            </tr>
                        </thead>
                        <tbody>
                            {fields.filter((field) =>
                                (field.label ?? field.fieldname ?? '')
                                    .toLowerCase()
                                    .includes(searchQuery.toLowerCase())
                            ).map((field) => {
                                const fieldname = field.fieldname ?? field.name;
                                const fieldLabel = field.label ?? fieldname ?? '—';
                                const mode = getMode(fieldname);
                                const modes: { key: 'read_write' | 'read_only' | 'hidden' }[] = [
                                    { key: 'read_write' }, { key: 'read_only' }, { key: 'hidden' },
                                ];
                                return (
                                    <tr key={fieldname} className={`border-b last:border-0 transition-colors ${isDark ? 'border-[#18181B] hover:bg-[#111113]' : 'border-[#EFF6FF] hover:bg-[#fafcff]'}`}>
                                        <td className={`px-4 py-3 text-[13px] ${isDark ? 'text-[#D4D4D8]' : 'text-slate-600'}`}>{fieldLabel}</td>
                                        {modes.map(({ key }) => {
                                            const selected = mode === key;
                                            return (
                                                <td key={key} className="px-4 py-3 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handlePermissionChange(fieldname, key)}
                                                        aria-label={`${fieldLabel} ${key}`}
                                                        className="w-5 h-5 rounded-full border-2 flex items-center justify-center mx-auto transition-colors"
                                                        style={{
                                                            borderColor: selected ? '#1D4ED8' : (isDark ? '#3F3F46' : '#CBD5E1'),
                                                            backgroundColor: selected ? '#1D4ED8' : 'transparent',
                                                        }}
                                                    >
                                                        {selected && <span className="w-2 h-2 rounded-full bg-white block" />}
                                                    </button>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </Box>
    );
};

export default FieldPermissionTab;
