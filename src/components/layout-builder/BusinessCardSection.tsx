"use client";

import React, { useState, useMemo } from 'react';
import {
    Box,
    Typography,
    Switch,
    Link,
    Paper,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Checkbox,
    TextField,
    InputAdornment,
} from '@mui/material';
import { DragIndicator, InfoOutlined, Search, Close } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { DotsSixVertical, Info as InfoIcon } from '@phosphor-icons/react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { useSelector, useDispatch } from 'react-redux';
import {
    layoutSelector,
    setBusinessCardFields,
    setBusinessCardEnabled
} from '@/store/slices/general_slices/layout-slice';

const BusinessCardSection: React.FC = () => {
    const dispatch = useDispatch();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const { activeLayout, unusedFields } = useSelector(layoutSelector) as any;

    const enabled = activeLayout?.business_card_enabled ?? false;
    const selectedFieldIds = activeLayout?.business_card_fields ?? [];

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [localSelectedIds, setLocalSelectedIds] = useState<string[]>([]);

    // Get all active fields in the layout (not in unused)
    const allActiveFields = useMemo(() => {
        if (!activeLayout?.sections) return [];
        const fields: any[] = [];
        activeLayout.sections.forEach((section: any) => {
            if (section.fields) {
                section.fields.forEach((field: any) => {
                    fields.push(field);
                });
            }
        });
        return fields;
    }, [activeLayout?.sections]);

    // Map selected IDs to actual field objects for display
    const businessCardFields = useMemo(() => {
        const pool = [...allActiveFields, ...(unusedFields || [])];
        return (selectedFieldIds || [])
            .map((id: string) => {
                if (!id) return null;
                const idLower = String(id).toLowerCase().trim();
                return pool.find(f => {
                    const fname = String(f.name || f.fieldname || "").toLowerCase().trim();
                    const fid = String(f.id || "").toLowerCase().trim();
                    const flabel = String(f.label || "").toLowerCase().trim();
                    return fid === idLower || fname === idLower || flabel === idLower ||
                        fid.replace(/[-_ ]/g, "") === idLower.replace(/[-_ ]/g, "") ||
                        fname.replace(/[-_ ]/g, "") === idLower.replace(/[-_ ]/g, "");
                });
            })
            .filter(Boolean);
    }, [selectedFieldIds, allActiveFields, unusedFields]);

    const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        dispatch(setBusinessCardEnabled(e.target.checked));
    };

    const handleOpenDialog = () => {
        setLocalSelectedIds(selectedFieldIds);
        setSearchQuery('');
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
    };

    const handleSave = () => {
        dispatch(setBusinessCardFields(localSelectedIds));
        setIsDialogOpen(false);
    };

    const handleToggleField = (fieldId: string) => {
        setLocalSelectedIds(prev => {
            if (prev.includes(fieldId)) {
                return prev.filter(id => id !== fieldId);
            } else {
                if (prev.length >= 5) return prev;
                return [...prev, fieldId];
            }
        });
    };

    const allAvailableFields = useMemo(() => {
        return [...allActiveFields, ...(unusedFields || [])];
    }, [allActiveFields, unusedFields]);

    const filteredFields = allAvailableFields.filter(f =>
        (f.label || f.name || f.fieldname || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Box sx={{ mb: 4 }}>
            {/* Business Card — single card with header/toggle inside (reference) */}
            <div className={`rounded-xl border overflow-hidden ${isDark ? 'bg-[#0A0A0A] border-[#27272A]' : 'bg-white border-[#E3ECFC]'}`}>
                <div className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? 'border-[#27272A]' : 'border-[#E3ECFC]'}`}>
                    <span className={`text-[13px] font-bold uppercase tracking-wider ${isDark ? 'text-[#9CA3AF]' : 'text-slate-500'}`}>Business Card</span>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => dispatch(setBusinessCardEnabled(!enabled))}
                            aria-label="Toggle business card"
                            className={`relative inline-flex w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0 ${enabled ? 'bg-[#10B981]' : isDark ? 'bg-[#3F3F46]' : 'bg-slate-200'}`}
                        >
                            <span className={`inline-block w-[14px] h-[14px] rounded-full bg-white shadow transform transition-transform duration-200 absolute top-[3px] ${enabled ? 'translate-x-[19px]' : 'translate-x-[3px]'}`} />
                        </button>
                        {enabled && (
                            <button onClick={handleOpenDialog} className={`text-[15px] font-semibold hover:underline ${isDark ? 'text-[#60A5FA]' : 'text-[#1D4ED8]'}`}>
                                Customize
                            </button>
                        )}
                    </div>
                </div>

                {enabled ? (
                    <>
                        <Droppable droppableId="business-card-canvas" type="BC_FIELD">
                            {(provided) => (
                                <List {...provided.droppableProps} ref={provided.innerRef} disablePadding>
                                    {businessCardFields.map((field: any, index) => {
                                        const fieldId = field.id || field.name || field.fieldname;
                                        if (!fieldId) return null;
                                        return (
                                            <Draggable key={fieldId} draggableId={fieldId} index={index}>
                                                {(dProvided, dSnapshot) => (
                                                    <ListItem
                                                        ref={dProvided.innerRef}
                                                        {...dProvided.draggableProps}
                                                        disablePadding
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 1.5,
                                                            px: 2,
                                                            py: 1.25,
                                                            borderBottom: index < businessCardFields.length - 1 ? '1px solid' : 'none',
                                                            borderColor: isDark ? '#27272A' : '#EFF6FF',
                                                            bgcolor: dSnapshot.isDragging ? (isDark ? '#18181B' : '#fafcff') : 'transparent',
                                                        }}
                                                    >
                                                        <Box {...dProvided.dragHandleProps} sx={{ display: 'flex', cursor: 'grab', color: isDark ? '#71717A' : '#94A3B8' }}>
                                                            <DotsSixVertical size={14} weight="bold" />
                                                        </Box>
                                                        <span className={`text-[15px] flex-1 ${isDark ? 'text-[#D4D4D8]' : 'text-slate-700'}`}>
                                                            {field.label || field.name || field.fieldname}
                                                        </span>
                                                        <span className={`text-[13px] ${isDark ? 'text-[#71717A]' : 'text-slate-500'}`}>
                                                            {field.type || field.fieldtype || 'Text'}
                                                        </span>
                                                    </ListItem>
                                                )}
                                            </Draggable>
                                        );
                                    })}
                                    {provided.placeholder}
                                    {businessCardFields.length === 0 && (
                                        <Box sx={{ p: 3, textAlign: 'center' }}>
                                            <Typography variant="body2" color="text.secondary">
                                                No fields selected. Click Customize to add fields.
                                            </Typography>
                                        </Box>
                                    )}
                                </List>
                            )}
                        </Droppable>
                        <div className={`flex items-center gap-1.5 px-4 py-2.5 border-t text-[13px] ${isDark ? 'border-[#EFF6FF]/10 text-[#9CA3AF] border-[#27272A]' : 'border-[#EFF6FF] text-slate-600'}`}>
                            <InfoIcon size={11} weight="duotone" />
                            You can add up to <span className={`font-bold mx-0.5 ${isDark ? 'text-[#D4D4D8]' : 'text-slate-700'}`}>5 fields</span> to your Business Card.
                        </div>
                    </>
                ) : (
                    <div className={`px-4 py-4 text-[13px] ${isDark ? 'text-[#9CA3AF]' : 'text-slate-600'}`}>
                        Business Card cannot be customized as it is hidden. Turn it on to customize the fields to be shown in the details page.
                    </div>
                )}
            </div>

            {/* Customize Dialog */}
            <Dialog
                open={isDialogOpen}
                onClose={handleCloseDialog}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: 2 }
                }}
            >
                <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <TextField
                        placeholder="Search"
                        variant="standard"
                        fullWidth
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search fontSize="small" color="action" />
                                </InputAdornment>
                            ),
                            disableUnderline: false,
                        }}
                    />
                </DialogTitle>
                <DialogContent sx={{ p: 0, maxHeight: 400 }}>
                    <List disablePadding>
                        {filteredFields.map((field) => {
                            const fieldId = field.id || field.name || field.fieldname;
                            const isSelected = localSelectedIds.includes(fieldId);
                            const isDisabled = !isSelected && localSelectedIds.length >= 5;

                            return (
                                <ListItem
                                    key={fieldId}
                                    button
                                    onClick={() => handleToggleField(fieldId)}
                                    disabled={isDisabled}
                                    sx={{ py: 0.5 }}
                                >
                                    <Checkbox
                                        size="small"
                                        checked={isSelected}
                                        disabled={isDisabled}
                                        sx={{
                                            color: 'divider',
                                            '&.Mui-checked': { color: 'primary.main' }
                                        }}
                                    />
                                    <ListItemText
                                        primary={field.label || field.name || field.fieldname}
                                        primaryTypographyProps={{
                                            variant: 'body2',
                                            color: isDisabled ? 'text.disabled' : 'text.primary'
                                        }}
                                    />
                                </ListItem>
                            );
                        })}
                        {filteredFields.length === 0 && (
                            <Box sx={{ p: 3, textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary">
                                    No matching active fields.
                                </Typography>
                            </Box>
                        )}
                    </List>
                </DialogContent>
                <DialogActions sx={{ p: 2, justifyContent: 'center', gap: 1 }}>
                    <Button
                        variant="contained"
                        onClick={handleSave}
                        sx={{
                            px: 4,
                            borderRadius: 1.5,
                            textTransform: 'none',
                            bgcolor: 'primary.main',
                            '&:hover': { bgcolor: 'primary.dark' }
                        }}
                    >
                        Done
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={handleCloseDialog}
                        sx={{
                            px: 4,
                            borderRadius: 1.5,
                            textTransform: 'none',
                            color: 'text.primary',
                            borderColor: 'divider'
                        }}
                    >
                        Cancel
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default BusinessCardSection;
