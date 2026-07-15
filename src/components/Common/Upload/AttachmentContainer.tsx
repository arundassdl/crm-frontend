'use client';

import React, { useState } from 'react';
import {
    Grid,
    IconButton,
    Tooltip,
    ToggleButton,
    ToggleButtonGroup,
    Box,
    CircularProgress,
} from '@mui/material';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import { Eye, DownloadSimple, Trash } from '@phosphor-icons/react';
import { AttachmentCard, formatFileSize, fileTypeIcon, getFullUrl } from './AttachmentCard';
import { CONSTANTS } from "@/services/config/app-config";

const frappeBaseUrl = CONSTANTS.API_BASE_URL || "";


export default function AttachmentContainer({
    uploadedFiles,
    loading,
    handleView,
    handleDelete,
    deletingFile,
    /** When provided, the view mode is controlled by the parent (the shared
     *  Attachments card renders the grid/list toggle in its header) and the
     *  built-in toggle is hidden. Omit for the legacy self-contained behaviour. */
    viewMode: viewModeProp,
}: any) {
    const [internalViewMode, setInternalViewMode] = useState<'grid' | 'list'>('grid');
    const isControlled = viewModeProp === 'grid' || viewModeProp === 'list';
    const viewMode: 'grid' | 'list' = isControlled ? viewModeProp : internalViewMode;

    const handleViewModeChange = (
        event: React.MouseEvent<HTMLElement>,
        newView: 'grid' | 'list' | null
    ) => {
        if (newView !== null) setInternalViewMode(newView);
    };
    const getFullUrl = (url: string) => {
        return url?.startsWith("http") ? url : `${frappeBaseUrl}${url}`;
    };

    const isEmpty = !loading && (!uploadedFiles || uploadedFiles.length === 0);

    return (
        <Box sx={{ mt: isControlled ? 0 : 2 }} width={"100%"}>
            {!isControlled && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                    <ToggleButtonGroup
                        value={viewMode}
                        exclusive
                        onChange={handleViewModeChange}
                        size="small"
                        sx={{
                            gap: 0.5,
                            '& .MuiToggleButtonGroup-grouped': {
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: '8px !important',
                                p: 0.75,
                                color: 'text.secondary',
                                '&.Mui-selected': {
                                    bgcolor: '#1D4ED8',
                                    color: '#fff',
                                    borderColor: '#1D4ED8',
                                    '&:hover': { bgcolor: '#1E40AF' },
                                },
                                '&:hover': { bgcolor: 'rgba(29,78,216,0.08)' },
                            },
                        }}
                    >
                        <ToggleButton value="grid">
                            <ViewModuleIcon fontSize="small" />
                        </ToggleButton>
                        <ToggleButton value="list">
                            <ViewListIcon fontSize="small" />
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Box>
            )}

            {loading && <CircularProgress />}

            {isEmpty ? (
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        py: 6,
                        fontSize: '14px',
                        color: 'var(--text-muted, #94A3B8)',
                    }}
                >
                    No attachments yet
                </Box>
            ) : viewMode === 'grid' ? (
                <Grid container spacing={2}>
                    {uploadedFiles.map((file: any, idx: number) => (
                        <Grid item key={idx}>
                            <AttachmentCard
                                file={file}
                                onView={handleView}
                                onDelete={handleDelete}
                                deletingFile={deletingFile}
                            />
                        </Grid>
                    ))}
                </Grid>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {uploadedFiles.map((file: any, idx: number) => {
                        const isImage = /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(file?.file_url || file?.file_name || '');
                        const isDeleting = deletingFile === file.file_url;
                        return (
                            <Box
                                key={idx}
                                sx={{
                                    position: 'relative',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                    px: 1.5,
                                    py: 1,
                                    borderRadius: '12px',
                                    border: '1px solid var(--border, #E3ECFC)',
                                    backgroundColor: 'var(--bg-card, #f9fbff)',
                                    transition: 'all 0.18s ease',
                                    '&:hover': {
                                        borderColor: '#1D4ED8',
                                        backgroundColor: 'rgba(29,78,216,0.03)',
                                    },
                                }}
                            >
                                {isDeleting && (
                                    <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(249,251,255,0.7)', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}>
                                        <CircularProgress size={22} />
                                    </Box>
                                )}

                                {/* Thumbnail / type icon */}
                                <Box
                                    onClick={() => handleView?.(file)}
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        flexShrink: 0,
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: '#EFF6FF',
                                    }}
                                >
                                    {isImage ? (
                                        <Box component="img" src={getFullUrl(file.file_url)} alt={file.file_name}
                                            sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                    ) : (
                                        fileTypeIcon(file?.file_name, 18, '#1D4ED8')
                                    )}
                                </Box>

                                {/* Name + size */}
                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                    <Box sx={{ fontSize: '14px', fontWeight: 500, lineHeight: '20px', color: 'var(--text-body, #0C2472)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {file.file_name}
                                    </Box>
                                    <Box sx={{ fontSize: '11.5px', lineHeight: '16px', color: 'var(--text-muted, #94A3B8)' }}>
                                        {formatFileSize(file?.file_size)}
                                    </Box>
                                </Box>

                                {/* Actions */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, flexShrink: 0 }}>
                                    <Tooltip title="View">
                                        <IconButton size="small" onClick={() => handleView?.(file)}
                                            sx={{ p: 0.5, borderRadius: '6px', color: '#94A3B8', '&:hover': { color: '#1D4ED8', bgcolor: '#EFF6FF' } }}>
                                            <Eye size={15} weight="duotone" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Download">
                                        <IconButton size="small" onClick={() => window.open(getFullUrl(file.file_url), '_blank')}
                                            sx={{ p: 0.5, borderRadius: '6px', color: '#94A3B8', '&:hover': { color: '#1D4ED8', bgcolor: '#EFF6FF' } }}>
                                            <DownloadSimple size={15} weight="duotone" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete">
                                        <IconButton size="small" onClick={() => handleDelete?.(file)}
                                            sx={{ p: 0.5, borderRadius: '6px', color: '#94A3B8', '&:hover': { color: '#EF4444', bgcolor: '#FEF2F2' } }}>
                                            <Trash size={15} weight="duotone" />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            </Box>
                        );
                    })}
                </Box>
            )}
        </Box>
    );
}
