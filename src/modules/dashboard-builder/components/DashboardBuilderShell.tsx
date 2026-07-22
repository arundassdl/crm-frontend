'use client'

import { memo, type ReactNode } from 'react'
import {
  Box,
  Button,
  IconButton,
  Stack,
  TextField,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

type DashboardBuilderShellProps = {
  layoutName: string
  isClone?: boolean
  isNew?: boolean
  hasChanges?: boolean
  saving?: boolean
  onLayoutNameChange: (value: string) => void
  onCancel: () => void
  onSave: () => void
  onSaveAndClose: () => void
  children: ReactNode
}

/** Toolbar + body shell aligned with `LayoutCanvas` (layout-create / layout-edit). */
function DashboardBuilderShellInner({
  layoutName,
  isClone,
  isNew,
  hasChanges = true,
  saving,
  onLayoutNameChange,
  onCancel,
  onSave,
  onSaveAndClose,
  children,
}: DashboardBuilderShellProps) {
  const showNameInput = isClone || isNew
  const nameValue = layoutName

  return (
    <Box
      sx={{
        px: 3,
        py: 2,
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        overflow: 'hidden',
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          minHeight: 64,
          px: 2,
          py: 1,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ flex: 1, mr: 3 }}>
          <IconButton aria-label="Back" onClick={onCancel} size="small" sx={{ mt: 0.5 }}>
            <ArrowBackIcon />
          </IconButton>
          <Stack direction="column" spacing={2} sx={{ flex: 1 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                value="Home Page"
                size="small"
                InputProps={{
                  readOnly: true,
                  sx: {
                    fontSize: '0.8rem',
                    lineHeight: 1.3,
                    '& input': { paddingY: 0.5 },
                  },
                }}
                sx={{
                  width: '12ch',
                  '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { border: 'none' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: 'none' },
                }}
              />
              <Box sx={{ height: 32, borderLeft: '1px solid', borderColor: 'divider' }} />
              {showNameInput ? (
                <TextField
                  value={nameValue}
                  size="small"
                  placeholder="Dashboard Name"
                  onChange={e => onLayoutNameChange(e.target.value)}
                  required
                  error={!nameValue.trim()}
                  helperText={!nameValue.trim() ? 'Dashboard Name is required' : ''}
                  InputProps={{
                    sx: {
                      fontSize: '0.8rem',
                      lineHeight: 1.3,
                      '& input': { paddingY: 0.5 },
                    },
                  }}
                  sx={{
                    width: `${Math.max(nameValue.length + 4, 12)}ch`,
                  }}
                />
              ) : (
                <TextField
                  value={nameValue}
                  size="small"
                  onChange={e => onLayoutNameChange(e.target.value)}
                  InputProps={{
                    sx: {
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      lineHeight: 1.4,
                      '& input': { paddingY: 0.5 },
                    },
                  }}
                  sx={{
                    width: `${Math.max(nameValue.length + 4, 12)}ch`,
                    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      border: '1px solid',
                      borderColor: 'divider',
                    },
                  }}
                />
              )}
            </Stack>
          </Stack>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            size="small"
            onClick={onCancel}
            sx={{
              borderRadius: '8px',
              fontSize: '0.9rem',
              py: 0.7,
              px: 1.75,
              textTransform: 'none',
              fontWeight: 600,
              color: theme => (theme.palette.mode === 'dark' ? '#9CA3AF' : '#64748B'),
              borderColor: theme => (theme.palette.mode === 'dark' ? '#3F3F46' : '#E3ECFC'),
              bgcolor: 'transparent',
              '&:hover': {
                bgcolor: theme => (theme.palette.mode === 'dark' ? '#18181B' : '#F8FAFC'),
                borderColor: theme => (theme.palette.mode === 'dark' ? '#3F3F46' : '#E3ECFC'),
              },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={onSaveAndClose}
            disabled={!hasChanges || saving}
            sx={{
              borderRadius: '8px',
              fontSize: '0.9rem',
              py: 0.7,
              px: 1.75,
              textTransform: 'none',
              fontWeight: 600,
              color: theme => (theme.palette.mode === 'dark' ? '#9CA3AF' : '#64748B'),
              borderColor: theme => (theme.palette.mode === 'dark' ? '#3F3F46' : '#E3ECFC'),
              bgcolor: 'transparent',
              '&:hover': {
                bgcolor: theme => (theme.palette.mode === 'dark' ? '#18181B' : '#F8FAFC'),
                borderColor: theme => (theme.palette.mode === 'dark' ? '#3F3F46' : '#E3ECFC'),
              },
            }}
          >
            Save and Close
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={onSave}
            disabled={!hasChanges || saving}
            sx={{
              borderRadius: '8px',
              fontSize: '0.9rem',
              py: 0.7,
              px: 2.5,
              textTransform: 'none',
              fontWeight: 700,
              bgcolor: '#1D4ED8',
              color: '#fff',
              boxShadow: 'none',
              '&:hover': { bgcolor: '#60A5FA', boxShadow: 'none' },
            }}
          >
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </Stack>
      </Stack>

      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden', pt: 2, minHeight: 0 }}>{children}</Box>
    </Box>
  )
}

export const DashboardBuilderShell = memo(DashboardBuilderShellInner)
