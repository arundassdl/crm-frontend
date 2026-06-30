'use client'

import { memo, useEffect } from 'react'
import { Box, IconButton, Typography } from '@mui/material'

import { useKpiConfigForm } from '../hooks/useKpiConfigForm'
import { KpiConfigFormFields } from './kpi/KpiConfigFormFields'
import { KpiPreviewPanel } from './kpi/KpiPreviewPanel'
import type { WidgetCatalogItem } from '../types'

export type GrowthIndexKPIStyleSelectionModalProps = {
    open: boolean
    onClose: () => void
    onDone: (item: WidgetCatalogItem) => void
}

function GrowthIndexKPIStyleSelectionModalInner({
    open,
    onClose,
    onDone,
}: GrowthIndexKPIStyleSelectionModalProps) {
    useEffect(() => {
        if (!open) return
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [open, onClose])

    const formApi = useKpiConfigForm({ open, kpiStyle: 'growth_index', onDone, onClose })
    const { form, saving, saveError, isDoneDisabled, isCountMeasure, primaryMeasureLabel, rankByLabel, handleDone } = formApi

    if (!open) return null

    return (
        <Box
            className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto bg-black/40 px-4 py-6"
            role="presentation"
            onClick={onClose}
        >
            <Box
                role="dialog"
                aria-modal="true"
                aria-labelledby="growth-index-kpi-title"
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    maxWidth: 1080,
                    borderRadius: 2,
                    maxHeight: '88vh',
                    bgcolor: 'background.paper',
                    boxShadow: 24,
                    overflow: 'hidden',
                }}
                onClick={e => e.stopPropagation()}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        px: 3,
                        py: 2,
                        borderBottom: 1,
                        borderColor: 'divider',
                    }}
                >
                    <Typography
                        id="growth-index-kpi-title"
                        variant="h6"
                        component="h2"
                        sx={{ fontWeight: 600, fontSize: '1.125rem' }}
                    >
                        Growth Index KPI
                    </Typography>
                    <IconButton aria-label="Close" onClick={onClose} size="small">
                        <i className="ri-close-line text-xl" aria-hidden />
                    </IconButton>
                </Box>

                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', lg: 'row' },
                        alignItems: { lg: 'stretch' },
                        minHeight: 0,
                        flex: 1,
                        overflow: 'hidden',
                    }}
                >
                    <Box
                        sx={{
                            flex: 1,
                            minWidth: 0,
                            overflowY: 'auto',
                            px: 3,
                            py: 2.5,
                            borderRight: { lg: 1 },
                            borderColor: { lg: 'divider' },
                        }}
                    >
                        <KpiConfigFormFields kpiStyle="growth_index" {...formApi} />
                    </Box>

                    <KpiPreviewPanel
                        kpiStyle="growth_index"
                        name={form.name}
                        displayRecordCount={form.displayRecordCount}
                        isCountMeasure={isCountMeasure}
                        primaryMeasureLabel={primaryMeasureLabel}
                        saveError={saveError}
                        saving={saving}
                        isDoneDisabled={isDoneDisabled}
                        onCancel={onClose}
                        onDone={() => void handleDone()}
                        compareTo={form.compareTo}
                        objective={form.objective}
                        comparisonFromDate={form.comparisonFromDate}
                        comparisonToDate={form.comparisonToDate}
                        rankByLabel={rankByLabel}
                    />
                </Box>
            </Box>
        </Box>
    )
}

export const GrowthIndexKPIStyleSelectionModal = memo(GrowthIndexKPIStyleSelectionModalInner)
