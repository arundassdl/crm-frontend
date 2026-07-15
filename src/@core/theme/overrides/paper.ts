// MUI Imports
import type { Theme } from '@mui/material/styles'

const paper: Theme['components'] = {
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundImage: 'none',
        backgroundColor: '#ebf3fe',
      }
    }
  }
}

export default paper
