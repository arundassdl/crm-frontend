'use client';

import React, { useState } from 'react';
import {
    Grid,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Avatar,
    IconButton,
    ToggleButton,
    ToggleButtonGroup,
    Box,
    CircularProgress,
    CardMedia,
} from '@mui/material';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { AttachmentCard } from './AttachmentCard';
import { CONSTANTS } from "@/services/config/app-config";
import CustomAvatar from '@/@core/components/mui/Avatar';

const frappeBaseUrl = CONSTANTS.API_BASE_URL || "";


export default function AttachmentContainer({
    uploadedFiles,
    loading,
    handleView,
    handleDelete,
    deletingFile,
}: any) {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const handleViewModeChange = (
        event: React.MouseEvent<HTMLElement>,
        newView: 'grid' | 'list' | null
    ) => {
        if (newView !== null) setViewMode(newView);
    };
    const getFullUrl = (url: string) => {
        return url?.startsWith("http") ? url : `${frappeBaseUrl}${url}`;
    };

    return (
        <Box sx={{ mt: 2 }} width={"100%"}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    onChange={handleViewModeChange}
                    size="small"
                >
                    <ToggleButton value="grid">
                        <ViewModuleIcon />
                    </ToggleButton>
                    <ToggleButton value="list">
                        <ViewListIcon />
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {loading && <CircularProgress />}

            {viewMode === 'grid' ? (
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
                <List>
                    {uploadedFiles.map((file: any, idx: number) => (
                        <ListItem
                            key={idx}
                            secondaryAction={
                                <IconButton
                                    edge="end"
                                    onClick={() => window.open(file.file_url, '_blank')}
                                >
                                    <InsertDriveFileIcon />
                                </IconButton>
                            }
                        >
                            <ListItemAvatar>
                                {file?.file_url?.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                                    <CustomAvatar
                                        alt={file.file_name}
                                        src={getFullUrl(file.file_url)}
                                        size={50}
                                        variant="square"
                                        sx={{ borderRadius: 1, }}
                                    />

                                ) : (
                                    <Box
                                        sx={{
                                            p: 3,
                                            borderRadius: 1,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            backgroundColor: "var(--mui-palette-background-default)",
                                        }}
                                    >
                                        <InsertDriveFileIcon fontSize="medium" />
                                    </Box>
                                )}
                            </ListItemAvatar>
                            <ListItemText
                                primary={file.file_name}
                                secondary={`Size: ${(file.file_size / 1024).toFixed(2)} KB`}
                            />
                        </ListItem>
                    ))}
                </List>
            )}
        </Box>
    );
}
