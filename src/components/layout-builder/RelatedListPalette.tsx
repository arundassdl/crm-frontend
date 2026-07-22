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
import { useTheme } from '@mui/material/styles';
import { CaretUp, CaretDown } from '@phosphor-icons/react';
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
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const paletteBlue = isDark ? '#93C5FD' : '#0C2472';
    const { unusedRelatedLists } = useSelector(layoutSelector) as any;
    const [expanded, setExpanded] = useState(true);

    const renderItemPaper = (
        icon: React.ReactNode,
        label: string,
        snapshot: { isDragging: boolean }
    ) => {
        const sizedIcon = React.isValidElement(icon)
            ? React.cloneElement(icon as React.ReactElement<any>, { sx: { fontSize: 14, color: paletteBlue } })
            : icon;
        return (
            <div
                className={`flex items-center gap-1.5 w-full px-2 py-1.5 border rounded-lg transition-colors text-[15px] font-medium ${
                    snapshot.isDragging
                        ? isDark ? 'border-[#60A5FA] bg-[#1E293B]' : 'border-[#1D4ED8] bg-[#EFF6FF]'
                        : isDark ? 'border-[#3F3F46] bg-[#18181B] hover:border-[#60A5FA]' : 'border-[#E3ECFC] bg-white hover:border-[#1D4ED8]'
                }`}
                style={{ color: paletteBlue, cursor: 'grab' }}
            >
                <span className="flex-shrink-0 flex items-center">{sizedIcon}</span>
                <span className="truncate">{label}</span>
            </div>
        );
    };

    return (
        <Box sx={{ width: 300, height: '100%', overflowY: 'auto', bgcolor: isDark ? '#0A0A0A' : '#f9fbff' }}>
            <button
                onClick={() => setExpanded(!expanded)}
                className={`flex items-center justify-between w-full px-4 py-2.5 text-[13px] font-bold uppercase tracking-wider border-b ${isDark ? 'hover:bg-[#18181B] border-[#27272A]' : 'hover:bg-[#EFF6FF] border-[#E3ECFC]'}`}
                style={{ color: paletteBlue }}
            >
                <span>Unused Related List</span>
                {expanded ? <CaretUp size={9} weight="bold" /> : <CaretDown size={9} weight="bold" />}
            </button>

            {expanded && (
                <Droppable droppableId="related-list-palette" type="RELATED_LIST">
                    {(provided) => (
                        <List
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            sx={{ display: 'flex', flexDirection: 'column', gap: 1, px: 1.5, py: 1.5 }}
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
                                <div className={`px-2.5 text-[13px] ${isDark ? 'text-[#9CA3AF]' : 'text-slate-600'}`}>
                                    No more related lists available.
                                </div>
                            )}
                        </List>
                    )}
                </Droppable>
            )}
        </Box>
    );
};

export default RelatedListPalette;
