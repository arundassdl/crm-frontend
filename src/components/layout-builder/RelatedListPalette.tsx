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
} from '@mui/material';
import {
    ExpandMore,
    ChevronRight,
    Description,
    Handshake,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { layoutSelector } from '@/store/slices/general_slices/layout-slice';

const itemSx = {
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

const getIconForRL = (label: string) => {
    const lowLabel = (label || "").toLowerCase();
    if (lowLabel.includes('notes')) return <Description />;
    if (lowLabel.includes('deals')) return <Handshake />;
    // Default icon
    return <Description />;
};

const RelatedListPalette: React.FC = () => {
    const { unusedRelatedLists } = useSelector(layoutSelector) as any;
    const [expanded, setExpanded] = useState(true);

    const renderItemPaper = (
        icon: React.ReactNode,
        label: string,
        snapshot: { isDragging: boolean }
    ) => (
        <Paper
            variant={snapshot.isDragging ? 'elevation' : 'outlined'}
            elevation={snapshot.isDragging ? 4 : 0}
            sx={{
                ...itemSx,
                cursor: 'grab',
                borderColor: snapshot.isDragging ? 'primary.main' : 'divider',
            }}
        >
            <ListItemIcon sx={{ minWidth: 'auto', color: 'primary.main' }}>
                {icon}
            </ListItemIcon>
            <ListItemText
                primary={label}
                primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
            />
        </Paper>
    );

    return (
        <Box sx={{ width: 300, p: 2, borderRight: 1, borderColor: 'divider', height: '100%', bgcolor: 'background.paper' }}>
            <Box sx={{ mb: 2 }}>
                <Box
                    onClick={() => setExpanded(!expanded)}
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
                        {expanded ? <ExpandMore /> : <ChevronRight />}
                    </IconButton>
                    <Typography variant="body2" fontWeight="600" color="text.primary" sx={{ textTransform: 'none' }}>
                        Unused Related List
                    </Typography>
                </Box>

                {expanded && (
                    <Droppable droppableId="related-list-palette" type="RELATED_LIST">
                        {(provided) => (
                            <List
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}
                            >
                                {unusedRelatedLists.map((rl: any, index: number) => (
                                    <Draggable key={rl.id} draggableId={`palette-${rl.id}`} index={index}>
                                        {(fProvided, fSnapshot) => (
                                            <ListItem
                                                ref={fProvided.innerRef}
                                                {...fProvided.draggableProps}
                                                {...fProvided.dragHandleProps}
                                                disablePadding
                                            >
                                                {renderItemPaper(getIconForRL(rl.label || rl.name || ""), rl.label || rl.name || "Related List", fSnapshot)}
                                            </ListItem>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                                {unusedRelatedLists.length === 0 && (
                                    <Typography variant="caption" sx={{ pl: 4, color: 'text.secondary' }}>
                                        No more related lists available.
                                    </Typography>
                                )}
                            </List>
                        )}
                    </Droppable>
                )}
            </Box>
        </Box>
    );
};

export default RelatedListPalette;
