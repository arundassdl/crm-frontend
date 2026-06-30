'use client'

import { Box, Button, Typography } from '@mui/material'

import type { KPIStyle } from '../KPIStyleSelectionModal'
import { formatShortenedNumber, type ShortenedNumberFormat } from '../../utils/formatShortenedNumber'

export type KpiPreviewPanelProps = {
    kpiStyle: KPIStyle
    name: string
    displayRecordCount: boolean
    isCountMeasure: boolean
    primaryMeasureLabel?: string
    saveError?: string
    saving: boolean
    isDoneDisabled: boolean
    onCancel: () => void
    onDone: () => void
    compareTo?: 'Previous Period' | 'Previous Year' | 'Custom' | ''
    objective?: 'increase_positive' | 'decrease_positive' | ''
    comparisonFromDate?: string
    comparisonToDate?: string
    rankShow?: 'Top 5' | 'Top 10' | 'Top 20' | 'Bottom 5' | 'Bottom 10' | 'Bottom 20'
    shortened?: boolean
    shortenedFormat?: ShortenedNumberFormat
    shortenedDecimalPlaces?: 0 | 1 | 2
    shortenedMeasureIds?: string[]
    rankByLabel?: string
}

const PREVIEW_CURRENT_VALUE = 391
const PREVIEW_PREVIOUS_VALUE = 450

const PREVIEW_RANKING_ROWS = [
    { label: 'Mark', value: 1280, recordCount: 4 },
    { label: 'Jason', value: 1010, recordCount: 3 },
    { label: 'Michael', value: 777, recordCount: 2 },
    { label: 'Steve', value: 640, recordCount: 2 },
    { label: 'David', value: 520, recordCount: 1 },
    { label: 'John', value: 410, recordCount: 1 },
]

const PREVIEW_SCORECARD_ROWS = [
    { label: 'Advertisement', value: 550, recordCount: 12, growth: 14 },
    { label: 'Google+', value: 550, recordCount: 15, growth: -22 },
    { label: 'Cold Call', value: 340, recordCount: 2, growth: 13 },
    { label: 'Chat', value: 220, recordCount: 4, growth: -1 },
    { label: 'Twitter', value: 190, recordCount: 1, growth: 20 },
]

export function KpiPreviewPanel({
    kpiStyle,
    name,
    displayRecordCount,
    isCountMeasure,
    primaryMeasureLabel,
    saveError,
    saving,
    isDoneDisabled,
    onCancel,
    onDone,
    compareTo,
    objective,
    comparisonFromDate,
    comparisonToDate,
    rankShow,
    shortened,
    shortenedFormat,
    shortenedDecimalPlaces,
    shortenedMeasureIds,
    rankByLabel,
}: KpiPreviewPanelProps) {
    const growthPercent =
        ((PREVIEW_CURRENT_VALUE - PREVIEW_PREVIOUS_VALUE) / PREVIEW_PREVIOUS_VALUE) * 100
    const isPositiveGrowth = growthPercent > 0
    const isFavorable = objective === 'decrease_positive' ? !isPositiveGrowth : isPositiveGrowth
    const growthLabel = `${growthPercent > 0 ? '+' : ''}${growthPercent.toFixed(2)}%`
    const growthColor = isFavorable ? '#10b981' : '#ef4444'

    let comparisonLabel = 'Last Month'
    if (compareTo === 'Previous Year') {
        comparisonLabel = 'Last Year'
    } else if (compareTo === 'Custom') {
        comparisonLabel = comparisonFromDate && comparisonToDate
            ? `${comparisonFromDate} to ${comparisonToDate}`
            : 'Custom Period'
    }
    return (
        <Box
            sx={{
                width: { lg: 380 },
                bgcolor: 'grey.50',
                display: 'flex',
                flexDirection: 'column',
                borderLeft: { lg: 1 },
                borderColor: { lg: 'divider' },
            }}
        >
            <Box sx={{ p: 3, flex: 1 }}>
                <Box
                    sx={{
                        bgcolor: 'background.paper',
                        borderRadius: 2,
                        border: 1,
                        borderColor: 'divider',
                        p: 3,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                        minHeight: 160,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                    }}
                >
                    {kpiStyle === 'basic' ? (
                        <Typography
                            sx={{
                                fontWeight: 700,
                                fontSize: '1.875rem',
                                lineHeight: 1,
                                letterSpacing: '-0.02em',
                                color: '#1e293b',
                            }}
                        >
                            40
                        </Typography>
                    ) : kpiStyle === 'rankings' ? (
                        <RankingPreview
                            name={name}
                            displayRecordCount={displayRecordCount}
                            primaryMeasureLabel={primaryMeasureLabel}
                            rankShow={rankShow}
                            shortened={shortened}
                            shortenedFormat={shortenedFormat}
                            shortenedDecimalPlaces={shortenedDecimalPlaces}
                            shortenedMeasureIds={shortenedMeasureIds}
                            rankByLabel={rankByLabel}
                        />
                    ) : kpiStyle === 'scorecard' ? (
                        <ScorecardPreview
                            name={name}
                            displayRecordCount={displayRecordCount}
                            primaryMeasureLabel={primaryMeasureLabel}
                            rankShow={rankShow}
                            shortened={shortened}
                            shortenedFormat={shortenedFormat}
                            shortenedDecimalPlaces={shortenedDecimalPlaces}
                            shortenedMeasureIds={shortenedMeasureIds}
                            objective={objective}
                            compareTo={compareTo}
                            comparisonFromDate={comparisonFromDate}
                            comparisonToDate={comparisonToDate}
                            rankByLabel={rankByLabel}
                        />
                    ) : (
                        <>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b', mb: 1.5, minHeight: '1.25rem' }}>
                                {name || 'Untitled'}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="h3" sx={{ fontWeight: 700, color: '#0f172a' }}>
                                    {kpiStyle === 'growth_index' || kpiStyle === 'standard' ? `$${PREVIEW_CURRENT_VALUE}` : '$2000'}
                                </Typography>
                                {(kpiStyle === 'growth_index' || kpiStyle === 'standard') && (
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: growthColor }}>
                                        {growthLabel}
                                    </Typography>
                                )}
                                {displayRecordCount && !isCountMeasure && (
                                    <Box
                                        sx={{
                                            px: 0.75,
                                            py: 0.25,
                                            borderRadius: 1,
                                            bgcolor: 'grey.100',
                                            border: 1,
                                            borderColor: 'divider',
                                            fontSize: '1rem',
                                            fontWeight: 600,
                                            color: 'text.secondary',
                                        }}
                                    >
                                        3
                                    </Box>
                                )}
                            </Box>
                            {(kpiStyle === 'growth_index' || kpiStyle === 'standard') && (
                                <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5 }}>
                                    {comparisonLabel}: ${PREVIEW_PREVIOUS_VALUE}
                                </Typography>
                            )}
                            {primaryMeasureLabel && (
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                                    Measure: {primaryMeasureLabel}
                                </Typography>
                            )}
                        </>
                    )}
                </Box>
            </Box>
            <Box
                sx={{
                    p: 2.5,
                    borderTop: 1,
                    borderColor: 'divider',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 1.5,
                    bgcolor: 'background.paper',
                }}
            >
                {saveError && (
                    <Typography variant="caption" color="error" sx={{ flex: 1, minWidth: 0, mr: 2 }}>
                        {saveError}
                    </Typography>
                )}
                <Button
                    variant="outlined"
                    onClick={onCancel}
                    disabled={saving}
                    size="small"
                    sx={{ color: 'text.primary', borderColor: 'divider', px: 2 }}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    disabled={isDoneDisabled}
                    onClick={onDone}
                    size="small"
                    sx={{ bgcolor: 'primary.main', px: 3 }}
                >
                    {saving ? 'Saving...' : 'Done'}
                </Button>
            </Box>
        </Box>
    )
}

type RankingPreviewProps = {
    name: string
    displayRecordCount: boolean
    primaryMeasureLabel?: string
    rankShow?: 'Top 5' | 'Top 10' | 'Top 20' | 'Bottom 5' | 'Bottom 10' | 'Bottom 20'
    shortened?: boolean
    shortenedFormat?: ShortenedNumberFormat
    shortenedDecimalPlaces?: 0 | 1 | 2
    shortenedMeasureIds?: string[]
    rankByLabel?: string
}

function RankingPreview({
    name,
    displayRecordCount,
    primaryMeasureLabel,
    rankShow,
    shortened,
    shortenedFormat,
    shortenedDecimalPlaces,
    shortenedMeasureIds,
    rankByLabel,
}: RankingPreviewProps) {
    const measureLabel = primaryMeasureLabel || 'Amount'

    const [direction, countStr] = (rankShow ?? 'Top 5').split(' ')
    const count = Number(countStr) || 5
    const rows = (
        direction === 'Bottom' ? [...PREVIEW_RANKING_ROWS].reverse() : PREVIEW_RANKING_ROWS
    ).slice(0, Math.min(count, PREVIEW_RANKING_ROWS.length))

    const formatMeasure = (value: number, label: string): string => {
        if (
            shortened &&
            shortenedFormat &&
            (!shortenedMeasureIds?.length || shortenedMeasureIds.includes(label))
        ) {
            return formatShortenedNumber(value, shortenedFormat, shortenedDecimalPlaces ?? 0)
        }
        return `$${value.toLocaleString()}`
    }

    return (
        <>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b', mb: 1.5, minHeight: '1.25rem' }}>
                {name || 'Untitled'}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, fontSize: '0.8125rem' }}>
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        pb: 0.5,
                        borderBottom: 1,
                        borderColor: 'divider',
                        color: 'text.secondary',
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                    }}
                >
                    <span>{rankByLabel || 'Rank'}</span>
                    {displayRecordCount ? (
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <span>{measureLabel}</span>
                            <span>Record Count</span>
                        </Box>
                    ) : (
                        <span>{measureLabel}</span>
                    )}
                </Box>
                {rows.map((row, idx) => (
                    <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', color: 'text.primary' }}>
                        <span>
                            {idx + 1}. {row.label}
                        </span>
                        {displayRecordCount ? (
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <span>{formatMeasure(row.value, measureLabel)}</span>
                                <span>{formatMeasure(row.recordCount, 'Record Count')}</span>
                            </Box>
                        ) : (
                            <span>{formatMeasure(row.value, measureLabel)}</span>
                        )}
                    </Box>
                ))}
            </Box>
        </>
    )
}

type ScorecardPreviewProps = {
    name: string
    displayRecordCount: boolean
    primaryMeasureLabel?: string
    rankShow?: 'Top 5' | 'Top 10' | 'Top 20' | 'Bottom 5' | 'Bottom 10' | 'Bottom 20'
    shortened?: boolean
    shortenedFormat?: ShortenedNumberFormat
    shortenedDecimalPlaces?: 0 | 1 | 2
    shortenedMeasureIds?: string[]
    objective?: 'increase_positive' | 'decrease_positive' | ''
    compareTo?: 'Previous Period' | 'Previous Year' | 'Custom' | ''
    comparisonFromDate?: string
    comparisonToDate?: string
    rankByLabel?: string
}

function ScorecardPreview({
    name,
    displayRecordCount,
    primaryMeasureLabel,
    rankShow,
    shortened,
    shortenedFormat,
    shortenedDecimalPlaces,
    shortenedMeasureIds,
    objective,
    compareTo,
    comparisonFromDate,
    comparisonToDate,
    rankByLabel,
}: ScorecardPreviewProps) {
    const measureLabel = primaryMeasureLabel || 'Amount'

    const [direction, countStr] = (rankShow ?? 'Top 5').split(' ')
    const count = Number(countStr) || 5
    const rows = (
        direction === 'Bottom' ? [...PREVIEW_SCORECARD_ROWS].reverse() : PREVIEW_SCORECARD_ROWS
    ).slice(0, Math.min(count, PREVIEW_SCORECARD_ROWS.length))

    const formatMeasure = (value: number, label: string): string => {
        if (
            shortened &&
            shortenedFormat &&
            (!shortenedMeasureIds?.length || shortenedMeasureIds.includes(label))
        ) {
            return formatShortenedNumber(value, shortenedFormat, shortenedDecimalPlaces ?? 0)
        }
        return `$${value.toLocaleString()}`
    }

    let comparisonFooter = '* Compared with Previous Period'
    if (compareTo === 'Previous Year') {
        comparisonFooter = '* Compared with Last Year'
    } else if (compareTo === 'Custom') {
        comparisonFooter = comparisonFromDate && comparisonToDate
            ? `* Compared with ${comparisonFromDate} to ${comparisonToDate}`
            : '* Compared with Custom Period'
    }

    return (
        <>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b', mb: 1.5, minHeight: '1.25rem' }}>
                {name || 'Untitled'}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, fontSize: '0.8125rem' }}>
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        pb: 0.5,
                        borderBottom: 1,
                        borderColor: 'divider',
                        color: 'text.secondary',
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                    }}
                >
                    <span>{rankByLabel || 'Rank'}</span>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <span>{measureLabel}</span>
                        {displayRecordCount && <span>Record Count</span>}
                    </Box>
                </Box>
                {rows.map((row, idx) => {
                    const isPositiveGrowth = row.growth > 0
                    const isNegativeGrowth = row.growth < 0
                    const isFavorable = objective === 'decrease_positive' ? isNegativeGrowth : isPositiveGrowth
                    const growthColor =
                        row.growth === 0 ? 'text.secondary' : isFavorable ? '#10b981' : '#ef4444'

                    return (
                        <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', color: 'text.primary' }}>
                            <span>
                                {idx + 1}. {row.label}
                            </span>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <span>{formatMeasure(row.value, measureLabel)}</span>
                                    <Box component="span" sx={{ color: growthColor, fontWeight: 600, fontSize: '0.6875rem' }}>
                                        {isPositiveGrowth ? '▲' : isNegativeGrowth ? '▼' : ''}
                                        {Math.abs(row.growth)}%
                                    </Box>
                                </Box>
                                {displayRecordCount && (
                                    <span>{formatMeasure(row.recordCount, 'Record Count')}</span>
                                )}
                            </Box>
                        </Box>
                    )
                })}
            </Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, fontStyle: 'italic' }}>
                {comparisonFooter}
            </Typography>
        </>
    )
}
