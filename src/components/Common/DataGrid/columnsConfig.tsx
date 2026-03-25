import { GridColDef } from "@mui/x-data-grid";
import CustomAvatar from "@/@core/components/mui/Avatar";
import { CONSTANTS } from "@/services/config/app-config";
import { Box, Chip, MenuItem, Select, Switch, Typography } from "@mui/material";
import Link from "@/components/Link";
import { GridRenderEditCellParams } from "@mui/x-data-grid";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import moment from 'moment';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import DonutLargeIcon from '@mui/icons-material/DonutLarge'; //Backlog
import { HourglassBottom, CheckCircle, Cancel } from '@mui/icons-material';
import CircleIcon from '@mui/icons-material/Circle';

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
      width: 150,
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
      width: 200,
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
      width: 150,
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
      width: 200,
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
      width: 150,
      type: "string",
      valueGetter: (params, row) => {
        return row.owner
      },
    },
    assigned_to: {
      width: 150,
      type: "string",
      valueGetter: (params, row) => {
        return row.assigned_to
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
  deals: {
    organization: {
      width: 150,
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
      width: 100,
      type: "string",
      valueGetter: (params, row) => {
        console.log("params?.row", row);

        return row.territory
      },
    },
    email: {
      width: 150,
      type: "string",
      valueGetter: (params, row) => {
        return row.email
      },
    },
    mobile_no: {
      width: 150,
      type: "string",
      valueGetter: (params, row) => {
        return row.mobile_no
      },
    },


    status: {
      width: 200,
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
      width: 150,
      type: "date",
      valueGetter: (params, row) => new Date(row.close_date),
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
  leads: {
    name: {
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
          {/* <CustomAvatar
            alt={params?.row?.name}
            src={`${CONSTANTS.API_BASE_URL}${params?.row?.image}`}
            size={35}
            className="shadow-xs"
          /> */}
          <Link
            href={`/leads/detail/${params.row.name}`}
            color="inherit"
            rel="noopener noreferrer"
          >
            {params.row.name}
          </Link>
        </Box>
      ),
    },
    lead_name: {
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
          {/* <CustomAvatar
            alt={params?.row?.lead_name}
            src={`${CONSTANTS.API_BASE_URL}${params?.row?.image}`}
            size={35}
            className="shadow-xs"
          /> */}
          <Link
            href={`/leads/detail/${params.row.name}`}
            color="inherit"
            rel="noopener noreferrer"
          >
            {params.row.lead_name}
          </Link>
        </Box>
      ),
    },

    account: {
      width: 150,
      type: "string",
      valueGetter: (params, row) => row.organization,
    },
    website: {
      width: 150,
      type: "string",
      valueGetter: (params, row) => row.website,
    },

    territory: {
      width: 150,
      type: "string",
      valueGetter: (params, row) => row.territory,
    },
    industry: {
      width: 150,
      type: "string",
      valueGetter: (params, row) => row.industry,
    },

    job_title: {
      width: 150,
      type: "string",
      valueGetter: (params, row) => row.job_title,
    },
    email: {
      width: 150,
      type: "string",
      valueGetter: (params, row) => row.email,
    },
    mobile_no: {
      width: 150,
      type: "string",
      valueGetter: (params, row) => row.mobile_no,
    },
    status: {
      width: 150,
      type: "string",
      // valueGetter: (params, row) => row.status,
      //  valueGetter: (params,row) =>
      //   row?.is_group?"Yes":"No",
      renderCell: (params) => {
        if (params?.row?.status === "New") {
          return <Chip
            icon={<RadioButtonUncheckedIcon />}
            label={params?.row?.status}
            // sx={{ borderColor: '#525252 !important' }}
            variant="outlined"
          />
        } else if (params?.row?.status === "Contacted") {
          return <Chip
            icon={<RadioButtonUncheckedIcon sx={{ color: '#e06c39 !important' }} />}
            label={params?.row?.status}
            // sx={{ borderColor: '#e06c39 !important' }}
            variant="outlined"
          />
        } else if (params?.row?.status === "Nurture") {
          return <Chip
            icon={<RadioButtonUncheckedIcon sx={{ color: '#007adb !important' }} />}
            label={params?.row?.status}
            // sx={{ borderColor: '#007adb !important' }}
            variant="outlined"
          />
        } else if (params?.row?.status === "Qualified") {
          return <Chip
            icon={<RadioButtonUncheckedIcon sx={{ color: '#00794c !important' }} />}
            label={params?.row?.status}
            // sx={{ borderColor: '#00794c !important' }}
            variant="outlined"
          />
        } else if (params?.row?.status === "Unqualified") {
          return <Chip
            icon={<RadioButtonUncheckedIcon sx={{ color: '#d62a30 !important' }} />}
            label={params?.row?.status}
            // sx={{ borderColor: '#d62a30 !important' }}
            variant="outlined"
          />
        } else if (params?.row?.status === "Junk") {
          return <Chip
            icon={<RadioButtonUncheckedIcon sx={{ color: '#8a40be !important' }} />}
            label={params?.row?.status}
            // sx={{ borderColor: '#8a40be !important' }}
            variant="outlined"
          />
        }
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
  customers: {
    organization_name: {
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
      width: 175,
      type: "string",
      valueGetter: (params, row) => {
        return (
          row?.website
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
    no_of_employees: {
      width: 175,
      type: "string",
      valueGetter: (params, row) => {
        return (
          row?.no_of_employees
        );
      },
    },
    email_id: {
      width: 175,
      type: "string",
      valueGetter: (params, row) => {
        return (
          row?.customer_email_id || row?.email_id || row?.primary_contact_email
        );
      },
    },
    phone: {
      width: 120,
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
      width: 175,
      type: "string",
      valueGetter: (params, row) => {
        return row?.customer_type;
      },
    },
    customer_group: {
      headerName: "Group",
      width: 120,
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

  contacts: {
    full_name: {
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
      width: 175,
      type: "string",
      valueGetter: (params, row) => {
        return row?.email_id;
      },
    },
    phone: {
      width: 120,
      type: "string",
      valueGetter: (params, row) => {
        return row?.phone;
      },
    },
    mobile_no: {
      width: 120,
      type: "string",
      valueGetter: (params, row) => {
        return row?.mobile_no;
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
            href={`/user/roles/detail/${params.row.role_name}`}
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
            href={`/user/users/detail/${params.row.email}`}
            color="inherit"
            rel="noopener noreferrer"
          >
            {params.row.username}
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
            href={`/user/roles/detail/${params.row.role_name}`}
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
  
};
