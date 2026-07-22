"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import { Paper, Box, Typography, Grid, IconButton, Stack, Menu, MenuItem, InputBase, Divider, ListSubheader } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { DotsSixVertical, Gear } from '@phosphor-icons/react';
import {
    DragIndicator as DragIcon,
    Delete as DeleteIcon,
    Settings as SettingsIcon,
    MoreHoriz as MoreHorizIcon,
    Check as CheckIcon,
    ArrowDropDown as ArrowDropDownIcon,
} from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { setSelectedField, removeSection, renameSection, removeField, updateFieldProperties, updateSectionProperties, type LayoutField } from '@/store/slices/general_slices/layout-slice';

interface SectionBlockProps {
    section: any;
    index: number;
}

const ADDRESS_SUB_FIELDS = [
    'Country / Region',
    'Flat / House No. / Building / Apartment Name',
    'Street Address',
    'City',
    'State / Province',
    'Zip / Postal Code',
];
const ADDRESS_COORD_FIELDS = ['Latitude', 'Longitude'];

const ADDRESS_LABEL_TO_KEY: Record<string, string> = {
    'Country / Region': 'country',
    'Flat / House No. / Building / Apartment Name': 'flat',
    'Street Address': 'address_line1',
    City: 'city',
    'State / Province': 'state',
    'Zip / Postal Code': 'pincode',
    Latitude: 'latitude',
    Longitude: 'longitude',
};

const FIELD_TYPE_LABELS: Record<string, string> = {
    firstname: 'First Name',
    text: 'Single Text',
    textarea: 'Multi Line',
    multiline: 'Multi Line',
    email: 'Email',
    phone: 'Phone',
    mobile_no: 'Mobile No',
    number: 'Number',
    date: 'Date',
    datetime: 'Date Time',
    select: 'Option1',
    picklist: 'Option1',
    lookup: 'Lookup',
    address: 'Address',
    checkbox: 'Checkbox',
    switch: 'Switch',
    url: 'URL',
    file: 'File',
    password: 'Password',
};

const getFieldTypeLabel = (type: string) =>
    FIELD_TYPE_LABELS[type?.toLowerCase()] ?? type;

const SectionBlock: React.FC<SectionBlockProps> = ({ section, index }) => {
    const dispatch = useDispatch();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const [fieldMenuAnchor, setFieldMenuAnchor] = useState<null | HTMLElement>(null);
    const [fieldMenuContext, setFieldMenuContext] = useState<{ sectionId: string; field: any } | null>(null);
    const [addressSubFieldMenuAnchor, setAddressSubFieldMenuAnchor] = useState<null | HTMLElement>(null);
    const [addressSubFieldMenuContext, setAddressSubFieldMenuContext] = useState<{
        sectionId: string;
        field: any;
        subFieldLabel: string;
    } | null>(null);
    const [isTitleEditing, setIsTitleEditing] = useState(false);
    const [titleDraft, setTitleDraft] = useState(section.title);
    const titleInputRef = useRef<HTMLInputElement>(null);
    const [sectionMenuAnchor, setSectionMenuAnchor] = useState<null | HTMLElement>(null);

    useEffect(() => {
        if (isTitleEditing) {
            titleInputRef.current?.focus();
            titleInputRef.current?.select();
        }
    }, [isTitleEditing]);

    const commitTitleEdit = () => {
        const trimmed = titleDraft.trim();
        if (trimmed && trimmed !== section.title) {
            dispatch(renameSection({ sectionId: section.id, title: trimmed }));
        } else {
            setTitleDraft(section.title);
        }
        setIsTitleEditing(false);
    };

    const handleTitleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') commitTitleEdit();
        if (e.key === 'Escape') {
            setTitleDraft(section.title);
            setIsTitleEditing(false);
        }
    };

    const handleSectionMenuOpen = (e: React.MouseEvent<HTMLElement>) => {
        e.stopPropagation();
        setSectionMenuAnchor(e.currentTarget);
    };

    const handleSectionMenuClose = () => setSectionMenuAnchor(null);

    const handleSetColumnCount = (count: 1 | 2) => {
        dispatch(updateSectionProperties({ sectionId: section.id, column_count: count }));
        handleSectionMenuClose();
    };

    const handleSetTabOrder = (order: 'left_to_right' | 'top_to_bottom') => {
        dispatch(updateSectionProperties({ sectionId: section.id, tab_order: order }));
        handleSectionMenuClose();
    };

    const handleDelete = () => {
        handleSectionMenuClose();
        if (window.confirm('Are you sure you want to delete this section? All fields in it will also be deleted.')) {
            dispatch(removeSection(section.id));
        }
    };

    const hasCoreFields = section.fields?.some((f: any) => f.is_core);

    const handleFieldClick = (event: React.MouseEvent<HTMLElement>, field: any) => {
        setFieldMenuAnchor(event.currentTarget);
        setFieldMenuContext({ sectionId: section.id, field });
    };

    const handleFieldMenuClose = () => {
        setFieldMenuAnchor(null);
        setFieldMenuContext(null);
    };

    const handleMarkRequired = () => {
        if (!fieldMenuContext) return;
        const { sectionId, field } = fieldMenuContext;
        const nextRequired = !field.required;
        dispatch(
            updateFieldProperties({
                sectionId,
                fieldId: field.id,
                properties: { required: nextRequired }
            })
        );
        handleFieldMenuClose();
    };

    const handleSetPermission = () => {
        if (!fieldMenuContext) return;
        const { sectionId, field } = fieldMenuContext;
        const nextPermissionOnly = !(field.permission_only ?? false);
        dispatch(
            updateFieldProperties({
                sectionId,
                fieldId: field.id,
                properties: { permission_only: nextPermissionOnly }
            })
        );
        handleFieldMenuClose();
    };

    const handleEditProperties = () => {
        if (!fieldMenuContext) return;
        const { sectionId, field } = fieldMenuContext;
        dispatch(setSelectedField({ sectionId, fieldId: field.id }));
        handleFieldMenuClose();
    };

    const handleRemoveField = () => {
        if (!fieldMenuContext) return;
        const { sectionId, field } = fieldMenuContext;
        if (field.is_core) return;
        dispatch(removeField({ sectionId, fieldId: field.id }));
        dispatch(setSelectedField(null));
        handleFieldMenuClose();
    };

    const handleCustomizeSalutation = () => {
        if (!fieldMenuContext) return;
        const { sectionId, field } = fieldMenuContext;
        dispatch(setSelectedField({ sectionId, fieldId: field.id }));
        handleFieldMenuClose();
    };

    const handleAddressSubFieldMenuOpen = (e: React.MouseEvent<HTMLElement>, field: any, subFieldLabel: string) => {
        e.stopPropagation();
        setAddressSubFieldMenuAnchor(e.currentTarget);
        setAddressSubFieldMenuContext({ sectionId: section.id, field, subFieldLabel });
    };

    const handleAddressSubFieldMenuClose = () => {
        setAddressSubFieldMenuAnchor(null);
        setAddressSubFieldMenuContext(null);
    };

    const handleAddressSubFieldMarkRequired = () => {
        if (!addressSubFieldMenuContext) return;
        const { sectionId, field, subFieldLabel } = addressSubFieldMenuContext;
        const current = (field.address_required_subfields as string[]) || [];
        const isRequired = current.includes(subFieldLabel);
        const next = isRequired ? current.filter((l) => l !== subFieldLabel) : [...current, subFieldLabel];

        // Also mirror required flag into address_available_fields for this sub field
        const key = ADDRESS_LABEL_TO_KEY[subFieldLabel] || subFieldLabel;
        const existingAvailable = (field.address_available_fields as any[] | undefined) || [];
        const updatedAvailable = existingAvailable.map((cfg) =>
            cfg.key === key || cfg.label === subFieldLabel
                ? { ...cfg, required: !isRequired }
                : cfg
        );
        dispatch(
            updateFieldProperties({
                sectionId,
                fieldId: field.id,
                properties: {
                    address_required_subfields: next,
                    address_available_fields: updatedAvailable,
                } as Partial<LayoutField>
            })
        );
        handleAddressSubFieldMenuClose();
    };

    return (
        <Draggable draggableId={section.id} index={index}>
            {(provided) => (
                <Paper
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    elevation={0}
                    sx={{
                        mb: 2,
                        p: 0,
                        position: 'relative',
                        borderRadius: '12px',
                        border: '1px solid',
                        borderColor: isDark ? '#27272A' : '#E3ECFC',
                        overflow: 'hidden',
                        boxShadow: 'none',
                        bgcolor: isDark ? '#0A0A0A' : '#fff',
                    }}
                >
                    <Stack
                        {...(!isTitleEditing ? provided.dragHandleProps : {})}
                        direction="row"
                        alignItems="center"
                        spacing={1.25}
                        sx={{
                            px: 2,
                            py: 1.25,
                            borderBottom: '1px solid',
                            borderColor: isDark ? '#27272A' : '#E3ECFC',
                            bgcolor: isDark ? '#111113' : '#fafcff',
                            cursor: isTitleEditing ? 'default' : 'grab',
                            '&:active': { cursor: isTitleEditing ? 'default' : 'grabbing' },
                        }}
                    >
                        <Box sx={{ display: 'flex', color: isDark ? '#71717A' : '#94A3B8' }}>
                            <DotsSixVertical size={14} weight="bold" />
                        </Box>
                        {isTitleEditing ? (
                            <InputBase
                                inputRef={titleInputRef}
                                value={titleDraft}
                                onChange={(e) => setTitleDraft(e.target.value)}
                                onBlur={commitTitleEdit}
                                onKeyDown={handleTitleKeyDown}
                                onClick={(e) => e.stopPropagation()}
                                sx={{
                                    flexGrow: 1,
                                    fontSize: '0.8125rem',
                                    fontWeight: 700,
                                    color: isDark ? '#D4D4D8' : '#334155',
                                    px: 0.5,
                                    '& input': { padding: 0 },
                                }}
                            />
                        ) : (
                            <Typography
                                flexGrow={1}
                                onClick={(e) => { e.stopPropagation(); setTitleDraft(section.title); setIsTitleEditing(true); }}
                                sx={{ cursor: 'text', fontSize: '0.8125rem', fontWeight: 700, color: isDark ? '#D4D4D8' : '#334155' }}
                            >
                                {section.title}
                            </Typography>
                        )}
                        <IconButton
                            size="small"
                            onClick={handleSectionMenuOpen}
                            sx={{ p: 0.3, color: isDark ? '#71717A' : '#94A3B8', '&:hover': { color: isDark ? '#60A5FA' : '#1D4ED8' }, borderRadius: '6px' }}
                        >
                            <Gear size={13} weight="duotone" />
                        </IconButton>
                    </Stack>

                    <Droppable droppableId={section.id} type="FIELD">
                        {(fieldProvided, snapshot) => {
                            const colCount = section.column_count ?? 2;
                            const isSingle = colCount === 1;
                            return (
                            <Box
                                ref={fieldProvided.innerRef}
                                {...fieldProvided.droppableProps}
                                sx={{
                                    minHeight: '80px',
                                    display: 'grid',
                                    gridTemplateColumns: isSingle ? '1fr' : '1fr 1fr',
                                    gap: 1.5,
                                    bgcolor: snapshot.isDraggingOver ? (isDark ? '#111113' : '#f8faff') : 'transparent',
                                    transition: 'background-color 0.2s ease',
                                    p: 1.5,
                                }}
                            >
                                    {section.fields?.map((field: any, fieldIndex: number) =>
                                        field.type === 'address' ? (
                                            <Box key={field.id} sx={isSingle ? { gridColumn: 1 } : {}}>
                                                <Draggable draggableId={field.id} index={fieldIndex}>
                                                    {(fProvided) => (
                                                        <Paper
                                                            ref={fProvided.innerRef}
                                                            {...fProvided.draggableProps}
                                                            {...fProvided.dragHandleProps}
                                                            onClick={(e) => handleFieldClick(e, field)}
                                                            sx={{
                                                                border: '1px solid',
                                                                borderColor: 'divider',
                                                                borderRadius: 1,
                                                                overflow: 'hidden',
                                                                bgcolor: 'transparent',
                                                            }}
                                                        >
                                                            <Box
                                                                sx={{
                                                                    display: 'grid',
                                                                    gridTemplateColumns: '1fr 1fr auto',
                                                                    alignItems: 'center',
                                                                    gap: 1,
                                                                    px: 1.5,
                                                                    py: 1,
                                                                }}
                                                            >
                                                                {/* Column 1: Field Name */}
                                                                <Typography
                                                                    variant="body2"
                                                                    noWrap
                                                                    sx={{
                                                                        pl: 2,
                                                                        fontWeight: 400,
                                                                        color: field.is_core ? 'text.primary' : '#99652c',
                                                                    }}
                                                                >
                                                                    {field.label || 'Address'}
                                                                    {field.required && (
                                                                        <Box component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Box>
                                                                    )}
                                                                </Typography>

                                                                {/* Column 2: Field Type */}
                                                                <Typography
                                                                    variant="caption"
                                                                    noWrap
                                                                    sx={{ color: '#1777f069', textAlign: 'left', fontWeight: 400 }}
                                                                >
                                                                    Address
                                                                </Typography>

                                                                {/* Column 3: More options */}
                                                                <IconButton
                                                                    size="small"
                                                                    aria-label="Address field settings"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleFieldClick(e, field);
                                                                    }}
                                                                >
                                                                    <MoreHorizIcon fontSize="small" />
                                                                </IconButton>
                                                            </Box>
                                                            <Stack sx={{ p: 1.5 }} spacing={1}>
                                                                {ADDRESS_SUB_FIELDS.map((subLabel) => {
                                                                    const isSubRequired = (field.address_required_subfields as string[] | undefined)?.includes(subLabel);
                                                                    const key = ADDRESS_LABEL_TO_KEY[subLabel] || subLabel;
                                                                    const availableConfig = (field.address_available_fields as any[] | undefined) || [];
                                                                    const configEntry = availableConfig.find(
                                                                        (cfg) => cfg.key === key || cfg.label === subLabel
                                                                    );
                                                                    const isVisible = configEntry
                                                                        ? configEntry.visible !== false && configEntry.enabled !== false
                                                                        : true;
                                                                    if (!isVisible) return null;
                                                                    return (
                                                                        <Box
                                                                            key={subLabel}
                                                                            sx={{
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'space-between',
                                                                                px: 1.5,
                                                                                py: 1,
                                                                                borderRadius: 1,
                                                                                border: '1px solid',
                                                                                borderColor: 'divider',
                                                                            }}
                                                                        >
                                                                            <Typography variant="body2" color="text.secondary">
                                                                                {subLabel}
                                                                                {isSubRequired && (
                                                                                    <Box component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Box>
                                                                                )}
                                                                            </Typography>
                                                                            <IconButton
                                                                                size="small"
                                                                                sx={{ p: 0.5 }}
                                                                                aria-label={`${subLabel} options`}
                                                                                onClick={(e) => handleAddressSubFieldMenuOpen(e, field, subLabel)}
                                                                            >
                                                                                <MoreHorizIcon sx={{ fontSize: 18 }} />
                                                                            </IconButton>
                                                                        </Box>
                                                                    );
                                                                })}
                                                                <Grid container spacing={1}>
                                                                    {ADDRESS_COORD_FIELDS.map((coordLabel) => {
                                                                        const isSubRequired = (field.address_required_subfields as string[] | undefined)?.includes(coordLabel);
                                                                        const key = ADDRESS_LABEL_TO_KEY[coordLabel] || coordLabel;
                                                                        const availableConfig = (field.address_available_fields as any[] | undefined) || [];
                                                                        const configEntry = availableConfig.find(
                                                                            (cfg) => cfg.key === key || cfg.label === coordLabel
                                                                        );
                                                                        const isVisible = configEntry
                                                                            ? configEntry.visible !== false && configEntry.enabled !== false
                                                                            : true;
                                                                        if (!isVisible) return null;
                                                                        return (
                                                                            <Grid item xs={6} key={coordLabel}>
                                                                                <Box
                                                                                    sx={{
                                                                                        display: 'flex',
                                                                                        alignItems: 'center',
                                                                                        justifyContent: 'space-between',
                                                                                        px: 1.5,
                                                                                        py: 1,
                                                                                        border: '1px solid',
                                                                                        borderColor: 'divider',
                                                                                        borderRadius: 1,
                                                                                    }}
                                                                                >
                                                                                    <Typography variant="body2" color="text.secondary">
                                                                                        {coordLabel}
                                                                                        {isSubRequired && (
                                                                                            <Box component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Box>
                                                                                        )}
                                                                                    </Typography>
                                                                                    <IconButton
                                                                                        size="small"
                                                                                        sx={{ p: 0.5 }}
                                                                                        aria-label={`${coordLabel} options`}
                                                                                        onClick={(e) => handleAddressSubFieldMenuOpen(e, field, coordLabel)}
                                                                                    >
                                                                                        <MoreHorizIcon sx={{ fontSize: 18 }} />
                                                                                    </IconButton>
                                                                                </Box>
                                                                            </Grid>
                                                                        );
                                                                    })}
                                                                </Grid>
                                                            </Stack>
                                                        </Paper>
                                                    )}
                                                </Draggable>
                                            </Box>
                                        ) : field.type === 'firstname' ? (
                                            /* ── First Name composite field ── */
                                            <Box key={field.id} sx={isSingle ? { gridColumn: 1 } : {}}>
                                                <Draggable draggableId={field.id} index={fieldIndex}>
                                                    {(fProvided) => (
                                                        <Paper
                                                            ref={fProvided.innerRef}
                                                            {...fProvided.draggableProps}
                                                            {...fProvided.dragHandleProps}
                                                            onClick={(e) => handleFieldClick(e, field)}
                                                            sx={{
                                                                px: 1.5,
                                                                py: 1,
                                                                display: 'grid',
                                                                gridTemplateColumns: '1fr 1fr auto',
                                                                alignItems: 'center',
                                                                gap: 1,
                                                                bgcolor: 'transparent',
                                                                border: '1px solid',
                                                                borderColor: 'divider',
                                                            }}
                                                        >
                                                            {/* Col 1: Field label */}
                                                            <Typography
                                                                variant="body2"
                                                                noWrap
                                                                sx={{ pl: 2, fontWeight: 400, color: field.is_core ? 'text.primary' : '#99652c' }}
                                                            >
                                                                {field.label || 'First Name'}
                                                                {field.required && (
                                                                    <Box component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Box>
                                                                )}
                                                            </Typography>

                                                            {/* Col 2: Salutation chip + "Single Line" */}
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, pointerEvents: 'none' }}>
                                                                <Box
                                                                    sx={{
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        border: '1px solid',
                                                                        borderColor: 'divider',
                                                                        borderRadius: '4px',
                                                                        px: 0.75,
                                                                        py: 0.25,
                                                                        bgcolor: 'background.paper',
                                                                    }}
                                                                >
                                                                    <Typography variant="caption" sx={{ color: '#1777f069', fontWeight: 400 }}>
                                                                        {(field.salutation_options as string[] | undefined)?.[0] ?? 'Mr.'}
                                                                    </Typography>
                                                                    <ArrowDropDownIcon sx={{ fontSize: 14, color: '#1777f069' }} />
                                                                </Box>
                                                                <Typography variant="caption" sx={{ color: '#1777f069', fontWeight: 400 }}>
                                                                    Single Line
                                                                </Typography>
                                                            </Box>

                                                            {/* Col 3: More options */}
                                                            <IconButton
                                                                size="small"
                                                                onClick={(e) => { e.stopPropagation(); handleFieldClick(e, field); }}
                                                            >
                                                                <MoreHorizIcon fontSize="small" />
                                                            </IconButton>
                                                        </Paper>
                                                    )}
                                                </Draggable>
                                            </Box>
                                        ) : (
                                            <Box key={field.id} sx={isSingle ? { gridColumn: 1 } : {}}>
                                                <Draggable draggableId={field.id} index={fieldIndex}>
                                                    {(fProvided) => (
                                                        <Paper
                                                            ref={fProvided.innerRef}
                                                            {...fProvided.draggableProps}
                                                            {...fProvided.dragHandleProps}
                                                            onClick={(e) => handleFieldClick(e, field)}
                                                            sx={{
                                                                px: 1.5,
                                                                py: 1,
                                                                display: 'grid',
                                                                gridTemplateColumns: '1fr 1fr auto',
                                                                alignItems: 'center',
                                                                gap: 1,
                                                                bgcolor: 'transparent',
                                                                border: '1px solid',
                                                                borderColor: 'divider',
                                                            }}
                                                        >
                                                            {/* Column 1: Field Name */}
                                                            <Typography
                                                                variant="body2"
                                                                noWrap
                                                                sx={{
                                                                    pl: 2,
                                                                    fontWeight: 400,
                                                                    color: field.is_core ? 'text.primary' : '#99652c', 
                                                                }}
                                                            >
                                                                {field.label}
                                                                {field.required && (
                                                                    <Box component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Box>
                                                                )}
                                                            </Typography>

                                                            {/* Column 2: Field Type */}
                                                            {(['picklist', 'select'].includes(field.type)) ? (
                                                                /* Picklist — bordered dropdown widget */
                                                                <Box
                                                                    sx={{
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        border: '1px solid',
                                                                        borderColor: 'divider',
                                                                        borderRadius: '4px',
                                                                        px: 0.75,
                                                                        py: 0.25,
                                                                        maxWidth: 'fit-content',
                                                                        bgcolor: 'background.paper',
                                                                        pointerEvents: 'none',
                                                                    }}
                                                                >
                                                                    <Typography
                                                                        variant="caption"
                                                                        noWrap
                                                                        sx={{ color: '#1777f069', fontWeight: 400, lineHeight: 1.4 }}
                                                                    >
                                                                        Option 1
                                                                    </Typography>
                                                                    <ArrowDropDownIcon sx={{ fontSize: 16, color: 'text.secondary', ml: 0.25 }} />
                                                                </Box>
                                                            ) : (['textarea', 'multiline'].includes(field.type)) ? (
                                                                /* Multi-line — bordered textarea widget */
                                                                <Box
                                                                    sx={{
                                                                        display: 'inline-flex',
                                                                        alignItems: 'flex-start',
                                                                        border: '1px solid',
                                                                        borderColor: 'divider',
                                                                        borderRadius: '4px',
                                                                        px: 0.75,
                                                                        pt: 0.5,
                                                                        minWidth: 80,
                                                                        height: 56,
                                                                        bgcolor: 'background.paper',
                                                                        pointerEvents: 'none',
                                                                    }}
                                                                >
                                                                    <Typography
                                                                        variant="caption"
                                                                        noWrap
                                                                        sx={{ color: '#1777f069', fontWeight: 400, lineHeight: 1.4, alignSelf: 'flex-start' }}
                                                                    >
                                                                        Multi-Line
                                                                    </Typography>
                                                                </Box>
                                                            ) : (
                                                                <Typography
                                                                    variant="caption"
                                                                    noWrap
                                                                    sx={{
                                                                        color: '#1777f069',
                                                                        textAlign: 'left',
                                                                        fontWeight: 400,
                                                                    }}
                                                                >
                                                                    {getFieldTypeLabel(field.type)}
                                                                </Typography>
                                                            )}

                                                            {/* Column 3: More options */}
                                                            <IconButton
                                                                size="small"
                                                                aria-label="Field settings"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleFieldClick(e, field);
                                                                }}
                                                            >
                                                                <MoreHorizIcon fontSize="small" />
                                                            </IconButton>
                                                        </Paper>
                                                    )}
                                                </Draggable>
                                            </Box>
                                        )
                                    )}
                                {fieldProvided.placeholder}
                            </Box>
                            );
                        }}
                    </Droppable>
                    {/* Section settings menu */}
                    <Menu
                        anchorEl={sectionMenuAnchor}
                        open={Boolean(sectionMenuAnchor)}
                        onClose={handleSectionMenuClose}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                        slotProps={{ paper: { sx: { minWidth: 200 } } }}
                    >
                        {/* ── Section Layout ── */}
                        <ListSubheader sx={{ lineHeight: '32px', fontSize: '0.75rem', color: 'text.secondary' }}>
                            Section Layout
                        </ListSubheader>
                        <MenuItem onClick={() => handleSetColumnCount(1)} sx={{ pl: 3 }}>
                            {(section.column_count ?? 2) === 1
                                ? <CheckIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                                : <Box sx={{ width: 24, mr: 1 }} />}
                            Single Column
                        </MenuItem>
                        <MenuItem onClick={() => handleSetColumnCount(2)} sx={{ pl: 3 }}>
                            {(section.column_count ?? 2) === 2
                                ? <CheckIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                                : <Box sx={{ width: 24, mr: 1 }} />}
                            Double Column
                        </MenuItem>

                        {/* ── Tab Order (disabled in single-column mode) ── */}
                        <ListSubheader sx={{ lineHeight: '32px', fontSize: '0.75rem', color: 'text.secondary' }}>
                            Tab Order
                        </ListSubheader>
                        <MenuItem
                            disabled={(section.column_count ?? 2) === 1}
                            onClick={() => handleSetTabOrder('left_to_right')}
                            sx={{ pl: 3 }}
                        >
                            {/* show check only when double-column AND left_to_right is active */}
                            {(section.column_count ?? 2) === 2 && (section.tab_order ?? 'left_to_right') === 'left_to_right'
                                ? <CheckIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                                : <Box sx={{ width: 24, mr: 1 }} />}
                            Left to Right
                        </MenuItem>
                        <MenuItem
                            disabled={(section.column_count ?? 2) === 1}
                            onClick={() => handleSetTabOrder('top_to_bottom')}
                            sx={{ pl: 3 }}
                        >
                            {/* show check only when double-column AND top_to_bottom is active */}
                            {(section.column_count ?? 2) === 2 && (section.tab_order ?? 'left_to_right') === 'top_to_bottom'
                                ? <CheckIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                                : <Box sx={{ width: 24, mr: 1 }} />}
                            Top to Bottom
                        </MenuItem>

                        {!section.is_core && !hasCoreFields && [
                            <Divider key="div" />,
                            <MenuItem key="delete" onClick={handleDelete} sx={{ color: 'error.main', pl: 3 }}>
                                <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                                Delete
                            </MenuItem>
                        ]}
                    </Menu>

                    <Menu
                        anchorEl={fieldMenuAnchor}
                        open={Boolean(fieldMenuAnchor)}
                        onClose={handleFieldMenuClose}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    >
                        <MenuItem onClick={handleMarkRequired}>
                            {fieldMenuContext?.field?.required ? 'Unmark as Required' : 'Mark as Required'}
                        </MenuItem>
                        <MenuItem onClick={handleSetPermission}>
                            {fieldMenuContext?.field?.permission_only ? 'Unset Permission' : 'Set Permissions'}
                        </MenuItem>
                        {fieldMenuContext?.field?.type === 'firstname' ? (
                            <MenuItem onClick={handleCustomizeSalutation}>
                                Customize Salutation
                            </MenuItem>
                        ) : (
                            <MenuItem onClick={handleEditProperties}>
                                Edit Properties
                            </MenuItem>
                        )}
                        {!(fieldMenuContext?.field?.is_core ?? false) && (
                            <MenuItem onClick={handleRemoveField} sx={{ color: 'error.main' }}>
                                Remove Field
                            </MenuItem>
                        )}
                    </Menu>
                    <Menu
                        anchorEl={addressSubFieldMenuAnchor}
                        open={Boolean(addressSubFieldMenuAnchor)}
                        onClose={handleAddressSubFieldMenuClose}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    >
                        <MenuItem onClick={handleAddressSubFieldMarkRequired}>
                            {addressSubFieldMenuContext &&
                            (addressSubFieldMenuContext.field.address_required_subfields as string[] | undefined)?.includes(
                                addressSubFieldMenuContext.subFieldLabel
                            )
                                ? 'Unmark as required'
                                : 'Mark as required'}
                        </MenuItem>
                    </Menu>
                </Paper>
            )}
        </Draggable>
    );
};

export default SectionBlock;
