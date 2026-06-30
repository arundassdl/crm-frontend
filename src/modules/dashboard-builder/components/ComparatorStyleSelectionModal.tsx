'use client'

import { memo, useEffect, useState } from 'react'
import { Box, IconButton, Typography } from '@mui/material'

import type { WidgetCatalogItem } from '../types'
import { COMPARATOR_STYLE_LABELS, type ComparatorStyle } from '../utils/addComponentCatalog'
import { useComparatorConfigForm } from '../hooks/useComparatorConfigForm'
import { ComparatorConfigScreen } from './comparator/ComparatorConfigScreen'
import { buildElegantSampleMetrics, ElegantScorecard, ELEGANT_SAMPLE_USERS, ELEGANT_SAMPLE_METRICS } from './comparator/ElegantScorecard'

interface ComparatorStyleOption {
  id: ComparatorStyle
  label: string
  renderPreview: () => React.ReactNode
}

const COMPARATOR_STYLES: ComparatorStyleOption[] = [
  {
    id: 'elegant',
    label: 'Elegant',
    renderPreview: () => (
      <ElegantScorecard
        title="Elegant"
        users={ELEGANT_SAMPLE_USERS}
        metrics={buildElegantSampleMetrics(ELEGANT_SAMPLE_USERS, ELEGANT_SAMPLE_METRICS)}
        compact
      />
    ),
  },
]

export type ComparatorStyleSelectionModalProps = {
  open: boolean
  onClose: () => void
  /** Adds the comparator widget to the dashboard. */
  onAddWidget: (item: WidgetCatalogItem) => void
}

function ComparatorStyleSelectionModalInner({ open, onClose, onAddWidget }: ComparatorStyleSelectionModalProps) {
  const [view, setView] = useState<'selection' | 'config'>('selection')
  const [selectedStyle, setSelectedStyle] = useState<ComparatorStyle | null>(null)

  const form = useComparatorConfigForm({
    open,
    comparatorStyle: selectedStyle,
    onDone: onAddWidget,
    onClose,
  })

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

  if (!open) return null

  const handleStyleClick = (styleId: ComparatorStyle) => {
    setSelectedStyle(styleId)
    setView('config')
  }

  const handleBack = () => {
    setView('selection')
  }

  return (
    <Box
      className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto bg-black/40 px-4 py-6"
      role="presentation"
      onClick={onClose}
    >
      <Box
        role="dialog"
        aria-modal="true"
        aria-labelledby="comparator-style-title"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          maxWidth: view === 'config' ? 1080 : 1200,
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
            <Typography id="comparator-style-title" variant="h6" component="h2" sx={{ fontWeight: 600, fontSize: '1.125rem' }}>
              {view === 'config' && selectedStyle
                ? COMPARATOR_STYLE_LABELS[selectedStyle]
                : 'Choose Comparator Style'}
            </Typography>
          </Box>
          <IconButton aria-label="Close" onClick={onClose} size="small">
            <i className="ri-close-line text-xl" aria-hidden />
          </IconButton>
        </Box>

        {view === 'selection' ? (
          <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', px: 3, py: 3 }}>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {COMPARATOR_STYLES.map(style => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => handleStyleClick(style.id)}
                  className={`group flex flex-col items-stretch gap-3 rounded-2xl border-2 p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mui-palette-primary-main)] focus-visible:ring-offset-2 ${
                    selectedStyle === style.id
                      ? 'border-[var(--mui-palette-primary-main)] bg-[var(--mui-palette-primary-lightOpacity)] shadow-md'
                      : 'border-[var(--mui-palette-divider)] bg-[var(--mui-palette-background-paper)] hover:border-[var(--mui-palette-primary-main)]'
                  }`}
                >
                  <div className="h-80 w-full sm:h-96">{style.renderPreview()}</div>
                  <span
                    className={`text-center text-sm font-medium ${
                      selectedStyle === style.id
                        ? 'text-[var(--mui-palette-primary-main)]'
                        : 'text-[var(--mui-palette-text-secondary)] group-hover:text-[var(--mui-palette-text-primary)]'
                    }`}
                  >
                    {style.label}
                  </span>
                </button>
              ))}
            </div>
          </Box>
        ) : (
          selectedStyle && (
            <ComparatorConfigScreen
              comparatorStyle={selectedStyle}
              form={form}
              onCancel={onClose}
              onDone={() => void form.handleDone()}
            />
          )
        )}
      </Box>
    </Box>
  )
}

export const ComparatorStyleSelectionModal = memo(ComparatorStyleSelectionModalInner)
