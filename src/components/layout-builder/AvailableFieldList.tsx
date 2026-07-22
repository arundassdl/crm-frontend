import React from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Box, Paper, TextField, Typography, IconButton, InputAdornment } from '@mui/material';
import {
    Description as SingleLineIcon,
    Email as EmailIcon,
    List as PickListIcon,
    CalendarToday as DateIcon,
    Tag as NumberIcon,
    AttachMoney as CurrencyIcon,
    CheckBox as CheckboxIcon,
    ManageSearch as LookupIcon,
    Subject as MultiLineIcon,
    Phone as PhoneIcon,
    Link as LinkIcon,
    Place as AddressIcon,
    Badge as FirstNameIcon,
    Search as SearchIcon,
    Close as CloseIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { MagnifyingGlass, DotsSixVertical } from '@phosphor-icons/react';
import FieldItem from './FieldItem';

type AvailableField = {
    fieldname: string;
    label: string;
    fieldType: string;
    required?: boolean;
};

export type AvailableFieldBySection = {
    sectionTitle: string;
    fields: AvailableField[];
};

type AvailableFieldListProps = {
    searchQuery: string;
    onSearchQueryChange: (v: string) => void;
    availableBySection: AvailableFieldBySection[];
    onAddField: (fieldname: string) => void;
};

const AVAILABLE_DROPPABLE_ID = 'quick-create-available';

const getFieldTypeIcon = (fieldType: string) => {
    const t = String(fieldType || '').toLowerCase();
    if (t === 'firstname') return <FirstNameIcon fontSize="small" />;
    if (t === 'text') return <SingleLineIcon fontSize="small" />;
    if (t === 'multiline' || t === 'textarea') return <MultiLineIcon fontSize="small" />;
    if (t === 'email') return <EmailIcon fontSize="small" />;
    if (t === 'phone') return <PhoneIcon fontSize="small" />;
    if (t === 'select' || t === 'picklist') return <PickListIcon fontSize="small" />;
    if (t === 'date') return <DateIcon fontSize="small" />;
    if (t === 'number') return <NumberIcon fontSize="small" />;
    if (t === 'currency') return <CurrencyIcon fontSize="small" />;
    if (t === 'longinteger') return <NumberIcon fontSize="small" />;
    if (t === 'checkbox') return <CheckboxIcon fontSize="small" />;
    if (t === 'lookup') return <LookupIcon fontSize="small" />;
    if (t === 'link' || t === 'url') return <LinkIcon fontSize="small" />;
    if (t === 'address') return <AddressIcon fontSize="small" />;
    return <SingleLineIcon fontSize="small" />;
};

const AvailableFieldList: React.FC<AvailableFieldListProps> = ({
    searchQuery,
    onSearchQueryChange,
    availableBySection,
    onAddField,
}) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const paletteBlue = isDark ? '#93C5FD' : '#0C2472';
    const [searchExpanded, setSearchExpanded] = React.useState(false);
    const HIDDEN_FIELDNAMES = new Set(['created_by', 'modified_by']);

    const filteredBySection = availableBySection
        .map((g) => ({
            ...g,
            fields: g.fields.filter((f) => !HIDDEN_FIELDNAMES.has(String(f.fieldname || '').toLowerCase())),
        }))
        .filter((g) => g.fields.length > 0);

    // Flatten order must match Draggable index order
    const availableFlat: AvailableField[] = filteredBySection.flatMap((g) => g.fields);

    return (
        <Box sx={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', bgcolor: isDark ? '#0A0A0A' : '#f9fbff' }}>
            <div className={`flex items-center justify-between gap-1 px-4 py-3 border-b ${isDark ? 'border-[#27272A]' : 'border-[#E3ECFC]'}`}>
                {searchExpanded ? (
                    <>
                        <TextField
                            size="small"
                            placeholder="Search"
                            value={searchQuery}
                            onChange={(e) => onSearchQueryChange(e.target.value)}
                            autoFocus
                            fullWidth
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" sx={{ color: 'action.disabled' }} />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ minWidth: 0 }}
                        />
                        <IconButton
                            size="small"
                            onClick={() => {
                                setSearchExpanded(false);
                                onSearchQueryChange('');
                            }}
                            aria-label="Close search"
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </>
                ) : (
                    <>
                        <span className={`text-[15px] font-bold ${isDark ? 'text-[#D4D4D8]' : 'text-slate-700'}`}>Available Fields</span>
                        <IconButton
                            size="small"
                            onClick={() => setSearchExpanded(true)}
                            aria-label="Search available fields"
                            sx={{ p: 0.4, color: isDark ? '#71717A' : '#94A3B8', '&:hover': { color: isDark ? '#60A5FA' : '#1D4ED8' }, borderRadius: '6px' }}
                        >
                            <MagnifyingGlass size={13} weight="duotone" />
                        </IconButton>
                    </>
                )}
            </div>

            <Droppable droppableId={AVAILABLE_DROPPABLE_ID} type="QUICK_CREATE">
                {(provided) => (
                    <Box
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        sx={{ flex: 1, overflowY: 'auto' }}
                    >
                        {availableFlat.length === 0 ? (
                            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                                No available fields to add.
                            </Typography>
                        ) : (
                            (() => {
                                let runningIndex = 0;
                                return filteredBySection.map((group, groupIdx) => (
                                    <div key={`${group.sectionTitle}-${groupIdx}`} className="px-3 pt-3">
                                        <div className="text-[13px] font-bold uppercase tracking-wider mb-1.5 px-1" style={{ color: paletteBlue }}>
                                            {group.sectionTitle || 'Untitled Section'}
                                        </div>
                                        {group.fields.map((f) => {
                                            const index = runningIndex++;
                                            return (
                                                <Draggable
                                                    key={f.fieldname}
                                                    draggableId={`qc-available-${f.fieldname}`}
                                                    index={index}
                                                >
                                                    {(dragProvided, dragSnapshot) => (
                                                        <div
                                                            ref={dragProvided.innerRef}
                                                            {...dragProvided.draggableProps}
                                                            {...dragProvided.dragHandleProps}
                                                            onClick={() => onAddField(f.fieldname)}
                                                            className={`flex items-center gap-2 px-2 py-1.5 mb-0.5 border rounded-lg text-[13px] transition-colors ${
                                                                dragSnapshot.isDragging
                                                                    ? isDark ? 'border-[#60A5FA] bg-[#1E293B]' : 'border-[#1D4ED8] bg-[#EFF6FF]'
                                                                    : isDark ? 'border-[#3F3F46] bg-[#18181B] hover:border-[#60A5FA]' : 'border-[#E3ECFC] bg-white hover:border-[#1D4ED8]'
                                                            }`}
                                                            style={{ color: paletteBlue, cursor: 'grab' }}
                                                        >
                                                            <DotsSixVertical size={12} weight="bold" color={isDark ? '#71717A' : '#94A3B8'} />
                                                            <span className="truncate">{f.label}</span>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            );
                                        })}
                                    </div>
                                ));
                            })()
                        )}
                        {provided.placeholder}
                    </Box>
                )}
            </Droppable>
        </Box>
    );
};

export default AvailableFieldList;

