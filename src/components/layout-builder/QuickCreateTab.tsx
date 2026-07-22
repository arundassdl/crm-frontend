'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, Dialog, DialogContent, DialogTitle, IconButton, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useDispatch, useSelector } from 'react-redux';
import { layoutSelector, setQuickCreateFields } from '@/store/slices/general_slices/layout-slice';
import SelectedFieldList from './SelectedFieldList';
import { findField, getAllFields, getFieldName, getRequiredFields } from './quickCreateUtils';
import CloseIcon from '@mui/icons-material/Close';
import CustomForm from '@/components/Common/Form/Drawer/CustomForm';

type QuickCreateTabProps = {
    layout: any;
    moduleName?: string;
};

const MAX_FIELDS = 10;

const QuickCreateTab: React.FC<QuickCreateTabProps> = ({ layout, moduleName }) => {
    const dispatch = useDispatch();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const storeLayout = useSelector(layoutSelector) as any;
    const [previewOpen, setPreviewOpen] = useState(false);

    const existingFieldNames = useMemo(() => {
        const all = getAllFields(layout);
        return new Set(all.map((f: any) => getFieldName(f)).filter(Boolean));
    }, [layout]);

    const requiredFieldNames = useMemo(() => getRequiredFields(layout), [layout]);
    const requiredSet = useMemo(() => new Set(requiredFieldNames), [requiredFieldNames]);

    const qcFieldsFromLayout: string[] = (layout?.quick_create?.fields ?? storeLayout?.activeLayout?.quick_create?.fields ?? []) as string[];

    const quickFields = useMemo(() => {
        const seen = new Set<string>();
        const sanitized: string[] = [];
        for (const fn of qcFieldsFromLayout ?? []) {
            if (!fn || typeof fn !== 'string') continue;
            if (!existingFieldNames.has(fn)) continue;
            if (seen.has(fn)) continue;
            seen.add(fn);
            sanitized.push(fn);
            if (sanitized.length >= MAX_FIELDS) break;
        }
        return sanitized;
    }, [qcFieldsFromLayout, existingFieldNames]);

    // Cleanup: if the store/layout has stale fields not present in sections, remove them
    useEffect(() => {
        const current = (layout?.quick_create?.fields ?? storeLayout?.activeLayout?.quick_create?.fields ?? []) as string[];
        const next = quickFields;
        if (JSON.stringify(current) !== JSON.stringify(next)) {
            dispatch(setQuickCreateFields(next));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dispatch, layout, JSON.stringify(quickFields)]);

    // Ensure default required fields exist if the config is missing
    useEffect(() => {
        const qc = layout?.quick_create;
        if (!qc || !Array.isArray(qc.fields)) {
            dispatch(setQuickCreateFields(requiredFieldNames));
        }
    }, [dispatch, layout, requiredFieldNames]);

    const removeField = (fieldname: string) => {
        if (requiredSet.has(fieldname)) return;
        const next = quickFields.filter((f) => f !== fieldname);
        dispatch(setQuickCreateFields(next));
    };

    const selectedItems = useMemo(
        () =>
            quickFields.map((fn) => {
                const field = findField(layout, fn);
                const label = field?.label ?? fn;
                const fieldType = field?.type ?? field?.fieldtype ?? '—';
                return { fieldname: fn, label, fieldType, required: !!field?.required };
            }),
        [layout, quickFields]
    );

    const previewFields = useMemo(
        () =>
            quickFields
                .map((fn) => {
                    const field = findField(layout, fn);
                    if (!field) return null;
                    return {
                        ...field,
                        section: '',
                        section_column_count: 1,
                    };
                })
                .filter(Boolean) as any[],
        [layout, quickFields]
    );

    const previewInitialValues = useMemo(
        () =>
            previewFields.reduce((acc: any, f: any) => {
                const name = getFieldName(f);
                if (!name) return acc;
                acc[name] = String(f?.type || '').toLowerCase() === 'checkbox' ? false : '';
                return acc;
            }, {}),
        [previewFields]
    );

    return (
        <Box
            sx={{
                minHeight: 0,
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {/* Preview action restored as per request */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', pr: 2, pt: 1 }}>
                <Button
                    variant="text"
                    size="small"
                    onClick={() => setPreviewOpen(true)}
                    sx={{ textTransform: 'none', fontWeight: 500, color: 'primary.main' }}
                >
                    Preview
                </Button>
            </Box>
            <Box
                sx={{
                    mt: 0.5,
                    mx: 2,
                    mb: 2,
                    width: 500,
                    maxWidth: '100%',
                    border: '1px solid',
                    borderColor: isDark ? '#27272A' : '#E3ECFC',
                    borderRadius: '12px',
                    bgcolor: isDark ? '#0A0A0A' : '#fff',
                    boxShadow: isDark ? 'none' : '0 1px 3px rgba(12,36,114,0.06)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    alignSelf: 'center',
                }}
            >
                <SelectedFieldList embedded items={selectedItems} onRemoveField={removeField} />
            </Box>

            <Dialog
                open={previewOpen}
                onClose={() => setPreviewOpen(false)}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6">{`Quick Create: ${moduleName || 'Preview'}`}</Typography>
                    <IconButton onClick={() => setPreviewOpen(false)} aria-label="Close quick create preview">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ p: 0 }}>
                    <CustomForm
                        fields={previewFields}
                        initialValues={previewInitialValues}
                        onSubmit={() => { }}
                        onClose={() => { }}
                        editValues={{}}
                        mode="Add"
                        moduleName={moduleName}
                        hideActions={true}
                        variant="quickCreate"
                    />
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default QuickCreateTab;
