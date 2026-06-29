'use client'

import { memo, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Box, IconButton, Typography } from '@mui/material'

import type { ChartKind, WidgetCatalogItem } from '../../types'
import type { KPIStyle } from '../KPIStyleSelectionModal'
import type { ComparatorStyle } from '../../utils/addComponentCatalog'
import {
  ALL_COMPONENT_CARDS,
  CHART_TYPE_CARDS,
  type ComponentSource,
} from './navConfig'
import { SourceToggle, TypeCards } from './nav/NavRows'
import { QuickChartConfigPanel } from './panels/QuickChartConfigPanel'
import { ReportChartConfigPanel } from './panels/ReportChartConfigPanel'
import { KpiConfigPanel } from './panels/KpiConfigPanel'
import { ComparatorConfigPanel } from './panels/ComparatorConfigPanel'
import { StandardStaircaseConfigPanel } from './panels/StandardStaircaseConfigPanel'

export type AddComponentScreenProps = {
  open: boolean
  onClose: () => void
  onDone: (item: WidgetCatalogItem) => void
}

const DEFAULT_COMPONENT_ID = ALL_COMPONENT_CARDS[0].id // 'column' (Chart)
const DEFAULT_REPORT_CHART: ChartKind = 'column'

function AddComponentScreenInner({ open, onClose, onDone }: AddComponentScreenProps) {
  const [source, setSource] = useState<ComponentSource>('chart')
  // Single selection across the flat, category-tagged card list for the "Chart" source.
  const [componentId, setComponentId] = useState<string>(DEFAULT_COMPONENT_ID)
  // Independent selection for the "Chart From Report" source (chart kinds only).
  const [reportChartType, setReportChartType] = useState<ChartKind>(DEFAULT_REPORT_CHART)

  useEffect(() => {
    if (!open) {
      setSource('chart')
      setComponentId(DEFAULT_COMPONENT_ID)
      setReportChartType(DEFAULT_REPORT_CHART)
      return
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open || typeof document === 'undefined') return null

  // The selected card carries the category that routes it to the correct panel.
  const selectedCard =
    ALL_COMPONENT_CARDS.find(card => card.id === componentId) ?? ALL_COMPONENT_CARDS[0]

  const typeCards = source === 'report' ? CHART_TYPE_CARDS : ALL_COMPONENT_CARDS
  const typeValue = source === 'report' ? reportChartType : componentId
  const onTypeChange = (id: string) =>
    source === 'report' ? setReportChartType(id as ChartKind) : setComponentId(id)

  const renderPanel = () => {
    if (source === 'report') {
      return (
        <ReportChartConfigPanel
          key="report"
          active
          controlledChartKind={reportChartType}
          onClose={onClose}
          onDone={onDone}
        />
      )
    }
    if (selectedCard.category === 'chart') {
      return (
        <QuickChartConfigPanel
          key="chart"
          active
          controlledChartKind={selectedCard.id as ChartKind}
          onClose={onClose}
          onDone={onDone}
        />
      )
    }
    if (selectedCard.category === 'kpi') {
      return (
        <KpiConfigPanel
          key="kpi"
          active
          kpiStyle={selectedCard.id as KPIStyle}
          onClose={onClose}
          onDone={onDone}
        />
      )
    }
    if (selectedCard.category === 'comparator') {
      return (
        <ComparatorConfigPanel
          key="comparator"
          active
          comparatorStyle={selectedCard.id as ComparatorStyle}
          onClose={onClose}
          onDone={onDone}
        />
      )
    }
    return (
      <StandardStaircaseConfigPanel
        key="stage"
        active
        onClose={onClose}
        onDone={onDone}
      />
    )
  }

  return createPortal(
    <Box
      className="fixed inset-0 z-[1299] flex items-start justify-center overflow-y-auto bg-black/40 p-4"
      role="presentation"
      onClick={onClose}
    >
      <Box
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-component-screen-title"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          my: 'auto',
          width: '100%',
          maxWidth: 1180,
          height: 'calc(100vh - 32px)',
          maxHeight: 'calc(100vh - 32px)',
          borderRadius: 2,
          bgcolor: 'background.paper',
          boxShadow: 24,
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 56,
            minHeight: 56,
            px: 3,
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            flexShrink: 0,
          }}
        >
          <Typography
            id="add-component-screen-title"
            variant="h6"
            component="h2"
            sx={{ fontWeight: 700, fontSize: '1.125rem', lineHeight: 1.3 }}
          >
            Add Component
          </Typography>
          <IconButton aria-label="Close" onClick={onClose} size="small">
            <i className="ri-close-line text-xl" aria-hidden />
          </IconButton>
        </Box>

        {/* Navigation rows */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            px: 3,
            py: 1.5,
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'background.default',
            flexShrink: 0,
          }}
        >
          <SourceToggle value={source} onChange={setSource} />
          <Box>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.5, display: 'block' }}
            >
              Select Type
            </Typography>
            <TypeCards cards={typeCards} value={typeValue} onChange={onTypeChange} />
          </Box>
        </Box>

        {/* Active configuration panel (config + preview + footer) */}
        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          {renderPanel()}
        </Box>
      </Box>
    </Box>,
    document.body
  )
}

export const AddComponentScreen = memo(AddComponentScreenInner)
