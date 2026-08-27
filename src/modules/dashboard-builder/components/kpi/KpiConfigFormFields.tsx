'use client'

import {
    Autocomplete,
    Box,
    Checkbox,
    FormControl,
    FormControlLabel,
    IconButton,
    Link,
    MenuItem,
    Select,
    TextField,
    Typography,
} from '@mui/material'

import { QuickChartCriteriaFilterSection } from '../quick-chart/QuickChartCriteriaFilter'
import type { KPIStyle } from '../KPIStyleSelectionModal'
import type { useKpiConfigForm } from '../../hooks/useKpiConfigForm'
import { DurationFields, FormRow, MeasureOptionLabel } from './kpiFormShared'

export type KpiConfigFormFieldsProps = ReturnType<typeof useKpiConfigForm> & {
    kpiStyle: KPIStyle
}

export function KpiConfigFormFields({
    kpiStyle,
    form,
    patch,
    modulesLoading,
    moduleOptionsList,
    relatedOptions,
    relatedLoading,
    measuresLoading,
    measureOptions,
    measureOptionsById,
    groupingOptions,
    isCountMeasure,
    dateFieldOptions,
    moduleOrder,
    catalogByModule,
    layoutByModule,
    picklistModuleByModule,
    fieldsCatalogLoading,
    userToken,
    createEmptyQuickChartFilter,
}: KpiConfigFormFieldsProps) {
    const selectedMeasureLabel = measureOptionsById.get(form.measure)?.label
    const availableShortenedMeasureLabels = [
        ...(selectedMeasureLabel ? [selectedMeasureLabel] : []),
        ...(form.displayRecordCount ? ['Record Count'] : []),
    ]

    return (
        <Box>
            <FormRow label={<Typography variant="body2">Component Name</Typography>}>
                <TextField
                    fullWidth
                    size="small"
                    value={form.name}
                    onChange={e => patch({ name: e.target.value })}
                />
            </FormRow>

            <FormRow
                label={
                    <Typography variant="body2">
                        {kpiStyle === 'scorecard' ? 'KPI Metric' : 'Module(s)'}
                    </Typography>
                }
                alignTop
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <FormControl fullWidth size="small" disabled={modulesLoading}>
                        <Select
                            value={form.primaryModule}
                            displayEmpty
                            onChange={e => patch({ primaryModule: e.target.value })}
                        >
                            <MenuItem value="" disabled>
                                <em>{modulesLoading ? 'Loading modules…' : 'Select module'}</em>
                            </MenuItem>
                            {moduleOptionsList.map(m => (
                                <MenuItem key={m.value} value={m.value}>
                                    {m.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl
                        fullWidth
                        size="small"
                        disabled={!form.primaryModule || relatedLoading}
                    >
                        <Select
                            value={form.relatedModule}
                            displayEmpty
                            onChange={e => patch({ relatedModule: e.target.value })}
                        >
                            <MenuItem value="">
                                <em>
                                    {!form.primaryModule
                                        ? 'Select primary module first'
                                        : relatedLoading
                                            ? 'Loading related modules…'
                                            : 'Select Related Module'}
                                </em>
                            </MenuItem>
                            {relatedOptions.map(m => (
                                <MenuItem key={m.value} value={m.value}>
                                    {m.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
            </FormRow>

            <FormRow label={<Typography variant="body2">Measure</Typography>}>
                <FormControl
                    fullWidth
                    size="small"
                    disabled={!form.primaryModule || measuresLoading}
                >
                    <Select
                        value={form.measure}
                        displayEmpty
                        onChange={e => patch({ measure: e.target.value })}
                        renderValue={value => {
                            if (!value) {
                                return (
                                    <Typography variant="body2" color="text.secondary" component="em">
                                        {!form.primaryModule
                                            ? 'Select primary module first'
                                            : measuresLoading
                                                ? 'Loading measures…'
                                                : 'Select measure'}
                                    </Typography>
                                )
                            }
                            const opt = measureOptionsById.get(value)
                            return opt ? <MeasureOptionLabel option={opt} /> : value
                        }}
                    >
                        <MenuItem value="" disabled>
                            <em>Select measure</em>
                        </MenuItem>
                        {measureOptions.map(opt => (
                            <MenuItem key={opt.id} value={opt.id}>
                                <MeasureOptionLabel option={opt} />
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </FormRow>

            <Box sx={{ pl: { md: '200px' }, mb: 2 }}>
                {!isCountMeasure && (
                    <FormControlLabel
                        control={
                            <Checkbox
                                size="small"
                                checked={form.displayRecordCount}
                                onChange={e => patch({ displayRecordCount: e.target.checked })}
                            />
                        }
                        label={<Typography variant="body2">Display record count</Typography>}
                    />
                )}
            </Box>

            <DurationFields form={form} patch={patch} dateFieldOptions={dateFieldOptions} />

            {/* Basic KPIs render the same count card as the other styles, so they need the
                comparison too — it is what produces the card's `↑ x% vs …` pill and its trend
                line. Still optional here: `canSubmit` only requires it for the styles that
                always required it. */}
            {(kpiStyle === 'basic' ||
                kpiStyle === 'growth_index' ||
                kpiStyle === 'standard' ||
                kpiStyle === 'scorecard') && (
                <>
                    <Box sx={{ mb: 1.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            Comparison Indicator
                        </Typography>
                    </Box>

                    <FormRow label={<Typography variant="body2">Compare To</Typography>}>
                        <FormControl fullWidth size="small">
                            <Select
                                value={form.compareTo}
                                displayEmpty
                                onChange={e => {
                                    const next = e.target.value as 'Previous Period' | 'Previous Year' | 'Custom'
                                    if (next === 'Custom') {
                                        patch({ compareTo: next })
                                    } else {
                                        patch({ compareTo: next, comparisonFromDate: '', comparisonToDate: '' })
                                    }
                                }}
                            >
                                <MenuItem value="" disabled>
                                    <em>Select option</em>
                                </MenuItem>
                                <MenuItem value="Previous Period">Previous Period</MenuItem>
                                <MenuItem value="Previous Year">Previous Year</MenuItem>
                                <MenuItem value="Custom">Custom</MenuItem>
                            </Select>
                        </FormControl>
                    </FormRow>

                    <FormRow label={<Typography variant="body2">Objective</Typography>}>
                        <FormControl fullWidth size="small">
                            <Select
                                value={form.objective}
                                displayEmpty
                                onChange={e =>
                                    patch({ objective: e.target.value as 'increase_positive' | 'decrease_positive' })
                                }
                            >
                                <MenuItem value="" disabled>
                                    <em>Select objective</em>
                                </MenuItem>
                                <MenuItem value="increase_positive">Consider increase in value as positive</MenuItem>
                                <MenuItem value="decrease_positive">Consider decrease in value as positive</MenuItem>
                            </Select>
                        </FormControl>
                    </FormRow>

                    {form.compareTo === 'Custom' && (
                        <>
                            <FormRow label={<Typography variant="body2">From</Typography>}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    type="date"
                                    value={form.comparisonFromDate}
                                    onChange={e => patch({ comparisonFromDate: e.target.value })}
                                    InputLabelProps={{ shrink: true }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 1.5,
                                            fontSize: '0.875rem',
                                            bgcolor: 'background.paper',
                                        },
                                    }}
                                />
                            </FormRow>
                            <FormRow label={<Typography variant="body2">To</Typography>}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    type="date"
                                    value={form.comparisonToDate}
                                    onChange={e => patch({ comparisonToDate: e.target.value })}
                                    InputLabelProps={{ shrink: true }}
                                    inputProps={{ min: form.comparisonFromDate || undefined }}
                                    error={Boolean(
                                        form.comparisonFromDate &&
                                        form.comparisonToDate &&
                                        form.comparisonToDate < form.comparisonFromDate
                                    )}
                                    helperText={
                                        form.comparisonFromDate &&
                                        form.comparisonToDate &&
                                        form.comparisonToDate < form.comparisonFromDate
                                            ? 'To date cannot be earlier than From date'
                                            : undefined
                                    }
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 1.5,
                                            fontSize: '0.875rem',
                                            bgcolor: 'background.paper',
                                        },
                                    }}
                                />
                            </FormRow>
                        </>
                    )}
                </>
            )}

            {form.showCriteriaFilter ? (
                <Box sx={{ pl: { md: '200px' }, mb: 2 }}>
                    <QuickChartCriteriaFilterSection
                        filters={form.criteriaFilters}
                        moduleOrder={moduleOrder}
                        catalogByModule={catalogByModule}
                        layoutByModule={layoutByModule}
                        picklistModuleByModule={picklistModuleByModule}
                        catalogLoading={fieldsCatalogLoading}
                        disabled={!form.primaryModule}
                        defaultModule={form.primaryModule}
                        userToken={userToken || undefined}
                        onChange={criteriaFilters => patch({ criteriaFilters })}
                        onRemoveSection={() => patch({ showCriteriaFilter: false, criteriaFilters: [] })}
                    />
                </Box>
            ) : (
                <Box sx={{ pl: { md: '200px' }, mb: 2 }}>
                    <Link
                        component="button"
                        type="button"
                        variant="body2"
                        underline="hover"
                        onClick={() => {
                            const initial = form.criteriaFilters.length
                                ? form.criteriaFilters
                                : [createEmptyQuickChartFilter(form.primaryModule)]
                            patch({
                                showCriteriaFilter: true,
                                criteriaFilters: initial,
                            })
                        }}
                        disabled={!form.primaryModule}
                    >
                        + Criteria filter
                    </Link>
                </Box>
            )}

            {kpiStyle !== 'basic' && (
                <>
                    <Box sx={{ pl: { md: '200px' }, mb: 2 }}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    size="small"
                                    checked={form.shortened}
                                    onChange={e => patch({ shortened: e.target.checked })}
                                />
                            }
                            label={<Typography variant="body2">Display as shortened numbers</Typography>}
                        />
                    </Box>

                    {(kpiStyle === 'rankings' || kpiStyle === 'scorecard') && form.shortened && (
                        <>
                            <FormRow label={<Typography variant="body2">Format</Typography>}>
                                <FormControl fullWidth size="small">
                                    <Select
                                        value={form.shortenedFormat}
                                        onChange={e =>
                                            patch({ shortenedFormat: e.target.value as 'K' | 'M' | 'B' })
                                        }
                                    >
                                        <MenuItem value="K">K (Thousands)</MenuItem>
                                        <MenuItem value="M">M (Millions)</MenuItem>
                                        <MenuItem value="B">B (Billions)</MenuItem>
                                    </Select>
                                </FormControl>
                            </FormRow>

                            <FormRow label={<Typography variant="body2">Decimal Places</Typography>}>
                                <FormControl fullWidth size="small">
                                    <Select
                                        value={form.shortenedDecimalPlaces}
                                        onChange={e =>
                                            patch({ shortenedDecimalPlaces: Number(e.target.value) as 0 | 1 | 2 })
                                        }
                                    >
                                        <MenuItem value={0}>0</MenuItem>
                                        <MenuItem value={1}>1</MenuItem>
                                        <MenuItem value={2}>2</MenuItem>
                                    </Select>
                                </FormControl>
                            </FormRow>

                            <FormRow label={<Typography variant="body2">Measure(s)</Typography>}>
                                <Autocomplete
                                    multiple
                                    fullWidth
                                    size="small"
                                    options={availableShortenedMeasureLabels}
                                    value={form.shortenedMeasureIds.filter(id =>
                                        availableShortenedMeasureLabels.includes(id)
                                    )}
                                    onChange={(_, next) => patch({ shortenedMeasureIds: next })}
                                    renderInput={params => (
                                        <TextField
                                            {...params}
                                            placeholder="Select measure(s)"
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: 1.5,
                                                    fontSize: '0.875rem',
                                                    bgcolor: 'background.paper',
                                                },
                                            }}
                                        />
                                    )}
                                />
                            </FormRow>
                        </>
                    )}

                    {(kpiStyle === 'rankings' || kpiStyle === 'scorecard') && (
                        <>
                            <Box sx={{ mb: 1.5 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                    Ranking
                                </Typography>
                            </Box>

                            <FormRow
                                label={
                                    <Typography variant="body2">
                                        {kpiStyle === 'scorecard' ? 'Rank By' : 'Rank Field'}
                                    </Typography>
                                }
                            >
                                <Autocomplete
                                    fullWidth
                                    size="small"
                                    options={groupingOptions}
                                    getOptionLabel={opt => opt.label}
                                    value={groupingOptions.find(o => o.id === form.rankField) || null}
                                    onChange={(_, next) => patch({ rankField: next?.id ?? '' })}
                                    renderInput={params => (
                                        <TextField
                                            {...params}
                                            placeholder="Select rank field"
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: 1.5,
                                                    fontSize: '0.875rem',
                                                    bgcolor: 'background.paper',
                                                },
                                            }}
                                        />
                                    )}
                                    ListboxProps={{ sx: { maxHeight: 220, fontSize: '0.875rem' } }}
                                />
                            </FormRow>

                            <FormRow label={<Typography variant="body2">Show</Typography>}>
                                <FormControl fullWidth size="small">
                                    <Select
                                        value={form.rankShow}
                                        onChange={e =>
                                            patch({
                                                rankShow: e.target.value as
                                                    | 'Top 5'
                                                    | 'Top 10'
                                                    | 'Top 20'
                                                    | 'Bottom 5'
                                                    | 'Bottom 10'
                                                    | 'Bottom 20',
                                            })
                                        }
                                    >
                                        <MenuItem value="Top 5">Top 5</MenuItem>
                                        <MenuItem value="Top 10">Top 10</MenuItem>
                                        <MenuItem value="Top 20">Top 20</MenuItem>
                                        <MenuItem value="Bottom 5">Bottom 5</MenuItem>
                                        <MenuItem value="Bottom 10">Bottom 10</MenuItem>
                                        <MenuItem value="Bottom 20">Bottom 20</MenuItem>
                                    </Select>
                                </FormControl>
                            </FormRow>
                        </>
                    )}

                    <FormRow
                        label={
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        size="small"
                                        checked={form.showComponentFilters}
                                        onChange={e => {
                                            const checked = e.target.checked
                                            patch({
                                                showComponentFilters: checked,
                                                componentFilterFields: checked
                                                    ? form.componentFilterFields.length
                                                        ? form.componentFilterFields
                                                        : ['']
                                                    : [],
                                            })
                                        }}
                                    />
                                }
                                label={<Typography variant="body2">Display Component Filters</Typography>}
                                sx={{ m: 0, mr: 0 }}
                            />
                        }
                    >
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
                            {form.componentFilterFields.map((fieldId, idx) => (
                                <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                    <FormControl fullWidth size="small" disabled={!form.showComponentFilters}>
                                        <Select
                                            value={fieldId}
                                            displayEmpty
                                            onChange={e => {
                                                const next = [...form.componentFilterFields]
                                                next[idx] = e.target.value
                                                patch({ componentFilterFields: next })
                                            }}
                                        >
                                            <MenuItem value="">
                                                <em>Select field</em>
                                            </MenuItem>
                                            {groupingOptions
                                                .filter(
                                                    o =>
                                                        o.id === fieldId ||
                                                        !form.componentFilterFields.includes(o.id)
                                                )
                                                .map(o => (
                                                    <MenuItem key={o.id} value={o.id}>
                                                        {o.label}
                                                    </MenuItem>
                                                ))}
                                        </Select>
                                    </FormControl>
                                    <IconButton
                                        size="small"
                                        aria-label="Remove filter field"
                                        disabled={!form.showComponentFilters}
                                        onClick={() =>
                                            patch({
                                                componentFilterFields: form.componentFilterFields.filter(
                                                    (_, i) => i !== idx
                                                ),
                                            })
                                        }
                                    >
                                        <i className="ri-close-line" aria-hidden />
                                    </IconButton>
                                </Box>
                            ))}
                            {form.showComponentFilters && form.componentFilterFields.length < 2 && (
                                <Link
                                    component="button"
                                    type="button"
                                    variant="body2"
                                    underline="hover"
                                    onClick={() =>
                                        patch({ componentFilterFields: [...form.componentFilterFields, ''] })
                                    }
                                    sx={{ alignSelf: 'flex-start' }}
                                >
                                    + Add filter field
                                </Link>
                            )}
                        </Box>
                    </FormRow>
                </>
            )}
        </Box>
    )
}
