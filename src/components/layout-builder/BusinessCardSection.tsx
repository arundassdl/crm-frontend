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
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { useSelector, useDispatch } from 'react-redux';
import {
    layoutSelector,
    setBusinessCardFields,
    setBusinessCardEnabled
} from '@/store/slices/general_slices/layout-slice';

const BusinessCardSection: React.FC = () => {
    const dispatch = useDispatch();
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
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: '0.5px' }}>
                        BUSINESS CARD
                    </Typography>
                    <Switch
                        size="small"
                        checked={enabled}
                        onChange={handleToggle}
                        sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                                color: '#ffffff',
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                backgroundColor: '#2e7d32',
                            },
                        }}
                    />
                </Box>
                {enabled && (
                    <Link
                        component="button"
                        onClick={handleOpenDialog}
                        underline="none"
                        sx={{ fontSize: '0.85rem', fontWeight: 500, color: 'primary.main' }}
                    >
                        Customize
                    </Link>
                )}
            </Box>

            {enabled ? (
                <>
                    <Paper variant="outlined" sx={{ borderRadius: 1, overflow: 'hidden', borderColor: 'rgba(0,0,0,0.08)' }}>
                        <Droppable droppableId="business-card-canvas" type="BC_FIELD">
                            {(provided) => (
                                <List
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    disablePadding
                                >
                                    {businessCardFields.map((field: any, index) => {
                                        const fieldId = field.id || field.name || field.fieldname;
                                        if (!fieldId) return null;
                                        return (
                                            <Draggable key={fieldId} draggableId={fieldId} index={index}>
                                                {(dProvided, dSnapshot) => (
                                                    <ListItem
                                                        ref={dProvided.innerRef}
                                                        {...dProvided.draggableProps}
                                                        divider={index < businessCardFields.length - 1}
                                                        sx={{
                                                            py: 1.5,
                                                            px: 1.5,
                                                            bgcolor: dSnapshot.isDragging ? 'action.hover' : 'background.paper',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                        }}
                                                    >
                                                        <Box {...dProvided.dragHandleProps} sx={{ mr: 1.5, display: 'flex', color: 'text.disabled' }}>
                                                            <DragIndicator fontSize="small" />
                                                        </Box>
                                                        <ListItemText
                                                            primary={field.label || field.name || field.fieldname}
                                                            secondary={field.type || field.fieldtype || 'Text'}
                                                            primaryTypographyProps={{ variant: 'body2', color: 'text.secondary', sx: { width: 140, flexShrink: 0 } }}
                                                            secondaryTypographyProps={{ variant: 'body2', color: 'text.disabled' }}
                                                            sx={{ display: 'flex', alignItems: 'center', gap: 2, m: 0 }}
                                                        />
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
                    </Paper>
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.75, color: 'text.secondary' }}>
                        <InfoOutlined sx={{ fontSize: '1rem' }} />
                        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                            You can add up to <b>5 fields</b> to your Business Card.
                        </Typography>
                    </Box>
                </>
            ) : (
                <Paper
                    variant="outlined"
                    sx={{
                        p: 2.5,
                        bgcolor: 'rgba(76, 111, 255, 0.04)',
                        borderColor: 'rgba(76, 111, 255, 0.08)',
                        borderRadius: 1
                    }}
                >
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        Business Card cannot be customized as it is hidden.
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Turn it on to customize the fields to be shown in details page.
                    </Typography>
                </Paper>
            )}

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
