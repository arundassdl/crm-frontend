import { GridColDef } from "@mui/x-data-grid";
import CustomAvatar from "@/@core/components/mui/Avatar";
import { CONSTANTS } from "@/services/config/app-config";
import { Box, Chip, MenuItem, Select, Switch, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import Link from "@/components/Link";
import { GridRenderEditCellParams } from "@mui/x-data-grid";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import moment from 'moment';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import DonutLargeIcon from '@mui/icons-material/DonutLarge'; //Backlog
import { HourglassBottom, CheckCircle, Cancel } from '@mui/icons-material';
import CircleIcon from '@mui/icons-material/Circle';
import { getAvatarColor as avatarColor } from "@/@core/utils/avatarColor";

// avatarColor is imported at the top from the shared theme-aligned palette.
const initials = (n: string) => {
  const p = n.trim().split(/\s+/);
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : n.substring(0, 2).toUpperCase();
};


const handleEditCellChange = (id: number, value: string) => {
  console.log("valuevalue", value);


};
const options = [
  { value: "1", label: "Yes" },
  { value: "0", label: "No" },
];
const statusOptions = [
  { value: "1", label: "Active" },
  { value: "0", label: "Inactive" },
];

const valueOptions = options.map((opt) => opt.value); // ["1", "0"]

const priorityOptions = [
  { value: 'Low', label: 'Low', icon: <CircleIcon fontSize="small" sx={{ color: 'gray' }} /> },
  { value: 'Medium', label: 'Medium', icon: <CircleIcon fontSize="small" sx={{ color: 'orange' }} /> },
  { value: 'High', label: 'High', icon: <CircleIcon fontSize="small" sx={{ color: 'red' }} /> },
];
const taskStatusOptions = [
  { value: 'Backlog', label: 'Backlog', index: 0, icon: <DonutLargeIcon fontSize="small" /> },
  { value: 'Todo', label: 'Todo', index: 1, icon: <RadioButtonUncheckedIcon fontSize="small" sx={{ color: 'orange' }} /> },
  { value: 'In Progress', label: 'In Progress', index: 2, icon: <HourglassBottom fontSize="small" sx={{ color: '#f6c4bc' }} /> },
  { value: 'Done', label: 'Done', index: 3, icon: <CheckCircle fontSize="small" sx={{ color: 'green' }} /> },
  { value: 'Canceled', label: 'Canceled', index: 4, icon: <Cancel fontSize="small" sx={{ color: 'red' }} /> },
];

export const columnsConfig: Record<string, Record<string, Partial<GridColDef>>> = {
  tasks: {
    title: {
      flex: 1,
      minWidth: 150,
      type: "string",
      renderCell: (params) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            "&:hover": {
              color: "primary.main", // Change to primary color on hover
            },
          }}
          className="gap-2"
        >
          <Link
            href={`/tasks/detail/${params.row.name}`}
            color="inherit"
            rel="noopener noreferrer"
          >
            {params.row.title}
          </Link>
        </Box>
      ),
    },
    status: {
      flex: 1,
      minWidth: 200,
      // type: "string",
      type: "singleSelect",
      valueOptions: taskStatusOptions,
      renderCell: (params) => {

        if (params?.row?.status === "Backlog") {
          return <Chip
            icon={<DonutLargeIcon fontSize="small" />}
            label={params?.row?.status}
            // sx={{ borderColor: '#525252 !important' }}
            variant="tonal"
          />
        } else if (params?.row?.status === "Todo") {
          return <Chip
            icon={<RadioButtonUncheckedIcon sx={{ color: 'orange !important' }} />}
            label={params?.row?.status}
            sx={{ borderColor: 'rgb(212 90 8 / var(--tw-text-opacity, 1))!important' }}
            variant="tonal"
          />
        } else if (params?.row?.status === "In Progress") {
          return <Chip
            icon={<HourglassBottom sx={{ color: '#f6c4bc !important' }} />}
            label={params?.row?.status}
            sx={{ borderColor: '#f6c4bc !important' }}
            variant="tonal"
          />
        } else if (params?.row?.status === "Done") {
          return <Chip
            icon={<CheckCircle sx={{ color: 'green!important' }} />}
            label={params?.row?.status}
            sx={{ borderColor: 'green!important' }}
            variant="tonal"
          />
        } else if (params?.row?.status === "Canceled") {
          return <Chip
            icon={<Cancel sx={{ color: 'red !important' }} />}
            label={params?.row?.status}
            sx={{ borderColor: 'red !important' }}
            variant="tonal"
          />
        }
      },
    },
    priority: {
      flex: 1,
      minWidth: 150,
      // type: "string",
      type: "singleSelect",
      valueOptions: priorityOptions,
      // valueGetter: (params, row) => {        
      //   return row.priority
      // },
      renderCell: (params) => {

        if (params?.row?.priority === "Low") {
          return <Chip
            icon={<CircleIcon fontSize="small" />}
            label={params?.row?.priority}
            // sx={{ borderColor: '#525252 !important' }}
            variant="outlined"
          />
        } else if (params?.row?.priority === "Medium") {
          return <Chip
            icon={<CircleIcon sx={{ color: 'orange !important' }} />}
            label={params?.row?.priority}
            // sx={{ borderColor: 'orange !important' }}
            variant="outlined"
          />
        } else if (params?.row?.priority === "High") {
          return <Chip
            icon={<CircleIcon sx={{ color: 'red !important' }} />}
            label={params?.row?.priority}
            // sx={{ borderColor: 'red !important' }}
            variant="outlined"
          />
        }
      },
    },
    due_date: {
      flex: 1,
      minWidth: 200,
      type: "dateTime",
      valueGetter: (params, row) => {
        console.log("row.due_date", row.due_date);

        if (row.due_date != "" && row.due_date != null) {
          return new Date(row.due_date)
        } else {
          return ""
        }
      },
    },
    owner: {
      flex: 1,
      minWidth: 150,
      type: "string",
      valueGetter: (params, row) => {
        return row.owner
      },
    },
    assigned_to: {
      flex: 1,
      minWidth: 150,
      type: "string",
      valueGetter: (params, row) => {
        return row.assigned_to
      },
    },
    creation: {
      flex: 1,
      minWidth: 180,
      type: "dateTime",
      valueGetter: (_params: any, row: any) => {
        const val = row?.creation || row?.["tabCRM Task.creation"] || row?.["CRM Task.creation"];
        return val ? new Date(val) : null;
      },
      // MUI X v7: valueFormatter is (value, row, column, apiRef) — not (params) => params.value
      valueFormatter: (value: unknown) => {
        const v = value as Date | null;
        if (!v || !(v instanceof Date) || Number.isNaN(v.getTime())) return "";
        const day = String(v.getDate()).padStart(2, "0");
        const month = String(v.getMonth() + 1).padStart(2, "0");
        const year = v.getFullYear();
        let hours = v.getHours();
        const minutes = String(v.getMinutes()).padStart(2, "0");
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12;
        if (hours === 0) hours = 12;
        const hh = String(hours).padStart(2, "0");
        return `${day}/${month}/${year} ${hh}:${minutes} ${ampm}`;
      },
    },
    modified: {
      flex: 1,
      minWidth: 180,
      type: "dateTime",
      valueGetter: (_params: any, row: any) => {
        const val = row?.modified || row?.["tabCRM Task.modified"] || row?.["CRM Task.modified"];
        return val ? new Date(val) : null;
      },
      valueFormatter: (value: unknown) => {
        const v = value as Date | null;
        if (!v || !(v instanceof Date) || Number.isNaN(v.getTime())) return "";
        const day = String(v.getDate()).padStart(2, "0");
        const month = String(v.getMonth() + 1).padStart(2, "0");
        const year = v.getFullYear();
        let hours = v.getHours();
        const minutes = String(v.getMinutes()).padStart(2, "0");
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12;
        if (hours === 0) hours = 12;
        const hh = String(hours).padStart(2, "0");
        return `${day}/${month}/${year} ${hh}:${minutes} ${ampm}`;
      },
    },
  },
  deals: {
    organization: {
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            "&:hover": {
              color: "primary.main", // Change to primary color on hover
            },
          }}
          className="gap-2"
        >
          {/* <CustomAvatar
            alt={params?.row?.organization}
            // src={`${CONSTANTS.API_BASE_URL}${params?.row?.image}`}
            size={35}
            className="shadow-xs"
          /> */}
          <Link
            href={`/deals/detail/${params.row.name}`}
            color="inherit"
            rel="noopener noreferrer"
          >
            {params.row.organization}
          </Link>
        </Box>
      ),
    },
    territory: {
      flex: 1,
      minWidth: 100,
      type: "string",
      valueGetter: (params, row) => {
        console.log("params?.row", row);

        return row.territory
      },
    },
    email: {
      flex: 1,
      minWidth: 150,
      type: "string",
      valueGetter: (params, row) => {
        return row.email
      },
    },
    mobile_no: {
      flex: 1,
      minWidth: 150,
      type: "string",
      valueGetter: (params, row) => {
        return row.mobile_no
      },
    },


    status: {
      flex: 1,
      minWidth: 200,
      type: "string",
      // valueGetter: (params, row) => row.status,
      //  valueGetter: (params,row) =>
      //   row?.status,
      renderCell: (params) => {
        if (params?.row?.status === "Qualification") {
          return <Chip
            icon={<RadioButtonUncheckedIcon />}
            label={params?.row?.status}
            // sx={{ borderColor: '#525252 !important' }}
            variant="outlined"
          />
        } else if (params?.row?.status === "Demo/Making") {
          return <Chip
            icon={<RadioButtonUncheckedIcon sx={{ color: 'rgb(212 90 8 / var(--tw-text-opacity, 1))!important' }} />}
            label={params?.row?.status}
            // sx={{ borderColor: 'rgb(212 90 8 / var(--tw-text-opacity, 1))!important' }}
            variant="outlined"
          />
        } else if (params?.row?.status === "Proposal/Quotation") {
          return <Chip
            icon={<RadioButtonUncheckedIcon sx={{ color: 'rgb(0 123 224 / var(--tw-text-opacity, 1))!important' }} />}
            label={params?.row?.status}
            // sx={{ borderColor: 'rgb(0 123 224 / var(--tw-text-opacity, 1))!important' }}
            variant="outlined"
          />
        } else if (params?.row?.status === "Negotiation") {
          return <Chip
            icon={<RadioButtonUncheckedIcon sx={{ color: 'rgb(209 147 13 / var(--tw-text-opacity, 1))!important' }} />}
            label={params?.row?.status}
            // sx={{ borderColor: 'rgb(209 147 13 / var(--tw-text-opacity, 1))!important' }}
            variant="outlined"
          />
        } else if (params?.row?.status === "Ready to Close") {
          return <Chip
            icon={<RadioButtonUncheckedIcon sx={{ color: 'rgb(134 66 194 / var(--tw-text-opacity, 1))!important' }} />}
            label={params?.row?.status}
            // sx={{ borderColor: 'rgb(134 66 194 / var(--tw-text-opacity, 1))!important' }}
            variant="outlined"
          />
        } else if (params?.row?.status === "Won") {
          return <Chip
            icon={<RadioButtonUncheckedIcon sx={{ color: 'rgb(19 121 73 / var(--tw-text-opacity, 1))!important' }} />}
            label={params?.row?.status}
            // sx={{ borderColor: 'rgb(19 121 73 / var(--tw-text-opacity, 1))!important' }}
            variant="outlined"
          />
        } else if (params?.row?.status === "Lost") {
          return <Chip
            icon={<RadioButtonUncheckedIcon sx={{ color: 'rgb(204 41 41 / var(--tw-text-opacity, 1))!important' }} />}
            label={params?.row?.status}
            // sx={{ borderColor: 'rgb(204 41 41 / var(--tw-text-opacity, 1))!important' }}
            variant="outlined"
          />
        }
      },
    },
    close_date: {
      flex: 1,
      minWidth: 150,
      type: "date",
      valueGetter: (params, row) => new Date(row.close_date),
    },
    creation: {
      flex: 1,
      minWidth: 180,
      type: "dateTime",
      valueGetter: (_params: any, row: any) => {
        const val =
          row?.creation ||
          row?.["tabCRM Deal.creation"] ||
          row?.["CRM Deal.creation"];
        return val ? new Date(val) : null;
      },
      valueFormatter: (value: unknown) => {
        const v = value as Date | null;
        if (!v || !(v instanceof Date) || Number.isNaN(v.getTime())) return "";
        const day = String(v.getDate()).padStart(2, "0");
        const month = String(v.getMonth() + 1).padStart(2, "0");
        const year = v.getFullYear();
        let hours = v.getHours();
        const minutes = String(v.getMinutes()).padStart(2, "0");
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12;
        if (hours === 0) hours = 12;
        const hh = String(hours).padStart(2, "0");
        return `${day}/${month}/${year} ${hh}:${minutes} ${ampm}`;
      },
    },
    modified: {
      flex: 1,
      minWidth: 180,
      type: "dateTime",
      valueGetter: (_params: any, row: any) => {
        const val =
          row?.modified ||
          row?.["tabCRM Deal.modified"] ||
          row?.["CRM Deal.modified"];
        return val ? new Date(val) : null;
      },
      valueFormatter: (value: unknown) => {
        const v = value as Date | null;
        if (!v || !(v instanceof Date) || Number.isNaN(v.getTime())) return "";
        const day = String(v.getDate()).padStart(2, "0");
        const month = String(v.getMonth() + 1).padStart(2, "0");
        const year = v.getFullYear();
        let hours = v.getHours();
        const minutes = String(v.getMinutes()).padStart(2, "0");
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12;
        if (hours === 0) hours = 12;
        const hh = String(hours).padStart(2, "0");
      },
    },
  },
  leads: {
    name: {
      flex: 1,
      minWidth: 200,
      renderCell: (params) => {
        const theme = useTheme();
        const isDark = theme.palette.mode === "dark";
        const val = params.row.name;
        if (!val) return <span className={isDark ? "text-[#52525B]" : "text-slate-300"}>—</span>;
        return (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2.5,
              "&:hover": {
                color: "primary.main",
              },
            }}
          >
            <div
              style={{ backgroundColor: avatarColor(String(val)) }}
              className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-extrabold text-white flex-shrink-0"
            >
              {initials(String(val))}
            </div>
            <Link
              href={`/leads/detail/${params.row.name}`}
              color="inherit"
              rel="noopener noreferrer"
              style={{ fontSize: "15px", lineHeight: "20px", fontWeight: 500 }}
            >
              {val}
            </Link>
          </Box>
        );
      },
    },
    lead_name: {
      flex: 1,
      minWidth: 200,
      renderCell: (params) => {
        const theme = useTheme();
        const isDark = theme.palette.mode === "dark";
        const val = params.row.lead_name;
        if (!val) return <span className={isDark ? "text-[#52525B]" : "text-slate-300"}>—</span>;
        return (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2.5,
              "&:hover": {
                color: "primary.main",
              },
            }}
          >
            <div
              style={{ backgroundColor: avatarColor(String(val)) }}
              className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-extrabold text-white flex-shrink-0"
            >
              {initials(String(val))}
            </div>
            <Link
              href={`/leads/detail/${params.row.name}`}
              color="inherit"
              rel="noopener noreferrer"
              style={{ fontSize: "15px", lineHeight: "20px", fontWeight: 500 }}
            >
              {val}
            </Link>
          </Box>
        );
      },
    },

    account: {
      flex: 1,
      minWidth: 150,
      type: "string",
      valueGetter: (params, row) => row.organization,
    },
    website: {
      flex: 1,
      minWidth: 150,
      type: "string",
      valueGetter: (params, row) => row.website,
    },

    territory: {
      flex: 1,
      minWidth: 150,
      type: "string",
      valueGetter: (params, row) => row.territory,
    },
    industry: {
      flex: 1,
      minWidth: 150,
      type: "string",
      valueGetter: (params, row) => row.industry,
    },

    job_title: {
      flex: 1,
      minWidth: 150,
      type: "string",
      valueGetter: (params, row) => row.job_title,
    },
    email: {
      flex: 1,
      minWidth: 150,
      type: "string",
      valueGetter: (params, row) => row.email,
    },
    mobile_no: {
      flex: 1,
      minWidth: 150,
      type: "string",
      valueGetter: (params, row) => row.mobile_no,
    },
    // No `renderCell` here on purpose: the status badge is rendered by the grid
    // itself (RawDynamicDataGrid -> StatusBadge) so it can use the labels and
    // colours configured on the module's status pick list. A renderCell defined
    // here would shadow that and re-introduce hardcoded statuses.
    status: {
      flex: 1,
      minWidth: 150,
      type: "string",
    },

    creation: {
      flex: 1,
      minWidth: 180,
      type: "dateTime",
      valueGetter: (_params: any, row: any) => {
        const val =
          row?.creation ||
          row?.["tabCRM Lead.creation"] ||
          row?.["CRM Lead.creation"];
        return val ? new Date(val) : null;
      },
      valueFormatter: (value: unknown) => {
        const v = value as Date | null;
        if (!v || !(v instanceof Date) || Number.isNaN(v.getTime())) return "";
        const day = String(v.getDate()).padStart(2, "0");
        const month = String(v.getMonth() + 1).padStart(2, "0");
        const year = v.getFullYear();
        let hours = v.getHours();
        const minutes = String(v.getMinutes()).padStart(2, "0");
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12;
        if (hours === 0) hours = 12;
        const hh = String(hours).padStart(2, "0");
        return `${day}/${month}/${year} ${hh}:${minutes} ${ampm}`;
      },
    },
    modified: {
      flex: 1,
      minWidth: 180,
      type: "dateTime",
      valueGetter: (_params: any, row: any) => {
        const val =
          row?.modified ||
          row?.["tabCRM Lead.modified"] ||
          row?.["CRM Lead.modified"];
        return val ? new Date(val) : null;
      },
      valueFormatter: (value: unknown) => {
        const v = value as Date | null;
        if (!v || !(v instanceof Date) || Number.isNaN(v.getTime())) return "";
        const day = String(v.getDate()).padStart(2, "0");
        const month = String(v.getMonth() + 1).padStart(2, "0");
        const year = v.getFullYear();
        let hours = v.getHours();
        const minutes = String(v.getMinutes()).padStart(2, "0");
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12;
        if (hours === 0) hours = 12;
        const hh = String(hours).padStart(2, "0");
        return `${day}/${month}/${year} ${hh}:${minutes} ${ampm}`;
      },
    },
  },
  customers: {
    organization_name: {
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            "&:hover": {
              color: "primary.main", // Change to primary color on hover
            },
          }}
          className="gap-2"
        >
          <CustomAvatar
            alt={params?.row?.name}
            src={`${CONSTANTS.API_BASE_URL}${params?.row?.image}`}
            size={35}
            className="shadow-xs"
          />
          <Link
            href={`/accounts/detail/${params.row.name}`}
            color="inherit"
            rel="noopener noreferrer"
          >
            {params.row.organization_name}
          </Link>
        </Box>
      ),
    },
    website: {
      flex: 1,
      minWidth: 175,
      type: "string",
      valueGetter: (params, row) => {
        return (
          row?.website
        );
      },
    },
    territory: {
      flex: 1,
      minWidth: 175,
      type: "string",
      valueGetter: (params, row) => {
        return (
          row?.territory
        );
      },
    },
    no_of_employees: {
      flex: 1,
      minWidth: 175,
      type: "string",
      valueGetter: (params, row) => {
        return (
          row?.no_of_employees
        );
      },
    },
    email_id: {
      flex: 1,
      minWidth: 175,
      type: "string",
      valueGetter: (params, row) => {
        return (
          row?.customer_email_id || row?.email_id || row?.primary_contact_email
        );
      },
    },
    phone: {
      flex: 1,
      minWidth: 120,
      type: "string",
      valueGetter: (params, row) => {
        return row?.customer_type == "Individual"
          ? row?.primary_contact_phone || row?.mobile_no || row?.phone
          : row?.customer_phone ||
          row?.mobile_no ||
          row?.phone ||
          row?.primary_contact_phone;
      },
    },
    customer_type: {
      headerName: "Type",
      flex: 1,
      minWidth: 175,
      type: "string",
      valueGetter: (params, row) => {
        return row?.customer_type;
      },
    },
    customer_group: {
      headerName: "Group",
      flex: 1,
      minWidth: 120,
      type: "string",
      valueGetter: (params, row) => {
        return row?.customer_group;
      },
    },
    // contact_name: {
    //   width: 150,
    //   type: "string",
    //   valueGetter: (params,row) => {
    //     console.log("params===>s",row);

    //     return row?.contact?.full_name
    //   },
    // },
    creation: {
      flex: 1,
      minWidth: 180,
      type: "dateTime",
      valueGetter: (_params: any, row: any) => {
        const val =
          row?.creation ||
          row?.["tabCRM Organization.creation"] ||
          row?.["CRM Organization.creation"];
        return val ? new Date(val) : null;
      },
      valueFormatter: (value: unknown) => {
        const v = value as Date | null;
        if (!v || !(v instanceof Date) || Number.isNaN(v.getTime())) return "";
        const day = String(v.getDate()).padStart(2, "0");
        const month = String(v.getMonth() + 1).padStart(2, "0");
        const year = v.getFullYear();
        let hours = v.getHours();
        const minutes = String(v.getMinutes()).padStart(2, "0");
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12;
        if (hours === 0) hours = 12;
        const hh = String(hours).padStart(2, "0");
        return `${day}/${month}/${year} ${hh}:${minutes} ${ampm}`;
      },
    },
    modified: {
      flex: 1,
      minWidth: 180,
      type: "dateTime",
      valueGetter: (_params: any, row: any) => {
        const val =
          row?.modified ||
          row?.["tabCRM Organization.modified"] ||
          row?.["CRM Organization.modified"];
        return val ? new Date(val) : null;
      },
      valueFormatter: (value: unknown) => {
        const v = value as Date | null;
        if (!v || !(v instanceof Date) || Number.isNaN(v.getTime())) return "";
        const day = String(v.getDate()).padStart(2, "0");
        const month = String(v.getMonth() + 1).padStart(2, "0");
        const year = v.getFullYear();
        let hours = v.getHours();
        const minutes = String(v.getMinutes()).padStart(2, "0");
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12;
        if (hours === 0) hours = 12;
        const hh = String(hours).padStart(2, "0");
        return `${day}/${month}/${year} ${hh}:${minutes} ${ampm}`;
      },
    },
  },

  contacts: {
    full_name: {
      flex: 1,
      minWidth: 250,
      renderCell: (params) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            "&:hover": {
              color: "primary.main", // Change to primary color on hover
            },
          }}
          className="gap-2"
        >
          <CustomAvatar
            alt={params?.row?.full_name}
            src={`${CONSTANTS.API_BASE_URL}${params?.row?.image}`}
            size={35}
            className="shadow-xs"
          />
          <Link
            href={`/contacts/detail/${params.row.name}`}
            color="inherit"
            rel="noopener noreferrer"
          >
            {params.row.full_name}
          </Link>
        </Box>
      ),
    },
    email_id: {
      flex: 1,
      minWidth: 175,
      type: "string",
      valueGetter: (params, row) => {
        return row?.email_id;
      },
    },
    phone: {
      flex: 1,
      minWidth: 120,
      type: "string",
      valueGetter: (params, row) => {
        return row?.phone;
      },
    },
    mobile_no: {
      flex: 1,
      minWidth: 120,
      type: "string",
      valueGetter: (params, row) => {
        return row?.mobile_no;
      },
    },
    creation: {
      flex: 1,
      minWidth: 180,
      type: "dateTime",
      valueGetter: (_params: any, row: any) => {
        const val =
          row?.creation ||
          row?.["tabContact.creation"] ||
          row?.["Contact.creation"];
        return val ? new Date(val) : null;
      },
      valueFormatter: (value: unknown) => {
        const v = value as Date | null;
        if (!v || !(v instanceof Date) || Number.isNaN(v.getTime())) return "";
        const day = String(v.getDate()).padStart(2, "0");
        const month = String(v.getMonth() + 1).padStart(2, "0");
        const year = v.getFullYear();
        let hours = v.getHours();
        const minutes = String(v.getMinutes()).padStart(2, "0");
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12;
        if (hours === 0) hours = 12;
        const hh = String(hours).padStart(2, "0");
        return `${day}/${month}/${year} ${hh}:${minutes} ${ampm}`;
      },
    },
    modified: {
      flex: 1,
      minWidth: 180,
      type: "dateTime",
      valueGetter: (_params: any, row: any) => {
        const val =
          row?.modified ||
          row?.["tabContact.modified"] ||
          row?.["Contact.modified"];
        return val ? new Date(val) : null;
      },
      valueFormatter: (value: unknown) => {
        const v = value as Date | null;
        if (!v || !(v instanceof Date) || Number.isNaN(v.getTime())) return "";
        const day = String(v.getDate()).padStart(2, "0");
        const month = String(v.getMonth() + 1).padStart(2, "0");
        const year = v.getFullYear();
        let hours = v.getHours();
        const minutes = String(v.getMinutes()).padStart(2, "0");
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12;
        if (hours === 0) hours = 12;
        const hh = String(hours).padStart(2, "0");
        return `${day}/${month}/${year} ${hh}:${minutes} ${ampm}`;
      },
    },
  },

  item_group: {
    item_group_name: {
      width: 250,
      renderCell: (params) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
          }}
          className="gap-2"
        >
          {params.row.item_group_name}
        </Box>
      ),
    },
    parent_item_group: {
      width: 175,
      type: "string",
      valueGetter: (params, row) => {
        return row?.parent_item_group;
      },
    },

    is_group: {
      headerName: "Is Group",
      width: 120,
      // editable: true, // Required for editing
      type: "singleSelect",

      valueOptions: options, // ["1", "0"]
      // Display "Yes" / "No" in the cell
      // valueGetter: (params,row) =>
      //   row?.is_group?"Yes":"No",
      // renderCell: (params) => {
      //   return params?.row?.is_group ? <Chip label="Yes" color="success" variant="outlined" /> : <Chip label="No" color="error" variant="outlined" /> ;
      // },
      renderCell: (params) => {
        return params?.row?.is_group ? (
          <CheckCircleIcon
            sx={{ color: "green", fontSize: 20 }}
            titleAccess="Yes"
          />
        ) : (
          <CancelIcon color="error" sx={{ fontSize: 20 }} titleAccess="No" />
        );
      },
      // Dropdown for editing
      // renderEditCell: (params) => (
      //   <Select
      //     value={String(params.value) || "0"}
      //     onChange={(event) =>
      //       handleEditCellChange(params.id as number, event.target.value)
      //     }
      //     fullWidth
      //     size="small"
      //   >
      //     {options.map((opt) => (
      //       <MenuItem key={opt.value} value={opt.value}>
      //         {opt.label}
      //       </MenuItem>
      //     ))}
      //   </Select>
      // ),
    },
    creation: {
      width: 150,
      type: "date",
      valueGetter: (params, row) => new Date(row.creation),
    },
    modified: {
      width: 150,
      type: "date",
      valueGetter: (params, row) => new Date(row.modified),
    },
  },
  items: {
    item_name: {
      width: 450,
      renderCell: (params) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            "&:hover": {
              color: "primary.main",
            },
          }}
        >
          <CustomAvatar
            alt={params?.row?.item_code}
            src={`${CONSTANTS.API_BASE_URL}${params?.row?.image}`}
            size={45}
            variant="square"
            className="shadow-xs"
          />

          <Box sx={{
            "&:hover": {
              color: "primary.main", // Change to primary color on hover
            },
          }} className="gap-2">
            <Typography fontWeight={600} fontSize="0.85rem">
              <Link
                href={`/catalog/products/detail/${params.row.item_code}`}
                color="inherit"
                rel="noopener noreferrer"
              >
                {params.row.item_code}
              </Link>

            </Typography>
            <Typography variant="body2" color="text.secondary">
              {params.row.item_name}, {params.row.description}
            </Typography>
          </Box>
        </Box>
      ),
    },
    // item_code: {
    //   width: 150,
    //   renderCell: (params) => (
    //     <Box
    //       sx={{
    //         display: 'flex',
    //         alignItems: 'center',
    //       }}
    //       className="gap-2"
    //     >
    //         {params.row.item_code}

    //     </Box>
    //   ),
    // },
    // item_name: {
    //   width: 200,
    //   renderCell: (params) => (
    //     <Box
    //       sx={{
    //         display: 'flex',
    //         alignItems: 'center',
    //       }}
    //       className="gap-2"
    //     >
    //         {params.row.item_name}

    //     </Box>
    //   ),
    // },
    item_group: {
      width: 175,
      type: "string",
      valueGetter: (params, row) => {
        return row?.item_group;
      },
    },
    stock_uom: {
      width: 175,
      type: "string",
      valueGetter: (params, row) => {
        return row?.stock_uom;
      },
    },
    has_variants: {
      width: 175,
      type: "string",
      renderCell: (params) => {
        return params?.row?.has_variants ? <Chip label="Yes" color="success" variant="outlined" /> : <Chip label="No" color="error" variant="outlined" />;
      },
    },
    disabled: {
      headerName: "Status",
      width: 120,
      type: "singleSelect",
      valueOptions: statusOptions, // ["1", "0"]
      // renderCell: (params) => {
      //   return params?.row?.disabled ? <Chip label="Inactive" color="error" variant="outlined" />  : <Chip label="Active" color="success" variant="outlined" /> ;
      // },
      renderCell: (params) => {
        return params?.row?.disabled ? (
          <CancelIcon
            sx={{ color: "red", fontSize: 20 }}
            titleAccess="Inactive"
          />
        ) : (
          <CheckCircleIcon
            sx={{ color: "green", fontSize: 20 }}
            titleAccess="Active"
          />
        );
      },
    },
    creation: {
      width: 150,
      type: "date",
      valueGetter: (params, row) => new Date(row.creation),
    },
    modified: {
      width: 150,
      type: "date",
      valueGetter: (params, row) => new Date(row.modified),
    },
  },
  roles: {
    role_name: {
      width: 250,
      renderCell: (params) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            "&:hover": {
              color: "primary.main", // Change to primary color on hover
            },
          }}
          className="gap-2"
        >
          <Link
            href={`/settings?tab=security&subtab=roles&detail=${encodeURIComponent(String(params.row.role_name ?? ''))}`}
            color="inherit"
            rel="noopener noreferrer"
          >
            {params.row.role_name}
          </Link>
        </Box>
      ),
    },
    role_description: {
      width: 250,
      type: "string",
      valueGetter: (params, row) => {
        return row?.role_description;
      },
    },
    disabled: {
      headerName: "Status",
      width: 120,
      type: "singleSelect",
      valueOptions: statusOptions, // ["1", "0"]
      // renderCell: (params) => {
      //   return params?.row?.disabled ? <Chip label="Inactive" color="error" variant="outlined" />  : <Chip label="Active" color="success" variant="outlined" /> ;
      // },
      renderCell: (params) => {
        return params?.row?.disabled ? (
          <CancelIcon
            sx={{ color: "red", fontSize: 20 }}
            titleAccess="Inactive"
          />
        ) : (
          <CheckCircleIcon
            sx={{ color: "green", fontSize: 20 }}
            titleAccess="Active"
          />
        );
      },
    },
    is_admin: {
      headerName: "Is Admin",
      width: 120,
      // editable: true, // Required for editing
      type: "singleSelect",

      valueOptions: options, // ["1", "0"]
      renderCell: (params) => {
        return params?.row?.is_admin ? (
          <CheckCircleIcon
            sx={{ color: "green", fontSize: 20 }}
            titleAccess="Yes"
          />
        ) : (
          <CancelIcon color="error" sx={{ fontSize: 20 }} titleAccess="No" />
        );
      },
    },
    creation: {
      width: 150,
      type: "date",
      valueGetter: (params, row) => new Date(row.creation),
    },
    modified: {
      width: 150,
      type: "date",
      valueGetter: (params, row) => new Date(row.modified),
    },
  },
  users: {
    username: {
      width: 200,
      renderCell: (params) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            "&:hover": {
              color: "primary.main", // Change to primary color on hover
            },
          }}
          className="gap-2"
        >
          <CustomAvatar
            alt={params?.row?.name}
            src={`${CONSTANTS.API_BASE_URL}${params?.row?.user_image}`}
            size={35}
            className="shadow-xs"
          />
          <Link
            href={`/settings?tab=general&subtab=users&detail=${encodeURIComponent(String(params.row.name ?? params.row.email ?? ''))}`}
            color="inherit"
            rel="noopener noreferrer"
          >
            {params.row.full_name}
          </Link>
        </Box>
      ),
    },
    role_name: {
      width: 250,
      renderCell: (params) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            "&:hover": {
              color: "primary.main", // Change to primary color on hover
            },
          }}
          className="gap-2"
        >
          <Link
            href={`/settings?tab=security&subtab=roles&detail=${encodeURIComponent(String(params.row.role_name ?? ''))}`}
            color="inherit"
            rel="noopener noreferrer"
          >
            {params.row.role_name}
          </Link>
        </Box>
      ),
    },
    email: {
      width: 250,
      type: "string",
      valueGetter: (params, row) => {
        return row?.email;
      },
    },
    enabled: {
      headerName: "Enable",
      width: 120,
      type: "singleSelect",
      valueOptions: statusOptions, // ["1", "0"]
      // renderCell: (params) => {
      //   return params?.row?.disabled ? <Chip label="Inactive" color="error" variant="outlined" />  : <Chip label="Active" color="success" variant="outlined" /> ;
      // },
      renderCell: (params) => {
        return params?.row?.enabled ? (
          <CheckCircleIcon
            sx={{ color: "green", fontSize: 20 }}
            titleAccess="Active"
          />
        ) : (
          <CancelIcon
            sx={{ color: "red", fontSize: 20 }}
            titleAccess="Inactive"
          />
        );
      },
    },
    mobile_no: {
      width: 150,
      type: "string",
      valueGetter: (params, row) => {
        return row.mobile_no
      },
    },
    creation: {
      width: 150,
      type: "date",
      valueGetter: (params, row) => new Date(row.creation),
    },
    modified: {
      width: 150,
      type: "date",
      valueGetter: (params, row) => new Date(row.modified),
    },
  },
  customersaddress: {
    address_line1: {
      width: 200,
      renderCell: (params) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            "&:hover": {
              color: "primary.main", // Change to primary color on hover
            },
          }}
          className="gap-2"
        >
          <CustomAvatar
            alt={params?.row?.name}
            src={`${CONSTANTS.API_BASE_URL}${params?.row?.image}`}
            size={35}
            className="shadow-xs"
          />
          {params.row.address_line1}
        </Box>
      ),
    },
    address_line2: {
      width: 175,
      type: "string",
      valueGetter: (params, row) => {
        return (
          row?.address_line2
        );
      },
    },
    city: {
      width: 175,
      type: "string",
      valueGetter: (params, row) => {
        return (
          row?.city
        );
      },
    },
    state: {
      width: 175,
      type: "string",
      valueGetter: (params, row) => {
        return (
          row?.state
        );
      },
    },
    country: {
      width: 175,
      type: "string",
      valueGetter: (params, row) => {
        return (
          row?.country
        );
      },
    },
    pincode: {
      width: 175,
      type: "string",
      valueGetter: (params, row) => {
        return (
          row?.pincode
        );
      },
    },
    territory: {
      width: 175,
      type: "string",
      valueGetter: (params, row) => {
        return (
          row?.territory
        );
      },
    },
    creation: {
      width: 150,
      type: "date",
      valueGetter: (params, row) => new Date(row.creation),
    },
    modified: {
      width: 150,
      type: "date",
      valueGetter: (params, row) => new Date(row.modified),
    },
  },
  territories: {
    territory_name: {
      width: 250,
      renderCell: (params) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            "&:hover": {
              color: "primary.main",
            },
          }}
          className="gap-2"
        >
          <Link
            href={`/setup/territories/detail/${params.row.module}`}
            color="inherit"
            rel="noopener noreferrer"
          >
            {params.row.territory_name}
          </Link>
        </Box>
      ),
    },
    parent_territory: {
      width: 200,
      type: "string",
      valueGetter: (params, row) => row.parent_territory,
    },
    territory_manager: {
      width: 200,
      type: "string",
      valueGetter: (params, row) => row.territory_manager,
    },
    creation: {
      width: 200,
      type: "dateTime",
      // MUI calls valueGetter as (value, row), so use row arg
      valueGetter: (_value: any, row: any) => new Date(row.creation),
    },
    modified: {
      width: 200,
      type: "dateTime",
      valueGetter: (_value: any, row: any) => new Date(row.modified),
    },
  },
  layouts: {
    layout_name: {
      width: 250,
      renderCell: (params) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            "&:hover": {
              color: "primary.main",
            },
          }}
          className="gap-2"
        >
          <Link
            href={`/setup/customization/modules/${params.row.module || params.row["SDL Layout.module"]}/layouts/edit/${params.row.name}`}
            color="inherit"
            rel="noopener noreferrer"
          >
            {params.row.layout_name}
          </Link>
        </Box>
      ),
    },
    frontend_module: {
      width: 200,
      type: "string",
      valueGetter: (params, row) => row.frontend_module,
    },
    shared_to_text: {
      width: 300,
      type: "string",
      valueGetter: (params, row) => row.shared_to_text,
    },
    is_default: {
      headerName: "Is Default",
      width: 120,
      type: "singleSelect",
      valueOptions: options,
      renderCell: (params) => {
        return params?.row?.is_default ? (
          <CheckCircleIcon
            sx={{ color: "green", fontSize: 20 }}
            titleAccess="Yes"
          />
        ) : (
          <CancelIcon color="error" sx={{ fontSize: 20 }} titleAccess="No" />
        );
      },
    },
    creation: {
      width: 150,
      type: "date",
      valueGetter: (params, row) => new Date(row.creation),
    },
    modified: {
      width: 150,
      type: "date",
      valueGetter: (params, row) => new Date(row.modified),
    },
  },
  module_map: {
    name: {
      width: 300,
      renderCell: (params) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            "&:hover": {
              color: "primary.main", // Change to primary color on hover
            },
          }}
          className="gap-2"
        >
          {/* <CustomAvatar
            alt={params?.row?.name}
            src={`${CONSTANTS.API_BASE_URL}${params?.row?.image}`}
            size={35}
            className="shadow-xs"
          /> */}
          <Link
            href={`/setup/customization/modules/${params.row.name}`}
            color="inherit"
            rel="noopener noreferrer"
          >
            {params.row.name}
          </Link>
        </Box>
      ),

    },
    frontend_module: {
      width: 300,
      renderCell: (params) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            "&:hover": {
              color: "primary.main", // Change to primary color on hover
            },
          }}
          className="gap-2"
        >
          {/* <CustomAvatar
            alt={params?.row?.name}
            src={`${CONSTANTS.API_BASE_URL}${params?.row?.image}`}
            size={35}
            className="shadow-xs"
          /> */}
          <Link
            href={`/setup/customization/modules/${params.row.name}`}
            color="inherit"
            rel="noopener noreferrer"
          >
            {params.row.frontend_module}
          </Link>
        </Box>
      ),

    },
    status: {
      headerName: "Status",
      width: 100,
      type: "singleSelect",
      valueOptions: statusOptions,
      renderCell: (params) => {
        return params?.row?.status ? (
          <Chip
            icon={<RadioButtonUncheckedIcon />}
            label={params?.row?.status}
          />
        ) : null;
      },
    },
    modified: {
      width: 150,
      type: "date",
      valueGetter: (params, row) => new Date(row.modified),
    },
  },
};
