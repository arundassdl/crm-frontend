"use client";
import { readAccessTokenString } from '@/utils/accessTokenDataStorage'

import React, { useEffect } from 'react';
import { Box, CircularProgress, Backdrop } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import {
    layoutSelector,
    fetchLayoutData,
    fetchCustomFieldsData
} from '@/store/slices/general_slices/layout-slice';
import DragDropProvider from './DragDropProvider';
import LayoutCanvas from './LayoutCanvas';

interface LayoutBuilderContainerProps {
    module?: string;
    layoutId?: string;
    /** When true, the container operates in "clone" mode: fetches from layoutId but saves as a new layout. */
    isClone?: boolean;
    /** `/settings?tab=…&subtab=…&view=…` — navigate back to module tab URLs */
    embedInSettings?: boolean;
}

const LayoutBuilderContainer: React.FC<LayoutBuilderContainerProps> = ({
    module,
    layoutId,
    isClone,
    embedInSettings = false,
}) => {
    const dispatch = useDispatch();
    const { loading, isSaving, module: stateModule, layoutName } = useSelector(layoutSelector) as any;

    const activeModule = module || stateModule;
    
    useEffect(() => {
        const token = readAccessTokenString();
        if (token) {
            dispatch(fetchLayoutData({ module, layoutId, token, isClone }) as any);
        }
    }, [module, layoutId, isClone, dispatch]);

    useEffect(() => {
        const token = readAccessTokenString();
        if (token && activeModule) {
            dispatch(fetchCustomFieldsData({ module: activeModule, token }) as any);
        }
    }, [activeModule, dispatch]);

    if (loading === 'pending' && !isSaving) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                boxSizing: 'border-box',
            }}
        >
            <DragDropProvider>
                <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
                    <LayoutCanvas
                        module={activeModule}
                        layoutId={layoutId}
                        layout_name={layoutName}
                        isClone={isClone}
                        embedInSettings={embedInSettings}
                    />
                </Box>
            </DragDropProvider>

            <Backdrop
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={isSaving}
            >
                <CircularProgress color="inherit" />
            </Backdrop>
        </Box>
    );
};

export default LayoutBuilderContainer;
