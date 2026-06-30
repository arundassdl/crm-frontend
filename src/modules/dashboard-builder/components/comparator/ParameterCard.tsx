'use client'

import { memo } from 'react'
import { Box, IconButton, Typography } from '@mui/material'

import type { ComparatorParameter } from '../../types/comparatorParameter'

export type ParameterCardProps = {
  parameter: ComparatorParameter
  onEdit: () => void
  onDelete: () => void
}

function ParameterCardInner({ parameter, onEdit, onDelete }: ParameterCardProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 1,
        borderRadius: 1.5,
        border: 1,
        borderColor: 'divider',
        px: 1.5,
        py: 1,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
          {parameter.parameter_name}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }} noWrap>
          Module: {parameter.module_label || parameter.module}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }} noWrap>
          Measure: {parameter.measure_label}
        </Typography>
        {parameter.comparison_based_on_label && (
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }} noWrap>
            Based On: {parameter.comparison_based_on_label}
          </Typography>
        )}
      </Box>
      <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
        <IconButton size="small" onClick={onEdit} aria-label="Edit parameter">
          <i className="ri-pencil-line text-base" />
        </IconButton>
        <IconButton size="small" onClick={onDelete} aria-label="Delete parameter">
          <i className="ri-delete-bin-line text-base" />
        </IconButton>
      </Box>
    </Box>
  )
}

export const ParameterCard = memo(ParameterCardInner)
