import React from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Box, Paper, Typography } from '@mui/material';
import FieldItem from './FieldItem';

type SelectedFieldListItem = {
    fieldname: string;
    label: string;
    fieldType: string;
    required?: boolean;
};

type SelectedFieldListProps = {
    items: SelectedFieldListItem[];
    onRemoveField: (fieldname: string) => void;
    /** Inside dashed preview: no outer card / title */
    embedded?: boolean;
};

const SELECTED_DROPPABLE_ID = 'quick-create-selected';

const SelectedFieldList: React.FC<SelectedFieldListProps> = ({ items, onRemoveField, embedded }) => {
    const listBody = (
        <Droppable droppableId={SELECTED_DROPPABLE_ID} type="QUICK_CREATE">
            {(provided) => (
                <Box
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    sx={{
                        p: 1.5,
                        height: embedded ? '100%' : 'calc(100% - 104px)',
                        minHeight: embedded ? 120 : undefined,
                        overflowY: 'auto',
                    }}
                >
                    {items.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                            Drag fields here for Quick Create
                        </Typography>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {items.map((f, index) => (
                                <Draggable key={f.fieldname} draggableId={`qc-selected-${f.fieldname}`} index={index}>
                                    {(dragProvided, dragSnapshot) => (
                                        <Box
                                            ref={dragProvided.innerRef}
                                            {...dragProvided.draggableProps}
                                            {...dragProvided.dragHandleProps}
                                            sx={{
                                                opacity: dragSnapshot.isDragging ? 0.8 : 1,
                                            }}
                                        >
                                            <FieldItem
                                                label={f.label}
                                                fieldType={f.fieldType}
                                                required={f.required}
                                                variant={embedded ? 'quickCreateRow' : 'default'}
                                                showRemove={!f.required}
                                                canRemove={!f.required}
                                                onRemove={() => onRemoveField(f.fieldname)}
                                            />
                                        </Box>
                                    )}
                                </Draggable>
                            ))}
                        </Box>
                    )}
                    {provided.placeholder}
                </Box>
            )}
        </Droppable>
    );

    if (embedded) {
        return listBody;
    }

    return (
        <Paper variant="outlined" sx={{ height: '100%', borderRadius: 3, overflow: 'hidden', bgcolor: 'background.paper' }}>
            <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>Quick Create Fields</Typography>
                <Typography variant="caption" color="text.secondary">
                    Drag to reorder. Required fields can’t be removed.
                </Typography>
            </Box>
            {listBody}
        </Paper>
    );
};

export default SelectedFieldList;

