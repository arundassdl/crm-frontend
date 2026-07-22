import React from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Box, Paper, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { X } from '@phosphor-icons/react';
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
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    // Reference Quick Create rows: label (fixed width) · type · remove, separated by dividers.
    const embeddedBody = (
        <Droppable droppableId={SELECTED_DROPPABLE_ID} type="QUICK_CREATE">
            {(provided) => (
                <Box ref={provided.innerRef} {...provided.droppableProps} sx={{ minHeight: 120, overflowY: 'auto' }}>
                    {items.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>
                            Drag fields here for Quick Create
                        </Typography>
                    ) : (
                        items.map((f, index) => (
                            <Draggable key={f.fieldname} draggableId={`qc-selected-${f.fieldname}`} index={index}>
                                {(dragProvided, dragSnapshot) => (
                                    <div
                                        ref={dragProvided.innerRef}
                                        {...dragProvided.draggableProps}
                                        {...dragProvided.dragHandleProps}
                                        className={`group flex items-center px-4 py-2.5 border-b last:border-0 ${isDark ? 'border-[#27272A]' : 'border-[#EFF6FF]'} ${dragSnapshot.isDragging ? (isDark ? 'bg-[#18181B]' : 'bg-[#fafcff]') : ''}`}
                                    >
                                        <span className={`text-[15px] w-36 flex-shrink-0 ${isDark ? 'text-[#D4D4D8]' : 'text-slate-700'}`}>{f.label}</span>
                                        <span className={`flex-1 text-[15px] ${isDark ? 'text-[#71717A]' : 'text-slate-500'}`}>{f.fieldType}</span>
                                        {!f.required && (
                                            <button
                                                type="button"
                                                onClick={() => onRemoveField(f.fieldname)}
                                                aria-label={`Remove ${f.label}`}
                                                className={`w-5 h-5 flex items-center justify-center rounded-full transition-colors opacity-60 hover:opacity-100 ${isDark ? 'hover:bg-[#27272A]' : 'hover:bg-slate-100'}`}
                                            >
                                                <X size={11} weight="bold" color={isDark ? '#71717A' : '#94A3B8'} />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </Draggable>
                        ))
                    )}
                    {provided.placeholder}
                </Box>
            )}
        </Droppable>
    );

    const listBody = (
        <Droppable droppableId={SELECTED_DROPPABLE_ID} type="QUICK_CREATE">
            {(provided) => (
                <Box
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    sx={{
                        p: 1.5,
                        height: 'calc(100% - 104px)',
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
                                                variant={'default'}
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
        return embeddedBody;
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

