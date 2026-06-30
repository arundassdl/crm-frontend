'use client'

import { memo, useEffect, useState } from 'react'
import { Box, IconButton, Typography } from '@mui/material'

import { useKpiConfigForm } from '../hooks/useKpiConfigForm'
import { KpiConfigFormFields } from './kpi/KpiConfigFormFields'
import { KpiPreviewPanel } from './kpi/KpiPreviewPanel'
import type { WidgetCatalogItem } from '../types'

export type KPIStyle = 'standard' | 'growth_index' | 'basic' | 'scorecard' | 'rankings'

interface KPIStyleOption {
    id: KPIStyle
    label: string
    renderPreview: () => React.ReactNode
}

const KPI_STYLES: KPIStyleOption[] = [
    {
        id: 'standard',
        label: 'Standard',
        renderPreview: () => (
            <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm">
                <p className="text-xs font-semibold text-slate-800">Revenue This Month</p>
                <div className="flex items-center gap-2">
                    <p className="text-xl font-bold text-slate-900">$300</p>
                    <span className="flex items-center gap-0.5 text-xs font-medium text-emerald-500">
                        <i className="ri-arrow-up-s-fill" /> 3.09%
                    </span>
                </div>
                <p className="text-[10px] text-slate-400">Last Month: $291</p>
            </div>
        ),
    },
    {
        id: 'growth_index',
        label: 'Growth Index',
        renderPreview: () => (
            <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm">
                <p className="text-xs font-semibold text-slate-800">Revenue This Month</p>
                <div className="flex items-center gap-2">
                    <p className="text-xl font-bold text-slate-900">$391</p>
                    <span className="flex items-center gap-0.5 text-xs font-medium text-red-500">
                        13.11%
                    </span>
                </div>
                <p className="text-[10px] text-slate-400">Last Month: $450</p>
            </div>
        ),
    },
    {
        id: 'basic',
        label: 'Basic',
        renderPreview: () => (
            <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white text-left shadow-sm">
                <p className="border-b border-slate-100 px-4 py-2 text-sm font-semibold text-slate-800">
                    Overdue Tasks
                </p>
                <p className="px-4 py-3 text-3xl font-bold leading-none tracking-tight text-slate-800">40</p>
            </div>
        ),
    },
    {
        id: 'scorecard',
        label: 'Scorecard',
        renderPreview: () => (
            <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm">
                <p className="text-xs font-semibold text-slate-800">Top Leads Sources</p>
                <div className="flex flex-col gap-1.5 overflow-hidden text-[10px]">
                    <div className="flex justify-between border-b border-slate-100 pb-1 font-medium text-slate-400 uppercase tracking-tight">
                        <span>Lead Source</span>
                        <span>Amount</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                        <span>Advertisement</span>
                        <span className="flex items-center gap-1">$550 <span className="text-emerald-500 font-medium">14%</span></span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                        <span>Google+</span>
                        <span className="flex items-center gap-1">$550 <span className="text-red-500 font-medium">22%</span></span>
                    </div>
                    <p className="text-[8px] text-slate-300 mt-1 italic">* Compared with Last year</p>
                </div>
            </div>
        ),
    },
    {
        id: 'rankings',
        label: 'Rankings',
        renderPreview: () => (
            <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm">
                <p className="text-xs font-semibold text-slate-800">Top 5 Deals owners</p>
                <div className="flex flex-col gap-1 overflow-hidden text-[10px]">
                    <div className="flex justify-between border-b border-slate-100 pb-1 font-medium text-slate-400 uppercase tracking-tight">
                        <span>Deal Owner</span>
                        <span>Amount</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                        <span>1. Mark</span>
                        <span>$1280</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                        <span>2. Jason</span>
                        <span>$1010</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                        <span>3. Michael</span>
                        <span>$777</span>
                    </div>
                </div>
            </div>
        ),
    },
]

export type KPIStyleSelectionModalProps = {
    open: boolean
    onClose: () => void
    onDone: (item: WidgetCatalogItem) => void
}

function KPIStyleSelectionModalInner({ open, onClose, onDone }: KPIStyleSelectionModalProps) {
    const [view, setView] = useState<'selection' | 'config'>('selection')
    const [selectedStyle, setSelectedStyle] = useState<KPIStyle | null>(null)

    useEffect(() => {
        if (!open) {
            setView('selection')
            setSelectedStyle(null)
            return
        }
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [open, onClose])

    const kpiStyle = selectedStyle ?? 'standard'

    const formApi = useKpiConfigForm({ open, kpiStyle, onDone, onClose })
    const { form, saving, saveError, isDoneDisabled, isCountMeasure, primaryMeasureLabel, rankByLabel, handleDone } = formApi

    const handleStyleClick = (styleId: KPIStyle) => {
        setSelectedStyle(styleId)
        setView('config')
    }

    const handleBack = () => {
        setView('selection')
    }

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
                aria-labelledby="kpi-style-title"
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {view === 'config' && (
                            <IconButton onClick={handleBack} size="small" sx={{ mr: 1 }}>
                                <i className="ri-arrow-left-line text-xl" />
                            </IconButton>
                        )}
                        <Typography variant="h6" component="h2" sx={{ fontWeight: 600, fontSize: '1.125rem' }}>
                            {view === 'config'
                                ? `${KPI_STYLES.find(s => s.id === kpiStyle)?.label ?? 'KPI'} KPI`
                                : 'Choose KPI Style'}
                        </Typography>
                    </Box>
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
                            borderRight: { lg: view === 'config' ? 1 : 0 },
                            borderColor: { lg: 'divider' },
                        }}
                    >
                        {view === 'selection' ? (
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {KPI_STYLES.map(style => (
                                    <button
                                        key={style.id}
                                        type="button"
                                        onClick={() => handleStyleClick(style.id)}
                                        className="group flex flex-col items-center gap-3"
                                    >
                                        <div className={`w-full transition-all group-hover:scale-[1.02] ${selectedStyle === style.id ? 'ring-2 ring-[var(--mui-palette-primary-main)]' : ''}`}>
                                            {style.renderPreview()}
                                        </div>
                                        <span className="text-sm font-medium text-[var(--mui-palette-text-secondary)] group-hover:text-[var(--mui-palette-text-primary)]">
                                            {style.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <KpiConfigFormFields kpiStyle={kpiStyle} {...formApi} />
                        )}
                    </Box>

                    {view === 'config' && (
                        <KpiPreviewPanel
                            kpiStyle={kpiStyle}
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
                            rankShow={form.rankShow}
                            shortened={form.shortened}
                            shortenedFormat={form.shortenedFormat}
                            shortenedDecimalPlaces={form.shortenedDecimalPlaces}
                            shortenedMeasureIds={form.shortenedMeasureIds}
                            rankByLabel={rankByLabel}
                        />
                    )}
                </Box>
            </Box>
        </Box>
    )
}

export const KPIStyleSelectionModal = memo(KPIStyleSelectionModalInner)
