"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import { usePathname } from "next/navigation";
import {
  GridColDef,
  GridActionsCellItem,
  GridRowEditStopReasons,
  GridRowModes,
  GridToolbarContainer,
  GridRowsProp,
  GridRowModesModel,
  GridSlotProps,
  GridEventListener,
  GridValidRowModel,
} from "@mui/x-data-grid";
import { styled } from "@mui/material/styles";
import Paper from "@mui/material/Paper";
import {
  Button,
  TextField,
  Card,
  CardHeader,
  CardContent,
  FormHelperText,
  Checkbox,
} from "@mui/material";
import Box from "@mui/material/Box";
import tableStyles from "@core/styles/table.module.css";
import StyledDataGrid from "@/@core/theme/overrides/datagrid";
import { SelectedFilterLangDataFromStore } from "@/store/slices/general_slices/selected-multilanguage-slice";
import { get_access_token } from "@/store/slices/auth/token-login-slice";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import CancelIcon from "@mui/icons-material/Close";

import { ContactEmailFormValidation } from "@/validation/contactEmailFormValidation";
import { useFormik } from "formik";
import { showToast } from "@/components/ToastNotificationNew";
import {
  CreateContactEmail,
  EditContactEmail,
  deleteContactEmail,
} from "@/services/api/contact-api/manage-contact-api";
import { randomId } from "@mui/x-data-grid-generator";
import { GridRowId } from "@mui/x-data-grid";
import { GridCheckCircleIcon } from "@mui/x-data-grid";
import ConfirmDialog from "@/components/UI/ConfirmDialog";

interface FormValueType {
  email_id: string;
  is_primary: number;
  custom_error: string;
}

const formInitialValues: FormValueType = {
  email_id: "",
  is_primary: 0,
  custom_error: "",
};

declare module "@mui/x-data-grid" {
  interface ToolbarPropsOverrides {
    setRows: (newRows: (oldRows: GridRowsProp) => GridRowsProp) => void;
    setRowModesModel: (
      newModel: (oldModel: GridRowModesModel) => GridRowModesModel
    ) => void;
  }
}

// function EditToolbar(props: GridSlotProps["toolbar"]) {
//   const { setRows, setRowModesModel } = props;

//   const handleClick = () => {
//     const id = randomId();
//     setRows((oldRows) => [
//       ...oldRows,
//       { id, email_id: "", is_primary: "", contactname: "", isNew: true },
//     ]);
//     setRowModesModel((oldModel) => ({
//       ...oldModel,
//       [id]: { mode: GridRowModes.Edit, fieldToFocus: "email_id" },
//     }));
//   };

//   return (
//     <GridToolbarContainer
//       sx={{ display: "flex", justifyContent: "flex-end", padding: 1 }}
//     >
//       <Button
//         color="primary"
//         startIcon={<AddIcon />}
//         onClick={handleClick}
//         variant="outlined"
//         size="small"
//       >
//         Add New
//       </Button>
//     </GridToolbarContainer>
//   );
// }

export default function EmailListNew({
  contactname,
  emailids,
}: {
  contactname: string;
  emailids: GridRowsProp;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultLimit = 5; //searchParams.get('limit') ? Number(searchParams.get('limit')) : 5;

  const [loading, setLoading] = useState(true);
  const TokenFromStore = useSelector(get_access_token);
  const SelectedLangDataFromStore: any = useSelector(
    SelectedFilterLangDataFromStore
  );

  const [selectedMultiLangData, setSelectedMultiLangData] = useState<any>();
  const [emailList, setEmailList] = useState<any[]>([]);
  const [emailCount, setEmailCount] = useState<number>(0);
  const [pageSizeOptions] = useState<number[]>([5, 10]);
  const [emailid_old, setOldEmailId] = useState<any>("");

  const [operation, setOperation] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(-1);
 const [rows, setRows] = useState<any>(emailids);
 const [originalRows, setOriginalRows] = useState<GridValidRowModel[]>(rows);
  const [rowModesModel, setRowModesModel] = React.useState<GridRowModesModel>(
    {}
  );
  const [errors, setErrors] = useState<Record<number, string>>({}); // Store validation errors
  const [editedRow, setEditedRow] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState<any>(null);
  const [page, setPage] = useState(0); // Start from the first page
  const [pageSize, setPageSize] = useState(defaultLimit); // Default page size
  const [newRowId, setNewRowId] = useState<any | null>(null);
  const [newRowsData, setNewRowsData] = useState<any>(rows);
  const [clickSave, setClickSave] = useState(false);
  const isUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  // Email regex validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  useEffect(() => {
    setOriginalRows(rows); // Keep a copy of original data when rows change
  }, [rows]);
  
  
  const handleClick = () => {
    if (newRowId !== null) return; // Prevent adding multiple new rows

    const id = randomId();
    setRows((oldRows) => [
      ...oldRows,
      { id, email_id: "", is_primary: "", contactname: "", isNew: true },
    ]);
    setRowModesModel((oldModel) => ({
      ...oldModel,
      [id]: { mode: GridRowModes.Edit, fieldToFocus: "email_id" },
    }));
    setTimeout(() => {
      setPage(Math.ceil(rows.length / 5)); // Go to last page
    }, 0);
    setNewRowId(id);
  };
  
  
  const handleEditClick = (id: GridRowId) => () => {
    setRowModesModel((prevModel) => {
      // Reset all rows to 'View' mode before setting the new one to 'Edit'
      const newModel: GridRowModesModel = {};
      newModel[id] = { mode: GridRowModes.Edit };

      setEditedRow(id); // Track the currently edited row

      return newModel;
    });
  };

  const handleRowEditStop: GridEventListener<"rowEditStop"> = (
    params,
    event
  ) => {
    const { id, reason } = params;

    if (reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true; // Prevent default behavior when losing focus

      // When editing stops, update the row state back to 'View' mode (not saved automatically)
      setRowModesModel((prevModel) => ({
        ...prevModel,
        [id]: { mode: GridRowModes.View }, // Ensure the row is back to 'View' mode after edit
      }));

      console.log(`Row ${id} edit stopped. Setting it to 'View' mode.`);
    }
  };
  
  const handleSaveClick = (id: GridRowId) => async() => {
   
     setRowModesModel((prevModel) => ({
      ...prevModel,
      [id]: { mode: GridRowModes.View }, // Set row back to 'View' mode after saving
    }));
    setEditedRow(null);
    setNewRowId(null);
    setClickSave(true);   
  };

  const handleDeleteRow = (id: GridRowId) => () => {
   
    const filteredEmails = rows.filter((email) => email.id === id)[0];
    console.log("filteredEmails",filteredEmails);
    
    if (filteredEmails === undefined) {
      setRowModesModel((prevModel) => ({
        ...prevModel,
        [id]: { mode: GridRowModes.View },
      }));
      setEditedRow(null);

      const editedRow = rows.find((row) => row.id === id);
      if (editedRow!.isNew) {
        setRows(rows.filter((row) => row.id !== id));
      }
      setNewRowId(null);
    } else {
      setDialogOpen(true);
    }
    setSelectedRowId(id);
  };
  const handleDelete = async (rowData) => {
    console.log("rowData=>", rowData);
    console.log("rowData=>contactname", contactname);
    // if (confirm(`Are you sure you want to delete ${rowData.id}`)) {
    const formData = new FormData();
    formData.append("contact_name", contactname);
    formData.append("email_id", rowData.email_id);

    const Res = await deleteContactEmail(formData, userToken?.access_token);
    console.log("delete ", Res);
    if (Res?.data?.success) {
      setRows(rows.filter((row) => row.id !== rowData.id));
      showToast(Res?.data.message, "success");
      setDialogOpen(false);
      // router.push(`/contacts/detail/${contactname}`);
    } else {
      showToast(Res?.error, "error");
    }
    // }
  };
  const handleDeleteClick = (id: GridRowId) => () => {
    console.log("delete rows", rows);
    const filteredEmails = rows.filter((email) => email.id === id)[0];
    console.log("filteredEmails", filteredEmails);

    if (filteredEmails != undefined) {
      handleDelete(filteredEmails);
      setRows(rows.filter((row) => row.id !== id));
    } else {
      setRowModesModel((prevModel) => ({
        ...prevModel,
        [id]: { mode: GridRowModes.View },
      }));
      setEditedRow(null);

      const editedRow = rows.find((row) => row.id === id);
      // if (editedRow!.isNew) {
        setRows(rows.filter((row) => row.id !== id));
      // }
      setNewRowId(null);
      setDialogOpen(false);
    }
  };

  const handleCancelClick = (id: GridRowId) => () => {
    // setRowModesModel({
    //   ...rowModesModel,
    //   [id]: { mode: GridRowModes.View, ignoreModifications: true },
    // });
    setNewRowId(null);
    setRowModesModel((prevModel) => ({
      ...prevModel,
      [id]: { mode: GridRowModes.View },
    }));
    setEditedRow(null);

    const editedRow = rows.find((row) => row.id === id);
    if (editedRow!.isNew) {
      setRows(rows.filter((row) => row.id !== id));
    }
    setNewRowId(null);
  };
  const processRowUpdate = async (
    newRow: GridValidRowModel,
    oldRow: GridValidRowModel
  ) => {
    console.log("🔄 Processing row update for:", newRow.id);
  
    // 🚨 Prevent auto-save when switching rows
    if (rowModesModel[newRow.id]?.mode === GridRowModes.Edit) {
      console.log("⏳ Still in edit mode. No update.");
      return oldRow; // Ignore update if still in edit mode
    }
  
    // Validate email before saving
    const isEmailValid = typeof newRow.email_id === "string" && emailRegex.test(newRow.email_id);
    if (!isEmailValid) {
      setErrors((prev) => ({ ...prev, [newRow.id]: "Invalid email address" }));
      return oldRow; // Prevent saving if invalid email
    }else{
      setErrors((prev) => {
        const updatedErrors = { ...prev };
        delete updatedErrors[newRow.id]; // Remove error if valid
        return updatedErrors;
      });
    }
    if(clickSave){
      // console.log("Saving processupdate newRow",newRow);
      // Prepare form data
      const formData = new FormData();
      formData.append("email_id", newRow.email_id);
      formData.append("is_primary", newRow.is_primary ? "1" : "0");
      formData.append("contact_name", contactname);
    
      if (newRow.isNew || !oldRow.email_id) {
        console.log("🆕 Adding new row:", newRow);
        await createContactEmailApi(formData);
      } else {
        console.log("✏️ Editing existing row:", oldRow);
        formData.append("emailid_old", oldRow.email_id);
        if(isUUID(newRow.id)){
          await createContactEmailApi(formData);
        }else{
          await editContactEmail(formData);
        }
      }
    
      // ✅ Only update state after explicit Save
      if(newRow.is_primary==1){
        setRows((prevRows) =>
          prevRows.map((row) =>
            row.id === newRow.id
              ? { ...newRow, isNew: false, is_primary: 1 } // Set the current row as primary
              : { ...row, is_primary: 0 } // Set all others to non-primary
          )
        );
      }else{
        setRows((prevRows) =>
          prevRows.map((row) => (row.id === newRow.id ? { ...newRow, isNew: false } : row))
        );
      }
    
      setNewRowId(null);
      console.log("✅ Row saved successfully!",rows);
      setClickSave(false);
    }  
    return { ...newRow, isNew: false };
  };
    
  const handleRowModesModelChange = (newRowModesModel: GridRowModesModel) => {
    setRowModesModel(newRowModesModel);
  };

  const handleEmailChange = (id: number, value: string) => {
    if (!emailRegex.test(value)) {
      setErrors((prev) => ({ ...prev, [id]: "Invalid email address" }));
    } else {
      setErrors((prev) => {
        const updatedErrors = { ...prev };
        delete updatedErrors[id]; // Remove error if valid
        return updatedErrors;
      });
    }

    // Update email in row
    setRows((prevRows) =>
      prevRows.map((row) => (row.id === id ? { ...row, email: value } : row))
    );
  };

  const formik = useFormik({
    initialValues: formInitialValues,
    validationSchema: ContactEmailFormValidation,
    enableReinitialize: true,
    isInitialValid: true,
    onSubmit: async (values, action) => {
      // alert(JSON.stringify(values, null, 2));
      const requestParams = {
        value: { ...values },
        token: userToken?.access_token,
      };

      // IsPrimaryEmailSetOrEmailExists();
      handlesubmit(values, action);
    },
  });

  const [userToken, setUserToken] = useState<any>(() => {
    const initialValue = JSON.parse(
      localStorage.getItem("AccessTokenData") || "{}"
    );
    return initialValue || "";
  });

  const handlesubmit: any = async (values, action) => {
    // if(!Boolean(formik.errors.custom_error))
    if (formik.isValid) {
      const formData = new FormData();
      Object.keys(values).forEach(function (key) {
        console.log(key, "============", values[key]);
        formData.append(key, values[key]);
      });
      formData.append("contact_name", contactname);
      formData.append("emailid_old", emailid_old);
      console.log("values form Data", values);
      // return false;
      if (operation == "Add") {
        createContactEmailApi(formData);
      } else if (operation == "Edit") {
        editContactEmail(formData);
      }

      CloseDialog();
      // alert(JSON.stringify(values))
      action.setSubmitting(false);
    }
    // }
  };

  const removeAndUpdate = (contact_email) => {
    const updatedData = [...rows];
    
    // Check if the last object has a UUIDv4 ID
    const lastObject = updatedData[updatedData.length - 1];
    if (lastObject.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lastObject.id)) {
      updatedData.pop(); // Remove last object with UUIDv4 ID

      // Add new object or update the values you want
      updatedData.push({
        id:contact_email?.email_id, email_id: contact_email?.email_id, is_primary: contact_email?.is_primary, contactname: contact_email?.parent, isNew: false 
      });

      setRows(updatedData);
    }
  };
  const createContactEmailApi = async (formData) => {
    let contactApiRes: any = await CreateContactEmail(
      formData,
      userToken?.access_token
    );
    if (contactApiRes?.msg === "success") {
      showToast(contactApiRes?.data.message, "success");
      const contact_email = contactApiRes?.data.contact_email
      removeAndUpdate(contact_email)
      // router.push(`/contacts/detail/${contactname}`);
    } else {
      showToast(contactApiRes?.error, "error");
    }
  };

  const editContactEmail = async (formData) => {
    let contactApiRes: any = await EditContactEmail(
      formData,
      userToken?.access_token
    );
    console.log("formData----------", formData);

    if (contactApiRes?.msg === "success") {
      showToast(contactApiRes?.data.message, "success");

      // if(formData.is_primary===1){
      // router.push(`/contacts/detail/${contactname}`);
      // }
    } else {
      showToast(contactApiRes?.error, "error");
    }
  };


  const handleCheckboxChange = async (id: string, is_primary: string) => {
    setRows((prevRows) =>
      prevRows.map((row) => ({
        ...row,
        is_primary: row.id === id ? !row.is_primary : row.is_primary, // Uncheck all others when the clicked row is checked
      }))
    );
  };

  const columns: GridColDef[] = [
    {
      field: "email_id",
      headerName: "Email",
      width: 350,
      flex: 0,
      sortable: false,
      hideSortIcons: true,
      editable: true,
      renderCell: (params) => (
        <>
          <TextField
            sx={{
              "& fieldset": { border: "none" }, // Removes the border
              backgroundColor: "transparent",
            }}
            size="small"
            value={params.value || ""}
            error={!!errors[params.id]}
            // helperText={errors[params.id] || ""}
            // FormHelperTextProps={{
            //   sx: { color: "red", fontSize: "14px", paddingTop:"-8px"}, // Customize text
            // }}
            onChange={(e) =>
              handleEmailChange(params.id as number, e.target.value)
            }
          />
          {errors[params.id] && (
            <FormHelperText
              sx={{
                color: "red",
                fontSize: "11px",
                marginTop: "-21px",
                paddingLeft: "12px",
              }}
            >
              {errors[params.id]}
            </FormHelperText>
          )}
        </>
      ),
    },

    {
      field: "is_primary",
      headerName: "Is Primary",
      width: 120,
      renderCell: (params) => (
        <>
          {rowModesModel[params.row.id]?.mode === GridRowModes.Edit ? (
            <>
              <Checkbox
                checked={Boolean(params.row.is_primary)} // Ensure it's a boolean value
                onChange={() =>
                  handleCheckboxChange(params.row.id, params.row.is_primary)
                } // Use params.row.id for correct ID
                datatype={params.row.id}
              />
            </>
          ) : (
            <>
              <Checkbox
                checked={Boolean(params.row.is_primary)} // Ensure it's a boolean value
                datatype={params.row.id}
                disabled
              />
            </>
          )}
        </>
      ),
    },
    {
      field: "action",
      headerName: "",
      sortable: false,
      filterable: false,
      width: 200,
      disableExport: true,
      headerClassName: "",
      type: "actions",
      // renderCell: (params) => (
      //   <div
      //     onMouseEnter={() => handleMouseEnter(params.id)}
      //     onMouseLeave={handleMouseLeave}
      //   >
      //     ddd
      //     {hoveredRow === params.id && (
      //       <div>
      //         <IconButton onClick={() => console.log('Edit', params.row)}>
      //           <EditIcon />
      //         </IconButton>
      //         <IconButton onClick={() => console.log('Delete', params.row)}>
      //           <DeleteIcon />
      //         </IconButton>
      //       </div>
      //     )}
      //   </div>
      // ),
      // renderCell: (params) => (
      //   rowModesModel[params.id]?.mode === GridRowModes.Edit ? (
      //     <IconButton onClick={() => handleSaveRow(params)} color="primary">
      //       <SaveIcon />
      //     </IconButton>
      //   ) :
      //   <div
      //     onMouseEnter={() => setHoveredRow(params.id)}
      //     onMouseLeave={() => setHoveredRow(null)}
      //   >
      //     {hoveredRow === params.id && (
      //       <IconButton onClick={() => handleDelete(params)} color="secondary">
      //         <GridDeleteIcon />
      //       </IconButton>
      //     )}
      //   </div>
      // ),
      getActions: ({ id }) => {
        const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;

        if (isInEditMode) {
          return [
            <GridActionsCellItem
              icon={<GridCheckCircleIcon />}
              label="Save"
              sx={{
                color: "primary.main",
              }}
              onClick={handleSaveClick(id)}
            />,
            <GridActionsCellItem
              icon={<CancelIcon />}
              label="Cancel"
              className="textPrimary"
              onClick={handleCancelClick(id)}
              color="inherit"
            />,
          ];
        }

        return [
          <GridActionsCellItem
            icon={<EditIcon />}
            label="Edit"
            className="textPrimary"
            onClick={handleEditClick(id)}
            color="secondary"
          />,
          <GridActionsCellItem
            icon={<DeleteIcon />}
            label="Delete"
            onClick={handleDeleteRow(id)}
            color="secondary"
          />,
        ];
      },
    },
  ];

  // Handle email data initialization
  useEffect(() => {
    if (emailids && Array.isArray(emailids)) {
      setRows(emailids);
      setEmailCount(emailids.length);
      formik.isValid = true;
      setLoading(false);
    }
  }, [emailids]);

  // Handle language data
  useEffect(() => {
    if (
      Object.keys(SelectedLangDataFromStore?.selectedLanguageData || {})
        .length > 0
    ) {
      setSelectedMultiLangData(SelectedLangDataFromStore.selectedLanguageData);
    }
  }, [SelectedLangDataFromStore]);

  const ClearTextFileds = () => {
    // let IdNo=createRowData()
    // formik.setFieldValue("no",IdNo.no)
    // formik.setFieldValue("email_id",'')
    // formik.setFieldValue("is_primary",0)
    formik.resetForm();
  };

  const OpenDialog = () => {
    setOpen(true);
  };

  //   const createRowData=()=>{
  //     const newId = Math.max(...emailList.map((r) => (r.id ? r.id : 0) * 1)) + 1;
  //     const newNo = Math.max(...emailList.map((r) => (r.no ? r.no : 0) * 1)) + 1;

  //     return { id: newId, no: newNo };
  //   }

  const CloseDialog = () => {
    setOpen(false);
  };

  

  const IsPrimaryEmailSetOrEmailExists = () => {
    IsPrimaryEmailSet();
    IsEmailAlreadyExists();
  };

  const IsPrimaryEmailSet = () => {
    formik.isValid = true;

    if (formik.values.is_primary == 1) {
      emailList.forEach((email) => {
        if (selectedId != email.no && email.is_primary == 1) {
          let errors = {};
          errors["custom_error"] = "Primary Emailid Already Set";
          formik.setErrors(errors);
          formik.isValid = false;
        }
      });
    }
  };

  const IsEmailAlreadyExists = () => {
    emailList.forEach((email) => {
      if (selectedId != email.no && email.email_id == formik.values.email_id) {
        let errors = {};
        errors["custom_error"] = "Same Emailid Already Exists";

        formik.setErrors(errors);
        formik.isValid = false;
      }
    });
  };

  const handleAddRow = () => {
    const newRow = {
      id: Date.now(),
      email_id: "",
      is_primary: "0",
      contact_name: contactname,
      emailid_old: emailid_old,
    };
    setEmailList((prev) => [...prev, newRow]);
    setRowModesModel((prev) => ({
      ...prev,
      [newRow.id]: { mode: GridRowModes.Edit },
    }));

    console.log("newRow", newRow);
  };

  // Handle saving row edits
  const handleSaveRow = (data) => {
    console.log("data", data);

    setRowModesModel((prev) => ({
      ...prev,
      [data.id]: { mode: GridRowModes.View },
    }));
  };
  useEffect(() => {
   
    if (emailids) {
      const updatedRows = emailids.map((data) => ({
        ...data,
        id: data.name, // Using `name` as the ID
      }));
      console.log("updatedRows",updatedRows);
      
      setRows(updatedRows);
      // setEmailList(updatedRows);
    }
  }, [emailids]);
  return (
    <>
     
        <Card sx={{ boxShadow: "none",padding:0 }} >
          <CardHeader
            title="Email IDs"
            action={
              <Box display="flex" justifyContent="flex-end">
                <Button
                  id="add"
                  onClick={handleClick}
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                >
                  Add Email
                </Button>
              </Box>
            }
          />

          <CardContent sx={{padding:0}}>
            <ConfirmDialog
              open={dialogOpen}
              title="Delete Item"
              message="Are you sure you want to delete this item? This action cannot be undone."
              onClose={() => setDialogOpen(false)}
              onConfirm={handleDeleteClick(selectedRowId)}
            />
            <StyledDataGrid
            // getRowId={(row) => row.name}
            rows={rows}
            columns={columns}
            disableRowSelectionOnClick
            editMode="row"
            rowModesModel={rowModesModel}
            onRowModesModelChange={handleRowModesModelChange}
            onRowEditStop={handleRowEditStop}
            processRowUpdate={processRowUpdate}
            pagination
            paginationModel={{ page, pageSize }}
            onPaginationModelChange={(newModel) => {
              setPage(newModel.page);
              setPageSize(newModel.pageSize);
            }}
            pageSizeOptions={pageSizeOptions}
          />
         

            
          </CardContent>
        </Card> 
    </>
  );
}
