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
import { useTheme } from '@mui/material/styles';
import { CaretUp, CaretDown, Plus } from '@phosphor-icons/react';
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
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const paletteBlue = isDark ? '#93C5FD' : '#0C2472';
    const { unusedFields, availableFields, activeLayout, module: stateModule } = useSelector(layoutSelector) as any;
    const [newFieldsExpanded, setNewFieldsExpanded] = useState(true);
    const [unusedExpanded, setUnusedExpanded] = useState(true);

    const customFieldsLeft = typeof availableFields?.length === 'number' ? availableFields.length : 218;
    const moduleLower = String(stateModule ?? "").toLowerCase();
    const isTasksModule = moduleLower.includes("tasks");
    // Stage is a Deals-only field type — never offered in other modules' layouts.
    const isDealsModule = moduleLower.includes("deal");

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
        if (ft.type === "stage" && !isDealsModule) return false;
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
    ) => {
        // "New Section" renders as the dashed full-width button (reference).
        if (label === 'NEW SECTION') {
            return (
                <div
                    className={`flex items-center justify-center gap-1.5 w-full px-3 py-2 border border-dashed rounded-lg text-[12.5px] font-bold transition-colors ${
                        isDark
                            ? 'border-[#60A5FA] text-[#60A5FA] hover:bg-[#18181B]'
                            : 'border-[#4A7AE8] text-[#1D4ED8] hover:bg-[#EFF6FF]'
                    } ${snapshot.isDragging ? 'opacity-90' : ''}`}
                    style={{ cursor: disabled ? 'not-allowed' : 'grab' }}
                >
                    <Plus size={11} weight="bold" /> NEW SECTION
                </div>
            );
        }
        const sizedIcon = React.isValidElement(icon)
            ? React.cloneElement(icon as React.ReactElement<any>, {
                  sx: { fontSize: 14, color: disabled ? undefined : paletteBlue, ...(icon as React.ReactElement<any>).props?.sx },
              })
            : icon;
        return (
            <div
                className={`flex items-center gap-1.5 w-full px-2 py-1.5 border rounded-lg transition-colors text-[15px] font-medium whitespace-nowrap overflow-hidden ${
                    disabled ? 'opacity-60' : ''
                } ${
                    snapshot.isDragging
                        ? isDark
                            ? 'border-[#60A5FA] bg-[#1E293B]'
                            : 'border-[#1D4ED8] bg-[#EFF6FF]'
                        : isDark
                            ? 'border-[#3F3F46] bg-[#18181B] hover:border-[#60A5FA] hover:bg-[#1E293B]'
                            : 'border-[#E3ECFC] bg-white hover:border-[#1D4ED8] hover:bg-[#EFF6FF]'
                }`}
                style={{ color: paletteBlue, cursor: disabled ? 'not-allowed' : 'grab', pointerEvents: disabled ? 'none' : 'auto' }}
            >
                <span className="flex-shrink-0 flex items-center">{sizedIcon}</span>
                <span className="truncate">{label}</span>
                {endIcon && <span className="ml-auto flex items-center">{endIcon}</span>}
            </div>
        );
    };

    let fieldIndex = 0;

    return (
        <Box sx={{ width: 300, height: '100%', overflowY: 'auto', bgcolor: isDark ? '#0A0A0A' : '#f9fbff' }}>
            {/* New Fields section */}
            <Box>
                <button
                    onClick={() => setNewFieldsExpanded(!newFieldsExpanded)}
                    className={`flex items-center justify-between w-full px-4 py-2.5 text-[13px] font-bold uppercase tracking-wider ${isDark ? 'hover:bg-[#18181B]' : 'hover:bg-[#EFF6FF]'}`}
                    style={{ color: paletteBlue }}
                >
                    <span>New Fields</span>
                    {newFieldsExpanded ? <CaretUp size={9} weight="bold" /> : <CaretDown size={9} weight="bold" />}
                </button>

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
                                        gap: 1.5,
                                        px: 1.5,
                                        pt: 1,
                                        pb: 1.5,
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
                                    sx={{ display: 'flex', flexDirection: 'column', gap: 1, px: 1.5, pb: 1.5, pt: 0 }}
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
            <Box>
                <button
                    onClick={() => setUnusedExpanded(!unusedExpanded)}
                    className={`flex items-center justify-between w-full px-4 py-2.5 text-[13px] font-bold uppercase tracking-wider ${isDark ? 'hover:bg-[#18181B]' : 'hover:bg-[#EFF6FF]'}`}
                    style={{ color: paletteBlue }}
                >
                    <span className="flex items-center gap-2">
                        Unused Items
                        {unusedFields.length > 0 && (
                            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[11px] font-bold text-white bg-[#1D4ED8]">
                                {unusedFields.length}
                            </span>
                        )}
                    </span>
                    {unusedExpanded ? <CaretUp size={9} weight="bold" /> : <CaretDown size={9} weight="bold" />}
                </button>

                {unusedExpanded && unusedFields.length === 0 && (
                    <div className={`px-4 pb-2 text-[13px] ${isDark ? 'text-[#9CA3AF]' : 'text-slate-600'}`}>No unused items.</div>
                )}

                {unusedExpanded && unusedFields.length > 0 && (
                    <Droppable droppableId="palette-unused" type="FIELD">
                        {(provided) => (
                            <List
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                sx={{ display: 'flex', flexDirection: 'column', gap: 1, px: 1.5, pt: 1, pb: 2 }}
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
