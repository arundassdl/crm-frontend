'use client'

import { memo } from 'react'
import { Box } from '@mui/material'

import type { WidgetCatalogItem } from '../../../types'
import type { KPIStyle } from '../../KPIStyleSelectionModal'
import { useKpiConfigForm } from '../../../hooks/useKpiConfigForm'
import { KpiConfigFormFields } from '../../kpi/KpiConfigFormFields'
import { KpiPreviewPanel } from '../../kpi/KpiPreviewPanel'

export type KpiConfigPanelProps = {
  /** Whether the panel is mounted/active — gates data fetching and form reset. */
  active: boolean
  kpiStyle: KPIStyle
  onClose: () => void
  onDone: (item: WidgetCatalogItem) => void
}

/**
 * Embeds the existing KPI configuration form + live preview into the unified
 * Add Component screen. Reuses {@link useKpiConfigForm}, {@link KpiConfigFormFields}
 * and {@link KpiPreviewPanel} verbatim so the save/payload logic is unchanged.
 */
function KpiConfigPanelInner({ active, kpiStyle, onClose, onDone }: KpiConfigPanelProps) {
  const formApi = useKpiConfigForm({ open: active, kpiStyle, onDone, onClose })
  const {
    form,
    saving,
    saveError,
    isDoneDisabled,
    isCountMeasure,
    primaryMeasureLabel,
    rankByLabel,
    handleDone,
  } = formApi

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', lg: 'row' },
        alignItems: { lg: 'stretch' },
        flex: 1,
        minHeight: 0,
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
        <KpiConfigFormFields kpiStyle={kpiStyle} {...formApi} />
      </Box>

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
    </Box>
  )
}

export const KpiConfigPanel = memo(KpiConfigPanelInner)
