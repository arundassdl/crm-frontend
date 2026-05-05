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
        <Paper  sx={{ height: '100%',  overflow: 'hidden' }}>
            <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {!searchExpanded && (
                        <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                            Available Fields
                        </Typography>
                    )}
                    <Box
                        sx={{
                            ml: searchExpanded ? 0 : 'auto',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            flex: searchExpanded ? 1 : 'none',
                        }}
                    >
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
                            <IconButton
                                size="small"
                                onClick={() => setSearchExpanded(true)}
                                aria-label="Search available fields"
                            >
                                <SearchIcon fontSize="small" sx={{ color: 'action.active' }} />
                            </IconButton>
                        )}
                    </Box>
                </Box>
            </Box>

            <Droppable droppableId={AVAILABLE_DROPPABLE_ID} type="QUICK_CREATE">
                {(provided) => (
                    <Box
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        sx={{ p: 1.5, height: 'calc(100% - 92px)', overflowY: 'auto' }}
                    >
                        {availableFlat.length === 0 ? (
                            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                                No available fields to add.
                            </Typography>
                        ) : (
                            (() => {
                                let runningIndex = 0;
                                return filteredBySection.map((group, groupIdx) => (
                                    <Box key={`${group.sectionTitle}-${groupIdx}`} sx={{ mb: 1.5, pt: 2 }}>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                display: 'block',
                                                color: 'text.secondary',
                                                fontWeight: 700,
                                                mb: 1,
                                            }}
                                        >
                                            {group.sectionTitle || 'Untitled Section'}
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            {group.fields.map((f) => {
                                                const index = runningIndex++;
                                                return (
                                                    <Draggable
                                                        key={f.fieldname}
                                                        draggableId={`qc-available-${f.fieldname}`}
                                                        index={index}
                                                    >
                                                        {(dragProvided, dragSnapshot) => (
                                                            <Box
                                                                ref={dragProvided.innerRef}
                                                                {...dragProvided.draggableProps}
                                                                {...dragProvided.dragHandleProps}
                                                                sx={{
                                                                    opacity: dragSnapshot.isDragging ? 0.75 : 1,
                                                                }}
                                                            >
                                                                <FieldItem
                                                                    label={f.label}
                                                                    fieldType={f.fieldType}
                                                                    required={f.required}
                                                                    leadingIcon={getFieldTypeIcon(f.fieldType)}
                                                                    onAdd={() => onAddField(f.fieldname)}
                                                                />
                                                            </Box>
                                                        )}
                                                    </Draggable>
                                                );
                                            })}
                                        </Box>
                                    </Box>
                                ));
                            })()
                        )}
                        {provided.placeholder}
                    </Box>
                )}
            </Droppable>
        </Paper>
    );
};

export default AvailableFieldList;

