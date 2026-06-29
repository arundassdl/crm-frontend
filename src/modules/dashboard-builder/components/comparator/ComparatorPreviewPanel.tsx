'use client'

import { memo } from 'react'
import { Box, Button, Typography } from '@mui/material'

import type { ComparatorStyle } from '../../utils/addComponentCatalog'
import { buildElegantSampleMetrics, ElegantScorecard, ELEGANT_SAMPLE_USERS } from './ElegantScorecard'
import { TimePeriodPivotTable } from './TimePeriodPivotTable'

const DEFAULT_PARAMETERS: Record<ComparatorStyle, string[]> = {
  elegant: ['Leads Created', 'Revenue Generated', 'Deals Closed', 'Conversion Rate'],
}

export type ComparatorPreviewPanelProps = {
  comparatorStyle: ComparatorStyle
  compareAmongType?: string
  compareAmongLabel?: string
  parameterLabels: string[]
  /** Selected "Custom Users" (Compare Among → Users) for the Elegant scorecard preview. */
  selectedUsers?: string[]
  componentName: string
  onCancel: () => void
  onDone: () => void
  isDoneDisabled?: boolean
  saving?: boolean
  saveError?: string
}

function ComparatorPreviewPanelInner({
  comparatorStyle,
  compareAmongType,
  compareAmongLabel,
  parameterLabels,
  selectedUsers,
  componentName,
  onCancel,
  onDone,
  isDoneDisabled,
  saving,
  saveError,
}: ComparatorPreviewPanelProps) {
  const isTimePeriod = compareAmongType === 'time_period'
  const metrics = parameterLabels.length > 0 ? parameterLabels : DEFAULT_PARAMETERS[comparatorStyle]

  return (
    <Box
      sx={{
        flex: { lg: '0 0 380px' },
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        borderTop: { xs: 1, lg: 0 },
        borderLeft: { lg: 1 },
        borderColor: 'divider',
        bgcolor: 'grey.50',
      }}
    >
      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', px: 3, py: 2.5 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
        {componentName || 'Comparator Preview'}
      </Typography>
      {compareAmongLabel ? (
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5 }}>
          Compared by: {compareAmongLabel}
        </Typography>
      ) : null}

      {comparatorStyle === 'elegant' && isTimePeriod && (
        <TimePeriodPivotTable
          data={{
            periodLabel: compareAmongLabel || 'Time Period',
            rows: metrics.map((name, i) => ({ name, value: String(30 + ((i * 37) % 70)) })),
          }}
        />
      )}

      {comparatorStyle === 'elegant' && !isTimePeriod && (
        <ElegantScorecard
          title={`${new Date().getFullYear()} - Sales Representative Scorecard`}
          users={selectedUsers && selectedUsers.length > 0 ? selectedUsers : ELEGANT_SAMPLE_USERS}
          metrics={buildElegantSampleMetrics(
            selectedUsers && selectedUsers.length > 0 ? selectedUsers : undefined,
            metrics
          )}
        />
      )}

      </Box>

      <Box
        sx={{
          p: 2.5,
          borderTop: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 1.5,
          bgcolor: 'background.paper',
        }}
      >
        {saveError && (
          <Typography variant="caption" color="error" sx={{ flex: 1, minWidth: 0 }}>
            {saveError}
          </Typography>
        )}
        <Button
          variant="outlined"
          onClick={onCancel}
          size="small"
          disabled={saving}
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

export const ComparatorPreviewPanel = memo(ComparatorPreviewPanelInner)
