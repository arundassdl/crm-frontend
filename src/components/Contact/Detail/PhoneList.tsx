"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import {
  GridColDef,
  GridActionsCellItem,
  GridRowId,
  GridRowModesModel,
  GridRowModes,
  GridValidRowModel,
  GridRowsProp,
  GridDeleteIcon,
  GridCheckCircleIcon,
  GridEventListener,
  GridRowEditStopReasons,
} from "@mui/x-data-grid";
import {
  Button,
  Card,
  CardHeader,
  CardContent,
  TextField,
  FormHelperText,
  Checkbox,
  Box,
} from "@mui/material";
import { useFormik } from "formik";
import { v4 as uuidv4 } from "uuid";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import CancelIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";

import { showToast } from "@/components/ToastNotificationNew";
import {
  CreateContactPhone,
  EditContactPhone,
  deleteContactPhone,
} from "@/services/api/contact-api/manage-contact-api";
import StyledDataGrid from "@/@core/theme/overrides/datagrid";
import { SelectedFilterLangDataFromStore } from "@/store/slices/general_slices/selected-multilanguage-slice";
import { get_access_token } from "@/store/slices/auth/token-login-slice";
import { ContactPhoneFormValidation } from "@/validation/contactPhoneFormValidation";
import ConfirmDialog from "@/components/UI/ConfirmDialog";
import SDLDataGrid from "@/@core/components/datagrid/SDLDataGrid";

export default function PhoneList({
  contactname,
  phonenos,
}: {
  contactname: string;
  phonenos: GridRowsProp;
}) {
  const defaultLimit = 5;
  const router = useRouter();
  const [rows, setRows] = useState<any>(phonenos);
  const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [selectedRowId, setSelectedRowId] = useState<any | null>(null);
  const [editedRow, setEditedRow] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [page, setPage] = useState(0); // Start from the first page
  const [pageSize, setPageSize] = useState(defaultLimit); // Default page size
  const [newRowId, setNewRowId] = useState<any | null>(null);
  const [pageSizeOptions] = useState<number[]>([5, 10]);
  const isUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  const [userToken, setUserToken] = useState<any>(() =>
    JSON.parse(localStorage.getItem("AccessTokenData") || "{}")
  );
  const [clickSave, setClickSave] = useState(false);
  const phoneRegex = /^\+?[1-9]\d{9,14}$/;

  useEffect(() => {
    if (phonenos) {
      const updatedRows = phonenos.map((data) => ({
        ...data,
        id: data.name, // Using `name` as the ID
      }));
      setRows(updatedRows);
      console.log("phonenos===>", updatedRows);
    }
  }, [phonenos]);

  const handleAddRow = () => {
    if (newRowId !== null) return; // Prevent adding multiple new rows

    const id = uuidv4();
    setRows((oldRows) => [
      ...oldRows,
      {
        id,
        phone: "",
        is_primary_phone: 0,
        is_primary_mobile_no: 0,
        contactname: "",
        isNew: true,
      },
    ]);
    setRowModesModel((oldModel) => ({
      ...oldModel,
      [id]: { mode: GridRowModes.Edit, fieldToFocus: "phone" },
    }));
    setTimeout(() => {
      setPage(Math.ceil(rows.length / 5)); // Go to last page
    }, 0);
    setNewRowId(id);
  };

  const handleSaveClick = (id: GridRowId) => () => {
    setRowModesModel((prevModel) => ({
      ...prevModel,
      [id]: { mode: GridRowModes.View },
    }));
    setClickSave(true);
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

  const handleCancelClick = (id: GridRowId) => () => {
    // setRowModesModel({
    //   ...rowModesModel,
    //   [id]: { mode: GridRowModes.View, ignoreModifications: true },
    // });
    setNewRowId(null);
    setRowModesModel((prevModel) => ({
      ...prevModel,
      [id]: { mode: GridRowModes.View, ignoreModifications: true },
    }));
    setEditedRow(null);

    const editedRow = rows.find((row) => row.id === id);
    if (editedRow!.isNew) {
      setRows(rows.filter((row) => row.id !== id));
    }
    setNewRowId(null);
  };

  const handleCheckboxChange = async (id: string, field: string) => {
    setRows((prevRows) =>
      prevRows.map((row) =>
        row.id === id ? { ...row, [field]: !Boolean(row[field]) } : row
      )
    );
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
  const handleDeleteClick = (id: GridRowId) => () => {
    console.log("delete rows", rows);
    const filteredPhones = rows.filter((email) => email.id === id)[0];
    console.log("filteredPhones", filteredPhones);

    if (filteredPhones != undefined) {
      handleDelete(filteredPhones);
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
  const handleDelete = async (rowData) => {
    // if (confirm(`Are you sure you want to delete PhoneNo: ${rowData.phone}`)) {
    const formData = new FormData();
    formData.append("contact_name", contactname);
    formData.append("phone", rowData.phone);

    const Res = await deleteContactPhone(formData, userToken?.access_token);
    console.log("delete ", Res);
    if (Res?.data?.success) {
      showToast(Res?.data.message, "success");
      setDialogOpen(false);
      // router.push(`/contacts/detail/${contactname}`);
    } else {
      showToast(Res?.error, "error");
    }
    // }
  };
  // const handleDeleteRow = async (id: GridRowId) => {
  //     if (confirm("Are you sure you want to delete this phone number?")) {
  //       const rowToDelete = rows.find((row) => row.id === id);
  //       if (rowToDelete) {
  //         await deleteContactPhone({ contact_name: contactname, phone: rowToDelete.phone }, userToken?.access_token);
  //         showToast("Deleted successfully", "success");
  //         setRows((prevRows) => prevRows.filter((row) => row.id !== id));
  //       }
  //     }
  //   };

  const handleDeleteRow = (id: GridRowId) => () => {
    const filteredPhones = rows.filter((phoneno) => phoneno.id === id)[0];
 
    if (filteredPhones === undefined) {
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
    } else {
      setDialogOpen(true);
    }
    setSelectedRowId(id);
  };

  const handleInputChange = (id: number, value: string) => {
    console.log("change value", value);

    if (!phoneRegex.test(value)) {
      setErrors((prev) => ({ ...prev, [id]: "Invalid phone number" }));
    } else {
      setErrors((prev) => {
        const updatedErrors = { ...prev };
        delete updatedErrors[id];
        return updatedErrors;
      });
    }
    setRows((prevRows) =>
      prevRows.map((row) => (row.id === id ? { ...row, phone: value } : row))
    );
  };

  const processRowUpdate = async (
    newRow: GridValidRowModel,
    oldRow: GridValidRowModel
  ) => {
    console.log("🔄 Processing row update for:", newRow);

    // 🚨 Prevent auto-save when switching rows
    if (rowModesModel[newRow.id]?.mode === GridRowModes.Edit) {
      console.log("⏳ Still in edit mode. No update.");
      return oldRow; // Ignore update if still in edit mode
    }

    // Validate email before saving
    const isEmailValid =
      typeof newRow.phone === "string" && phoneRegex.test(newRow.phone);
    if (!isEmailValid) {
      setErrors((prev) => ({ ...prev, [newRow.id]: "Invalid phone" }));
      return oldRow; // Prevent saving if invalid email
    } else {
      setErrors((prev) => {
        const updatedErrors = { ...prev };
        delete updatedErrors[newRow.id]; // Remove error if valid
        return updatedErrors;
      });
    }
    if (clickSave) {
      // console.log("Saving processupdate newRow",newRow);
      // Prepare form data
      const formData = new FormData();
      formData.append("phone", newRow.phone);
      // formData.append("is_primary_phone", "0");
      // formData.append("is_primary_mobile_no", "0");
      formData.append("contact_name", contactname);

      if (newRow.isNew || !oldRow.phone) {
        console.log("🆕 Adding new row:", newRow);
        await createContactPhoneApi(formData);
      } else {
        console.log("✏️ Editing existing row:", oldRow);
        formData.append("phone", newRow.phone);
        formData.append(
          "is_primary_phone",
          newRow.is_primary_phone==true ? "1" : "0"
        );
        formData.append(
          "is_primary_mobile_no",
          newRow.is_primary_mobile_no ? "1" : "0"
        );
        formData.append("contact_name", contactname);
        formData.append("phoneno_old", oldRow.phone);
        
        if(isUUID(newRow.id)){
          await createContactPhoneApi(formData);
        }else{
          if (editedRow === newRow.id) {
            await editContactPhone(formData);
          }
        }
      }
      setRows((prevRows) =>
        prevRows.map((row) =>
          row.id === newRow.id ? { ...newRow, isNew: false } : row
        )
      );

      // ✅ Only update state after explicit Save
      if (newRow.is_primary_phone == true || newRow.is_primary_mobile_no == true) {
        setRows((prevRows) =>
          prevRows.map((row) => ({
            ...row,
            is_primary_phone: newRow.is_primary_phone === true ? (row.id === newRow.id ? 1 : 0) : row.is_primary_phone,
            is_primary_mobile_no: newRow.is_primary_mobile_no === true ? (row.id === newRow.id ? 1 : 0) : row.is_primary_mobile_no,
            ...(row.id === newRow.id ? { ...newRow, isNew: false } : {}), // Update only the edited row
          }))
        );
        
      } else {
        setRows((prevRows) =>
          prevRows.map((row) =>
            row.id === newRow.id ? { ...newRow, isNew: false } : row
          )
        );
      }

      setNewRowId(null);
      console.log("✅ Row saved successfully!", rows);
      setClickSave(false);
    }
    return { ...newRow, isNew: false };
  };

  const handleRowModesModelChange = (newRowModesModel: GridRowModesModel) => {
    setRowModesModel(newRowModesModel);
  };

  const createContactPhoneApi = async (formData) => {
    let contactApiRes: any = await CreateContactPhone(
      formData,
      userToken?.access_token
    );
    if (contactApiRes?.msg === "success") {
      showToast(contactApiRes?.data.message, "success");
      const contact_phone = contactApiRes?.data.contact_phone;

      removeAndUpdate(contact_phone);

      // router.push(`/contacts/detail/${contactname}`);
    } else {
      showToast(contactApiRes?.error, "error");
    }
  };

  const removeAndUpdate = (contact_phone) => {
    const updatedData = [...rows];

    // Check if the last object has a UUIDv4 ID
    const lastObject = updatedData[updatedData.length - 1];
    if (
      lastObject.id &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        lastObject.id
      )
    ) {
      updatedData.pop(); // Remove last object with UUIDv4 ID

      // Add new object or update the values you want
      updatedData.push({
        id: contact_phone?.phone,
        phone: contact_phone?.phone,
        is_primary_phone: contact_phone?.is_primary_phone,
        is_primary_mobile_no: contact_phone?.is_primary_mobile_no,
        contactname: contact_phone?.parent,
        isNew: false,
      });

      setRows(updatedData);
    }
  };

  const editContactPhone = async (formData) => {
    let contactApiRes: any = await EditContactPhone(
      formData,
      userToken?.access_token
    );
    if (contactApiRes?.msg === "success") {
      showToast(contactApiRes?.data.message, "success");
      // router.push(`/contacts/detail/${contactname}`);
    } else {
      showToast(contactApiRes?.error, "error");
    }
  };

  const columns: GridColDef[] = [
    {
      field: "phone",
      headerName: "Phone",
      width: 200,
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
            error={!!errors[params.id as number]}
            onChange={(e) =>
              handleInputChange(params.id as number, e.target.value)
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
      field: "is_primary_phone",
      headerName: "Is Primary Phone",
      width: 150,
      type: "string",
      renderCell: (params) => (
        <>
          {rowModesModel[params.row.id]?.mode === GridRowModes.Edit ? (
            <Checkbox
              checked={params.row.is_primary_phone}
              onChange={() =>
                handleCheckboxChange(params.row.id, "is_primary_phone")
              }
              datatype={params.row.id}
            />
          ) : (
            <Checkbox
              checked={params.row.is_primary_phone}
              datatype={params.row.id}
              disabled
            />
          )}
        </>
      ),
    },
    {
      field: "is_primary_mobile_no",
      headerName: "Is Primary Mobile",
      width: 150,
      type: "string",
      renderCell: (params) => (
        <>
          {rowModesModel[params.row.id]?.mode === GridRowModes.Edit ? (
            <Checkbox
              checked={params.row.is_primary_mobile_no}
              onChange={() =>
                handleCheckboxChange(params.row.id, "is_primary_mobile_no")
              }
              datatype={params.row.id}
            />
          ) : (
            <Checkbox
              checked={params.row.is_primary_mobile_no}
              datatype={params.row.id}
              disabled
            />
          )}
        </>
      ),
    },

    {
      field: "actions",
      headerName: "Actions",
      width: 100,
      type: "actions",
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

  return (
    <Card sx={{ boxShadow: "none" }}>
      <CardHeader
        title="Contact Numbers"
        action={
          <Button
            onClick={handleAddRow}
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
          >
            Add Phone
          </Button>
        }
      />
      <CardContent sx={{ padding: 0 }}>
        <ConfirmDialog
          open={dialogOpen}
          title="Delete Item"
          message="Are you sure you want to delete this item? This action cannot be undone."
          onClose={() => setDialogOpen(false)}
          onConfirm={handleDeleteClick(selectedRowId)}
        />
        {/* <SDLDataGrid
        rows={rows}
        columns={columns}
        rowCount={Number(rows?.length)}
        paginationModel={{ page, pageSize }}
        onPaginationModelChange={(newModel) => {
          setPage(newModel.page);
          setPageSize(newModel.pageSize);
        }}
        // sortingMode="server"
        // onSortModelChange={handleSortModelChange}
        // filterMode="server"
        // filterModel={filterModel}
        // onFilterModelChange={handleFilterModelChange}
        pageSizeOptions={pageSizeOptions}
        // loading={loading}
        toolbarProps={{
          title:  "Phone nos",
          total: Number(rows?.length),
          module: "Phone nos",
          onAddNew: handleAddRow,
        }}
      /> */}
        <StyledDataGrid
          // getRowId={(row) => row.id}
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
  );
}
