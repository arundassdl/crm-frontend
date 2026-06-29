'use client'

import { memo } from 'react'
import { Box, Dialog, IconButton, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

import type { WidgetCatalogItem } from '../types'
import { QuickChartConfigPanel } from './add-component/panels/QuickChartConfigPanel'

type QuickChartModalProps = {
  open: boolean
  onClose: () => void
  onDone: (item: WidgetCatalogItem) => void
}

/**
 * Standalone "Add Chart" dialog. The configuration body + footer live in
 * {@link QuickChartConfigPanel} so the exact same form (and save/payload logic)
 * can be embedded into the unified Add Component screen.
 */
function QuickChartModalInner({ open, onClose, onDone }: QuickChartModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          maxWidth: 1080,
          borderRadius: 2,
          maxHeight: '88vh',
        },
      }}
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
        <Typography variant="h6" component="h2" sx={{ fontWeight: 600, fontSize: '1.125rem' }}>
          Add Chart
        </Typography>
        <IconButton aria-label="Close" onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      <QuickChartConfigPanel active={open} onClose={onClose} onDone={onDone} />
    </Dialog>
  )
}

export const QuickChartModal = memo(QuickChartModalInner)
