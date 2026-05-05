// MUI Imports
import type { Theme } from '@mui/material/styles'

// Type Imports
import type { Skin } from '@core/types'
import { styled } from '@mui/material/styles';
import FullCalendar from '@fullcalendar/react';

const StyledFullCalendar = styled(FullCalendar)(({ theme }) => ({
  "& td.fc-day .fc-day-mon .fc-day-past .fc-daygrid-day":{
      "&:hover, &:active": {
         color: "#000",
      },
    },
    "& .fc .fc-col-header-cell-cushion":{
      color: "#000",
    },
    "& .fc-daygrid-event": {
      backgroundColor: "#1976d2 !important",
      color: "white",
      borderRadius: "4px",
      padding: "2px 6px",
      fontSize: "13px",
    },
    "& .fc-toolbar-title": {
      fontWeight: 600,
      color: "#333",
    },
    "& .fc-button": {
      backgroundColor: "#1976d2 !important",
      color: "white",
      border: "none",
      borderRadius: "4px",
      padding: "4px 10px",
      "&:hover, &:active": {
        backgroundColor: "#115293 !important",
      },
    },
  
}));

export default StyledFullCalendar
