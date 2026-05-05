import React from 'react';
import { Box, Chip, IconButton, Paper, Typography, Tooltip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

type FieldItemProps = {
    label: string;
    fieldType: string;
    required?: boolean;
    leadingIcon?: React.ReactNode;
    /** Row layout: label left, field type right (Quick Create selected list) */
    variant?: 'default' | 'quickCreateRow';
    dragHandleProps?: any;
    onAdd?: () => void;
    onRemove?: () => void;
    canRemove?: boolean;
    showRemove?: boolean;
};

const FieldItem: React.FC<FieldItemProps> = ({
    label,
    fieldType,
    required,
    leadingIcon,
    variant = 'default',
    dragHandleProps,
    onAdd,
    onRemove,
    canRemove = true,
    showRemove = false,
}) => {
    if (variant === 'quickCreateRow') {
        return (
            <Paper
                variant="outlined"
                sx={{
                    px: 1.5,
                    py: 1,
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr auto',
                    alignItems: 'center',
                    gap: 1,
                    borderRadius: 1,
                    cursor: onAdd ? 'pointer' : 'default',
                    borderColor: 'divider',
                    bgcolor: 'transparent',
                    transition: 'all 0.15s ease',
                    '&:hover': {
                        borderColor: 'divider',
                        bgcolor: onAdd ? 'action.hover' : undefined,
                    },
                }}
                onClick={onAdd}
            >
                <Typography
                    variant="body2"
                    sx={{
                        pl: 2,
                        fontWeight: 400,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {label}
                </Typography>
                <Typography
                    variant="caption"
                    sx={{
                        color: '#1777f069',
                        textAlign: 'left',
                        fontWeight: 400,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {fieldType}
                </Typography>
                {showRemove ? (
                    <Tooltip title={canRemove ? 'Remove' : 'This field is required'} placement="top">
                        <span>
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (canRemove) onRemove?.();
                                }}
                                disabled={!canRemove}
                                sx={{ color: canRemove ? 'text.secondary' : 'text.disabled', p: 0.5 }}
                            >
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>
                ) : (
                    // Keep the auto column width consistent across rows (required fields hide icon)
                    <Box sx={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Box sx={{ opacity: 0, pointerEvents: 'none' }}>
                            <CloseIcon fontSize="small" />
                        </Box>
                    </Box>
                )}
            </Paper>
        );
    }

    return (
        <Paper
            variant="outlined"
            sx={{
                p: 1.25,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                borderRadius: 0,
                cursor: onAdd ? 'pointer' : 'default',
                borderColor: required ? 'primary.main' : 'divider',
                bgcolor: required ? 'rgba(76, 111, 255, 0.06)' : 'background.paper',
                transition: 'all 0.15s ease',
                '&:hover': {
                    borderColor: required ? 'primary.dark' : 'primary.light',
                    bgcolor: onAdd ? 'action.hover' : undefined,
                },
            }}
            onClick={onAdd}
        >
            {/* <Box sx={{ display: 'flex', alignItems: 'center' }} {...(dragHandleProps ?? {})}>
                <DragIndicatorIcon fontSize="small" sx={{ color: 'text.secondary' }} />
            </Box> */}

            {leadingIcon ? (
                <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                    {leadingIcon}
                </Box>
            ) : null}

            <Box sx={{ minWidth: 0, flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {label}
                    </Typography>
                    {required && <Chip size="small" label="Required" color="primary" />}
                </Box>
                {/* <Typography variant="caption" color="text.secondary" sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {fieldType}
                </Typography> */}
            </Box>

            {showRemove && (
                <Tooltip title={canRemove ? 'Remove' : 'This field is required'} placement="top">
                    <span>
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (canRemove) onRemove?.();
                            }}
                            disabled={!canRemove}
                            sx={{ color: canRemove ? 'text.secondary' : 'text.disabled' }}
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </span>
                </Tooltip>
            )}
        </Paper>
    );
};

export default FieldItem;

