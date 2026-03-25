// MUI Imports
import type { Theme } from '@mui/material/styles'

const scroll: Theme['components'] = {  
  MuiCssBaseline: {
    styleOverrides: `
     ::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        ::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
    `,
  },

}

export default scroll
