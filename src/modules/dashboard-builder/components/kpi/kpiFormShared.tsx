'use client'

import { Autocomplete, Box, FormControl, MenuItem, Select, TextField, Typography } from '@mui/material'
import type { TimePeriodLastUnit } from '../../utils/timePeriodOptions'

import { getMeasureDisplayParts } from '../../utils/measureGroupingRules'
import type { AggregateOption } from '../../utils/buildAggregateOptions'
import type { FlatFieldOption } from '../../utils/report-filters/flatten-catalog-fields'

export const labelCellSx = {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    pt: 1,
    pr: 1,
    minWidth: { xs: '100%', md: 200 },
    flexShrink: 0,
}

export const fieldCellSx = { flex: 1, minWidth: 0 }

export const MEASURE_MODULE_COLOR = '#0d9488'

export function MeasureOptionLabel({ option }: { option: AggregateOption }) {
    const { title, moduleLabel } = getMeasureDisplayParts(option)
    return (
        <Box component="span" sx={{ fontSize: '0.875rem' }}>
            {title}
            {moduleLabel ? (
                <>
                    {' - '}
                    <Box component="span" sx={{ color: MEASURE_MODULE_COLOR, fontWeight: 500 }}>
                        {moduleLabel}
                    </Box>
                </>
            ) : null}
        </Box>
    )
}

export function FormRow({
    label,
    children,
    alignTop,
}: {
    label: React.ReactNode
    children: React.ReactNode
    alignTop?: boolean
}) {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                gap: { xs: 0.5, md: 1 },
                mb: 2,
                alignItems: alignTop ? 'flex-start' : { md: 'center' },
            }}
        >
            <Box sx={{ ...labelCellSx, pt: alignTop ? 1.25 : 1 }}>{label}</Box>
            <Box sx={fieldCellSx}>{children}</Box>
        </Box>
    )
}

/** Duration form fields shared by the KPI Scorecard and Comparator Parameter configuration screens. */
export type DurationFormState = {
    durationField: string
    durationValue: string
    durationLastValue: number | ''
    durationLastUnit: 'day' | 'week' | 'month'
    durationFromDate: string
    durationToDate: string
}

const dateInputSx = {
    '& .MuiOutlinedInput-root': {
        borderRadius: 1.5,
        fontSize: '0.875rem',
        bgcolor: 'background.paper',
    },
}

/**
 * Duration field + preset selector (Today/Yesterday/This Week/.../Last/Custom), reused as-is
 * by both the KPI Scorecard duration row and the Comparator Parameter Configuration form.
 */
export function DurationFields({
    form,
    patch,
    dateFieldOptions,
}: {
    form: DurationFormState
    patch: (partial: Partial<DurationFormState>) => void
    dateFieldOptions: FlatFieldOption[]
}) {
    return (
        <>
            <FormRow label={<Typography variant="body2">Duration</Typography>}>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Autocomplete
                        fullWidth
                        size="small"
                        options={dateFieldOptions}
                        getOptionLabel={opt => opt.displayLabel}
                        value={dateFieldOptions.find(o => o.key === form.durationField) || null}
                        onChange={(_, next) => {
                            if (!next) {
                                patch({
                                    durationField: '',
                                    durationValue: 'Select duration',
                                    durationLastValue: '',
                                    durationLastUnit: 'day',
                                    durationFromDate: '',
                                    durationToDate: '',
                                })
                                return
                            }
                            patch({ durationField: next.key })
                        }}
                        renderInput={params => (
                            <TextField {...params} placeholder="Search date fields…" sx={dateInputSx} />
                        )}
                        ListboxProps={{ sx: { maxHeight: 220, fontSize: '0.875rem' } }}
                    />
                    <FormControl fullWidth size="small">
                        <Select
                            value={form.durationValue}
                            disabled={!form.durationField}
                            onChange={e => {
                                const next = e.target.value
                                if (next === 'Last') {
                                    patch({
                                        durationValue: next,
                                        durationLastValue: form.durationLastValue || 7,
                                        durationLastUnit: form.durationLastUnit || 'day',
                                        durationFromDate: '',
                                        durationToDate: '',
                                    })
                                } else if (next === 'Custom') {
                                    patch({
                                        durationValue: next,
                                        durationLastValue: '',
                                        durationLastUnit: 'day',
                                    })
                                } else {
                                    patch({
                                        durationValue: next,
                                        durationLastValue: '',
                                        durationLastUnit: 'day',
                                        durationFromDate: '',
                                        durationToDate: '',
                                    })
                                }
                            }}
                        >
                            <MenuItem value="Select duration" disabled>
                                <em>Select duration</em>
                            </MenuItem>
                            <MenuItem value="Today">Today</MenuItem>
                            <MenuItem value="Yesterday">Yesterday</MenuItem>
                            <MenuItem value="This Week">This Week</MenuItem>
                            <MenuItem value="Last Week">Last Week</MenuItem>
                            <MenuItem value="This Month">This Month</MenuItem>
                            <MenuItem value="Last Month">Last Month</MenuItem>
                            <MenuItem value="This Quarter">This Quarter</MenuItem>
                            <MenuItem value="Last Quarter">Last Quarter</MenuItem>
                            <MenuItem value="This Year">This Year</MenuItem>
                            <MenuItem value="Last Year">Last Year</MenuItem>
                            <MenuItem value="Last">Last</MenuItem>
                            <MenuItem value="Custom">Custom</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            </FormRow>

            {form.durationValue === 'Last' && (
                <FormRow label={<Typography variant="body2">Last</Typography>}>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <TextField
                            fullWidth
                            size="small"
                            type="number"
                            placeholder="Enter value"
                            value={form.durationLastValue}
                            inputProps={{ min: 1, step: 1 }}
                            onChange={e => {
                                const raw = e.target.value
                                if (raw === '') {
                                    patch({ durationLastValue: '' })
                                    return
                                }
                                const next = Math.max(1, Math.floor(Number(raw)))
                                if (!Number.isNaN(next)) patch({ durationLastValue: next })
                            }}
                            sx={{ flex: 1, minWidth: 0, ...dateInputSx }}
                        />
                        <FormControl fullWidth size="small" sx={{ flex: 1, minWidth: 0 }}>
                            <Select
                                value={form.durationLastUnit}
                                onChange={e => patch({ durationLastUnit: e.target.value as 'day' | 'week' | 'month' })}
                            >
                                <MenuItem value="day">day(s)</MenuItem>
                                <MenuItem value="week">week(s)</MenuItem>
                                <MenuItem value="month">month(s)</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </FormRow>
            )}

            {form.durationValue === 'Custom' && (
                <>
                    <FormRow label={<Typography variant="body2">From</Typography>}>
                        <TextField
                            fullWidth
                            size="small"
                            type="date"
                            value={form.durationFromDate}
                            onChange={e => patch({ durationFromDate: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                            sx={dateInputSx}
                        />
                    </FormRow>
                    <FormRow label={<Typography variant="body2">To</Typography>}>
                        <TextField
                            fullWidth
                            size="small"
                            type="date"
                            value={form.durationToDate}
                            onChange={e => patch({ durationToDate: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{ min: form.durationFromDate || undefined }}
                            error={Boolean(
                                form.durationFromDate &&
                                form.durationToDate &&
                                form.durationToDate < form.durationFromDate
                            )}
                            helperText={
                                form.durationFromDate &&
                                form.durationToDate &&
                                form.durationToDate < form.durationFromDate
                                    ? 'To date cannot be earlier than From date'
                                    : undefined
                            }
                            sx={dateInputSx}
                        />
                    </FormRow>
                </>
            )}
        </>
    )
}

/**
 * State shape for TimePeriodPicker — mirrors the duration sub-fields of DurationFormState
 * but without the date-field selector (used by Compare Among = Time Period in the Comparator).
 */
export type TimePeriodPickerState = {
    value: string
    lastValue: number | ''
    lastUnit: TimePeriodLastUnit
    fromDate: string
    toDate: string
}

/**
 * Standalone time-period dropdown with "Last N unit" and "Custom date range" sub-controls.
 * Reuses the same KPI Duration options and validation logic as DurationFields, but omits
 * the date-field autocomplete since the Comparator selects the date field per-parameter.
 */
export function TimePeriodPicker({
    state,
    patch,
}: {
    state: TimePeriodPickerState
    patch: (partial: Partial<TimePeriodPickerState>) => void
}) {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <FormControl fullWidth size="small">
                <Select
                    value={state.value}
                    displayEmpty
                    onChange={e => {
                        const next = e.target.value
                        if (next === 'Last') {
                            patch({
                                value: next,
                                lastValue: state.lastValue || 7,
                                lastUnit: state.lastUnit || 'day',
                                fromDate: '',
                                toDate: '',
                            })
                        } else if (next === 'Custom') {
                            patch({ value: next, lastValue: '', lastUnit: 'day' })
                        } else {
                            patch({ value: next, lastValue: '', lastUnit: 'day', fromDate: '', toDate: '' })
                        }
                    }}
                >
                    <MenuItem value="" disabled>
                        <em>Select time period</em>
                    </MenuItem>
                    <MenuItem value="Today">Today</MenuItem>
                    <MenuItem value="Yesterday">Yesterday</MenuItem>
                    <MenuItem value="This Week">This Week</MenuItem>
                    <MenuItem value="Last Week">Last Week</MenuItem>
                    <MenuItem value="This Month">This Month</MenuItem>
                    <MenuItem value="Last Month">Last Month</MenuItem>
                    <MenuItem value="This Quarter">This Quarter</MenuItem>
                    <MenuItem value="Last Quarter">Last Quarter</MenuItem>
                    <MenuItem value="This Year">This Year</MenuItem>
                    <MenuItem value="Last Year">Last Year</MenuItem>
                    <MenuItem value="Last">Last</MenuItem>
                    <MenuItem value="Custom">Custom</MenuItem>
                </Select>
            </FormControl>

            {state.value === 'Last' && (
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <TextField
                        fullWidth
                        size="small"
                        type="number"
                        placeholder="Enter value"
                        value={state.lastValue}
                        inputProps={{ min: 1, step: 1 }}
                        onChange={e => {
                            const raw = e.target.value
                            if (raw === '') { patch({ lastValue: '' }); return }
                            const next = Math.max(1, Math.floor(Number(raw)))
                            if (!Number.isNaN(next)) patch({ lastValue: next })
                        }}
                        sx={{ flex: 1, minWidth: 0, ...dateInputSx }}
                    />
                    <FormControl fullWidth size="small" sx={{ flex: 1, minWidth: 0 }}>
                        <Select
                            value={state.lastUnit}
                            onChange={e => patch({ lastUnit: e.target.value as TimePeriodLastUnit })}
                        >
                            <MenuItem value="day">Days</MenuItem>
                            <MenuItem value="week">Weeks</MenuItem>
                            <MenuItem value="month">Months</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            )}

            {state.value === 'Custom' && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box>
                        <Typography variant="caption" sx={{ mb: 0.5, display: 'block', color: 'text.secondary' }}>
                            From Date
                        </Typography>
                        <TextField
                            fullWidth
                            size="small"
                            type="date"
                            value={state.fromDate}
                            onChange={e => patch({ fromDate: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                            sx={dateInputSx}
                        />
                    </Box>
                    <Box>
                        <Typography variant="caption" sx={{ mb: 0.5, display: 'block', color: 'text.secondary' }}>
                            To Date
                        </Typography>
                        <TextField
                            fullWidth
                            size="small"
                            type="date"
                            value={state.toDate}
                            onChange={e => patch({ toDate: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{ min: state.fromDate || undefined }}
                            error={Boolean(state.fromDate && state.toDate && state.toDate < state.fromDate)}
                            helperText={
                                state.fromDate && state.toDate && state.toDate < state.fromDate
                                    ? 'To date cannot be earlier than From date'
                                    : undefined
                            }
                            sx={dateInputSx}
                        />
                    </Box>
                </Box>
            )}
        </Box>
    )
}
