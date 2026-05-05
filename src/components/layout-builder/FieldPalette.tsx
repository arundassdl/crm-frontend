"use client";

import React, { useState } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import {
    Box,
    Typography,
    Paper,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    IconButton,
    Badge
} from '@mui/material';
import {
    CropLandscape,
    ExpandMore,
    ChevronRight,
    Description as SingleLineIcon,
    Email as EmailIcon,
    List as PickListIcon,
    CalendarToday as DateIcon,
    Tag as NumberIcon,
    AttachMoney as CurrencyIcon,
    Percent as PercentIcon,
    CheckBox as CheckboxIcon,
    ManageSearch as LookupIcon,
    Person as UserIcon,
    Image as ImageUploadIcon,
    Subject as MultiLineIcon,
    Phone as PhoneIcon,
    ListAlt as MultiSelectIcon,
    Schedule as DateTimeIcon,
    Pin as AutoNumberIcon,
    Tag as DecimalIcon,
    Tag as LongIntegerIcon,
    Link as LinkIcon,
    Functions as FormulaIcon,
    CloudUpload as FileUploadIcon,
    Summarize as RollupSummaryIcon,
    FindInPage as MultiSelectLookupIcon,
    ViewModule as SubformIcon,
    Inbox as UnusedIcon,
    Place as AddressIcon,
    Badge as FirstNameIcon,
    StackedBarChart as StageIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { addSection, layoutSelector } from '@/store/slices/general_slices/layout-slice';

// Standard fields shown in two-column grid (order matches picture)
type StandardFieldEntry = { type: string; label: string; icon: React.ReactNode; endIcon?: React.ReactNode };
const STANDARD_FIELD_TYPES: StandardFieldEntry[] = [
    { type: 'firstname', label: 'First Name', icon: <FirstNameIcon /> },
    { type: 'text', label: 'Single Line', icon: <SingleLineIcon /> },
    { type: 'multiline', label: 'Multi-Line', icon: <MultiLineIcon /> },
    { type: 'email', label: 'Email', icon: <EmailIcon /> },
    { type: 'phone', label: 'Phone', icon: <PhoneIcon /> },
    { type: 'select', label: 'Pick List', icon: <PickListIcon /> },
    // { type: 'multiselect', label: 'Multi-Select', icon: <MultiSelectIcon /> },
    { type: 'date', label: 'Date', icon: <DateIcon /> },
    // { type: 'datetime', label: 'Date/Time', icon: <DateTimeIcon /> },
    { type: 'number', label: 'Number', icon: <NumberIcon /> },
    // { type: 'autonumber', label: 'Auto-Number', icon: <AutoNumberIcon /> },
    { type: 'currency', label: 'Currency', icon: <CurrencyIcon /> },
    // { type: 'decimal', label: 'Decimal', icon: <DecimalIcon /> },
    // { type: 'percent', label: 'Percent', icon: <PercentIcon /> },
    { type: 'longinteger', label: 'Long Integer', icon: <LongIntegerIcon /> },
    { type: 'checkbox', label: 'Checkbox', icon: <CheckboxIcon /> },
    { type: 'link', label: 'URL', icon: <LinkIcon /> },
    { type: 'address', label: 'Address', icon: <AddressIcon /> },
    { type: 'lookup', label: 'Lookup', icon: <LookupIcon /> },
    // { type: 'formula', label: 'Formula', icon: <FormulaIcon /> },
    // { type: 'user', label: 'User', icon: <UserIcon /> },
    // { type: 'fileupload', label: 'File Upload', icon: <FileUploadIcon /> },
    // { type: 'imageupload', label: 'Image Upload', icon: <ImageUploadIcon /> },
    // { type: 'rollupsummary', label: 'Rollup Summary', icon: <RollupSummaryIcon /> },
    { type: 'stage', label: 'Stage', icon: <StageIcon /> },
    { type: 'ContactLead', label: 'Contact Lead Lookup', icon: <LookupIcon /> },
    { type: 'Relatedto', label: 'Related to Lookup', icon: <LookupIcon /> },
    { type: 'Reminder', label: 'Reminder', icon: <SingleLineIcon /> },
];

// Single-column full-width rows below the grid
const SINGLE_ROW_ITEMS: { type: string; label: string; icon: React.ReactNode; disabled?: boolean }[] = [
    // { type: 'multiselectlookup', label: 'Multi-Select Lookup', icon: <MultiSelectLookupIcon />, disabled: false },
    // { type: 'subform', label: 'Subform', icon: <SubformIcon />, disabled: true },
];

const fieldItemSx = {
    width: '100%',
    p: 1.5,
    display: 'flex',
    alignItems: 'center',
    gap: 1.5,
    transition: 'all 0.2s ease',
    borderColor: 'divider',
    '&:hover': {
        borderColor: 'primary.light',
        bgcolor: 'action.hover'
    }
};

const FieldPalette: React.FC = () => {
    const dispatch = useDispatch();
    const { unusedFields, availableFields, activeLayout, module: stateModule } = useSelector(layoutSelector) as any;
    const [newFieldsExpanded, setNewFieldsExpanded] = useState(true);
    const [unusedExpanded, setUnusedExpanded] = useState(true);

    const customFieldsLeft = typeof availableFields?.length === 'number' ? availableFields.length : 218;
    const moduleLower = String(stateModule ?? "").toLowerCase();
    const isTasksModule = moduleLower.includes("tasks");

    // Only show core standard tiles if the layout doesn't already contain them.
    const existingLayoutFields = (activeLayout?.sections ?? []).flatMap((s: any) => s?.fields ?? []);
    const hasFirstNameField = existingLayoutFields.some(
        (f: any) =>
            f?.visible === false
                ? false
                : String(f?.type ?? f?.name ?? "").toLowerCase() === "firstname"
    );
    const hasStageField = existingLayoutFields.some(
        (f: any) =>
            f?.visible === false
                ? false
                : String(f?.type ?? f?.name ?? "").toLowerCase() === "stage"
    );
    const hasContactLeadField = existingLayoutFields.some(
        (f: any) =>
            f?.visible === false
                ? false
                : String(f?.type ?? f?.name ?? "").toLowerCase() === "contactlead"
    );
    const hasRelatedtoField = existingLayoutFields.some(
        (f: any) =>
            f?.visible === false
                ? false
                : String(f?.type ?? f?.name ?? "").toLowerCase() === "relatedto"
    );
    const hasReminderField = existingLayoutFields.some(
        (f: any) =>
            f?.visible === false
                ? false
                : String(f?.type ?? f?.name ?? "").toLowerCase() === "reminder"
    );

    const filteredStandardFieldTypes = STANDARD_FIELD_TYPES.filter((ft) => {
        if ((ft.type === "ContactLead" || ft.type === "Relatedto" || ft.type === "Reminder") && !isTasksModule) return false;
        if (ft.type === "firstname" && hasFirstNameField) return false;
        if (ft.type === "stage" && hasStageField) return false;
        if (ft.type === "ContactLead" && hasContactLeadField) return false;
        if (ft.type === "Relatedto" && hasRelatedtoField) return false;
        if (ft.type === "Reminder" && hasReminderField) return false;
        return true;
    });

    const renderFieldPaper = (
        icon: React.ReactNode,
        label: string,
        snapshot: { isDragging: boolean },
        _provided: unknown,
        disabled?: boolean,
        endIcon?: React.ReactNode
    ) => (
        <Paper
            variant={snapshot.isDragging ? 'elevation' : 'outlined'}
            elevation={snapshot.isDragging ? 4 : 0}
            sx={{
                ...fieldItemSx,
                cursor: disabled ? 'not-allowed' : 'grab',
                borderColor: snapshot.isDragging ? 'primary.main' : 'divider',
                opacity: disabled ? 0.6 : 1,
                pointerEvents: disabled ? 'none' : 'auto'
            }}
        >
            <ListItemIcon sx={{ minWidth: 'auto', color: disabled ? 'text.disabled' : 'primary.main' }}>
                {icon}
            </ListItemIcon>
            <ListItemText
                primary={label}
                primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
            />
            {endIcon && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, ml: 'auto' }}>
                    {endIcon}
                </Box>
            )}
        </Paper>
    );

    let fieldIndex = 0;

    return (
        <Box sx={{ width: 300, p: 2, borderRight: 1, borderColor: 'divider', height: '100%', bgcolor: 'background.paper' }}>
            {/* <Typography variant="h6" fontWeight="600" mb={2}>
                Field Palette
            </Typography> */}

            {/* New Fields section */}
            <Box sx={{ mb: 2 }}>
                <Box
                    onClick={() => setNewFieldsExpanded(!newFieldsExpanded)}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        py: 0.5,
                        '&:hover': { bgcolor: 'action.hover' },
                        borderRadius: 1
                    }}
                >
                    <IconButton size="small" sx={{ p: 0.25 }}>
                        {newFieldsExpanded ? <ExpandMore /> : <ChevronRight />}
                    </IconButton>
                    <Typography variant="body2" fontWeight="600" color="text.primary" sx={{ textTransform: 'none' }}>
                        New Fields
                    </Typography>
                </Box>

                {newFieldsExpanded && (
                    <>
                        {/* Two-column grid for standard fields */}
                        <Droppable droppableId="palette" type="FIELD" isDropDisabled={true}>
                            {(provided) => (
                                <Box
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    sx={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: 1,
                                        mt: 1,
                                        mb: 1
                                    }}
                                >
                                    {filteredStandardFieldTypes.map((field) => (
                                        <Draggable key={field.type} draggableId={`palette-${field.type}`} index={fieldIndex++}>
                                            {(fProvided, fSnapshot) => (
                                                <ListItem
                                                    ref={fProvided.innerRef}
                                                    {...fProvided.draggableProps}
                                                    {...fProvided.dragHandleProps}
                                                    disablePadding
                                                    sx={{ minWidth: 0 }}
                                                >
                                                    {renderFieldPaper(field.icon, field.label, fSnapshot, fProvided, undefined, field.endIcon)}
                                                </ListItem>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </Box>
                            )}
                        </Droppable>

                        {/* Single-column rows: Multi-Select Lookup, Subform */}
                        <List sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 1 }}>
                            {SINGLE_ROW_ITEMS.map((item) => (
                                <ListItem key={item.type} disablePadding>
                                    <Paper sx={{ ...fieldItemSx, opacity: item.disabled ? 0.6 : 1, cursor: item.disabled ? 'not-allowed' : 'default' }}>
                                        <ListItemIcon sx={{ minWidth: 'auto', color: item.disabled ? 'text.disabled' : 'primary.main' }}>
                                            {item.icon}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={item.label}
                                            primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                                        />
                                    </Paper>
                                </ListItem>
                            ))}
                        </List>

                        {/* New Section - single full-width row, SECTION type */}
                        <Droppable droppableId="palette-sections" type="SECTION" isDropDisabled={true}>
                            {(provided) => (
                                <List
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
                                >
                                    <Draggable key="add-section" draggableId="palette-add-section" index={0}>
                                        {(aProvided, aSnapshot) => (
                                            <ListItem
                                                ref={aProvided.innerRef}
                                                {...aProvided.draggableProps}
                                                {...aProvided.dragHandleProps}
                                                disablePadding
                                                onClick={() => dispatch(addSection())}
                                                sx={{ cursor: 'grab' }}
                                            >
                                                {renderFieldPaper(<CropLandscape />, 'NEW SECTION', aSnapshot, aProvided)}
                                            </ListItem>
                                        )}
                                    </Draggable>
                                    {provided.placeholder}
                                </List>
                            )}
                        </Droppable>
                    </>
                )}
            </Box>

            {/* Unused Items section */}
            <Box sx={{ mt: 2 }}>
                <Box
                    onClick={() => setUnusedExpanded(!unusedExpanded)}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        py: 0.5,
                        '&:hover': { bgcolor: 'action.hover' },
                        borderRadius: 1
                    }}
                >
                    <IconButton size="small" sx={{ p: 0.25 }}>
                        {unusedExpanded ? <ExpandMore /> : <ChevronRight />}
                    </IconButton>
                    <Typography variant="body2" fontWeight="600" color="text.primary" sx={{ textTransform: 'none', mr: 1 }}>
                        Unused Items
                    </Typography>
                    <Badge
                        badgeContent={unusedFields.length}
                        color="primary"
                        sx={{ '& .MuiBadge-badge': { fontSize: '0.7rem', minWidth: 18, height: 18 } }}
                    />
                </Box>
                {/* <Typography variant="caption" color="primary.main" sx={{ display: 'block', pl: 3.5, pt: 0.5 }}>
                    Custom Fields Left: {customFieldsLeft}
                </Typography> */}

                {unusedExpanded && unusedFields.length > 0 && (
                    <Droppable droppableId="palette-unused" type="FIELD">
                        {(provided) => (
                            <List
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1, mb: 2 }}
                            >
                                {unusedFields.map((field, index) => (
                                    <Draggable key={field.id} draggableId={`unused-${field.id}`} index={index}>
                                        {(uProvided, uSnapshot) => (
                                            <ListItem
                                                ref={uProvided.innerRef}
                                                {...uProvided.draggableProps}
                                                {...uProvided.dragHandleProps}
                                                disablePadding
                                            >
                                                <Paper
                                                    elevation={uSnapshot.isDragging ? 4 : 0}
                                                    variant={uSnapshot.isDragging ? 'elevation' : 'outlined'}
                                                    sx={{
                                                        ...fieldItemSx,
                                                        cursor: 'grab',
                                                        borderColor: uSnapshot.isDragging ? 'primary.main' : 'divider'
                                                    }}
                                                >
                                                    <ListItemIcon sx={{ minWidth: 'auto', color: 'warning.main' }}>
                                                        <UnusedIcon />
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={field.label || field.name || field.id}
                                                        primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                                                    />
                                                </Paper>
                                            </ListItem>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </List>
                        )}
                    </Droppable>
                )}
            </Box>
        </Box>
    );
};

export default FieldPalette;
