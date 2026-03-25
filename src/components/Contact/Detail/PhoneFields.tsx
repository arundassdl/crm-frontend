"use client";

import { useEffect, useState } from "react";
import { useFormik, FormikProvider, FieldArray, FormikErrors } from "formik";
import * as Yup from "yup";
import {
  TextField,
  Checkbox,
  IconButton,
  Stack,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Typography,
} from "@mui/material";
import {
  Add,
  Delete,
  Edit,
  Cancel,
  DeleteOutlineOutlined,
  CheckCircle,
  Done,
} from "@mui/icons-material";
import { GridCheckCircleIcon } from "@mui/x-data-grid";
import {
  CreateContactPhone,
  deleteContactPhone,
  EditContactPhone,
} from "@/services/api/contact-api/manage-contact-api";
import { showToast } from "@/components/ToastNotificationNew";
import ConfirmDialog from "@/components/UI/ConfirmDialog";
import RemoveIcon from "@mui/icons-material/Remove"; // Minus icon

// Type Definition
interface PhoneRow {
  id: string;
  phone?: string;
  phoneType?: string | null;
  isPrimaryPhone?: boolean;
  isPrimaryMobile?: boolean;
  customType?: string;
  originalRow?: PhoneRow;
  isEditing?: boolean;
}

interface FormValues {
  phones: PhoneRow[];
}

const validationSchema = Yup.object({
  phones: Yup.array()
    .of(
      Yup.object({
        phone: Yup.string()
          .matches(/^\d{10}$/, "Phone number must be 10 digits")
          .required("Phone number is required"),
        phoneType: Yup.string().nullable().required("Phone type is required"),
        isPrimaryPhone: Yup.boolean(),
        isPrimaryMobile: Yup.boolean(),
        customType: Yup.string().when("phoneType", {
          is: "Custom",
          then: (schema) => schema.required("Custom value is required"),
          otherwise: (schema) => schema.notRequired(),
        }),
      })
    )
    .test(
      "at-least-one-primary-phone",
      "At least one phone must be marked as primary",
      (values) => values?.some((phone) => phone.isPrimaryPhone)
    )
    .test(
      "at-least-one-primary-mobile",
      "At least one mobile must be marked as primary",
      (values) => values?.some((phone) => phone.isPrimaryMobile)
    ),
});

export default function PhoneFields({
  contactname,
  phonenos = [],
}: {
  contactname: string;
  phonenos?: any[];
}) {
  const maxRows = 10;
  const phoneTypeOptions = ["Mobile", "Work", "Home", "Custom"];

  // Convert phonenos to match PhoneRow structure
  const formattedPhones: PhoneRow[] = phonenos.map((phone) => ({
    id: phone.name,
    phone: phone.phone,
    phoneType: phoneTypeOptions.includes(phone.phone_type)
      ? phone.phone_type
      : "Custom",
    customType: phoneTypeOptions.includes(phone.phone_type)
      ? ""
      : phone.phone_type,
    isPrimaryPhone: Boolean(phone.is_primary_phone),
    isPrimaryMobile: Boolean(phone.is_primary_mobile_no),
    isEditing: false,
  }));

  const [userToken, setUserToken] = useState<any>(
    () => JSON.parse(localStorage.getItem("AccessTokenData") || "{}") || ""
  );
  const [selectedRowId, setSelectedRowId] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rows, setRows] = useState<any>(formattedPhones);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const formik = useFormik<FormValues>({
    initialValues: { phones: formattedPhones },
    validationSchema,
    onSubmit: (values) => console.log("Submitted Data:", values),
  });

  useEffect(() => {
    formik.setValues({ phones: formattedPhones });
  }, [phonenos]);

  // Toggle Edit Mode
  const toggleEdit = (index: number) => {
    const updatedRows = [...formik.values.phones];
    updatedRows[index] = {
      ...updatedRows[index],
      originalRow: { ...updatedRows[index] },
      isEditing: true,
    };
    formik.setValues({ phones: updatedRows });
  };

  // Save Data (New or Edit)
  const saveData = async (index: number) => {

    const phoneData = formik.values.phones[index];
    const isNew = phoneData.id.startsWith("temp-");

    // Validate Row
    try {
       formik.setTouched({
      ...formik.touched,
      phones: formik.touched.phones?.map((item, i) =>
        i === index ? { ...item, phone: true, customType: true } : item
      ),
    });
      await validationSchema.validateAt(`phones[${index}]`, formik.values);
    } catch (error) {
      
      
      if (error instanceof Yup.ValidationError) {
        const fieldName = error.path?.split(".").pop(); // Extracts 'phone', 'customType', etc.

        formik.setFieldError(`phones.${index}.${fieldName}`, error.message);
        const field = document.getElementsByName(`phones.${index}.${fieldName}`)[0];
        field?.focus();
        setTimeout(() => {
         
          field?.focus();
        }, 500);

        return;
      }
    }

    const formData = new FormData();
    formData.append("phone", phoneData.phone ?? "");
    formData.append("contact_name", contactname);
    formData.append("is_primary_phone", phoneData.isPrimaryPhone ? "1" : "0");
    formData.append(
      "is_primary_mobile_no",
      phoneData.isPrimaryMobile ? "1" : "0"
    );
    formData.append(
      "phone_type",
      phoneData.phoneType === "Custom"
        ? phoneData.customType || ""
        : phoneData.phoneType || ""
    );

    try {
      let response;
      if (isNew) {
        response = await CreateContactPhone(formData, userToken?.access_token);
        const newId = response?.data?.contact_phone?.name;

        if (newId) {
          const updatedRows = [...formik.values.phones];
          updatedRows[index] = {
            ...updatedRows[index],
            id: newId,
            isEditing: false, // Only set to false after success
          };
          formik.setValues({ phones: updatedRows });
          showToast("Phone added successfully", "success");
        } else {
          console.log("response?.message", response);

          showToast(response?.error, "error");
        }
      } else {
        formData.append("phoneno_old", phoneData.originalRow?.phone || "");
        await EditContactPhone(formData, userToken?.access_token);

        const updatedRows = [...formik.values.phones];
        updatedRows[index] = {
          ...updatedRows[index],
          isEditing: false, // Only set to false after success
        };
        formik.setValues({ phones: updatedRows });

        showToast("Phone updated successfully", "success");
      }
    } catch (error) {
      showToast("Error saving phone", "error");
    }
  };

  // Cancel Edit (Revert or Remove New)
  const cancelEdit = (index: number, arrayHelpers: any) => {
    const updatedRows = [...formik.values.phones];

    if (!updatedRows[index]) return; // Prevents accessing an out-of-bounds index

    if (updatedRows[index].id?.startsWith("temp-")) {
      arrayHelpers.remove(index);
    } else if (updatedRows[index].originalRow) {
      updatedRows[index] = {
        ...updatedRows[index].originalRow,
        isEditing: false,
        id: updatedRows[index].originalRow?.id ?? "", // Safe access to `id`
      };
      formik.setValues({ phones: updatedRows });
    }
  };

  const handleDeleteRow = (id: string, index: number, arrayHelpers: any) => {
    setSelectedRowId({ id, index, arrayHelpers });
    setDialogOpen(true);
  };
  const handleDeleteConfirm = async () => {
    if (!selectedRowId) return;
    const { id, index, arrayHelpers } = selectedRowId;

    if (!id.startsWith("temp-")) {
      setDialogOpen(false);
      // Call API to delete from backend
      try {
        const formData = new FormData();
        formData.append("contact_name", contactname);
        formData.append("phone", formik.values.phones[index].phone ?? "");

        const response = await deleteContactPhone(
          formData,
          userToken?.access_token
        );
        if (response?.data?.success) {
          showToast(response?.data.message, "success");
          arrayHelpers.remove(index); // Only remove after confirming
          setRows(arrayHelpers);
        } else {
          showToast(response?.error, "error");
        }
      } catch (error) {
        showToast("Error deleting email", "error");
      }
    } else {
      // Remove temp row without API call
      arrayHelpers.remove(index);
      setRows(arrayHelpers);
    }
  };

  return (
    <Grid container spacing={6} pt={5}>
      <Grid item xs={12}>
        <ConfirmDialog
          open={dialogOpen}
          title="Delete Item"
          message="Are you sure you want to delete this item? This action cannot be undone."
          onClose={() => setDialogOpen(false)}
          onConfirm={handleDeleteConfirm}
        />
        <FormikProvider value={formik}>
          <form onSubmit={formik.handleSubmit}>
            <Stack spacing={2} sx={{ pt: 2 }}>
              <FieldArray name="phones">
                {(rows) => (
                  <>
                    {formik.values.phones.map((row, index) => {
                      const phoneError = formik.errors.phones?.[index];
                      const phoneTouched = formik.touched.phones?.[index];
         
                      
                      return (
                        <Stack
                          key={row.id}
                          direction="row"
                          spacing={2}
                          alignItems="flex-start"
                          onMouseEnter={() => setHoveredIndex(index)}
                          onMouseLeave={() => setHoveredIndex(null)}
                          marginLeft="0px !important"
                        >
                          {/* Add the + Icon on the first row */}

                      
                            <Stack sx={{ minWidth: 35 }}>
                              {index >= 0 && (
                                <>
                                  {row.isEditing ? (
                                    // <Cancel />

                                    <>
                                      {/* <Checkbox
                                        title="Is Primary"
                                        name={`phones.${index}.isPrimaryPhone`}
                                        checked={row.isPrimaryPhone}
                                        // sx={{ marginTop: "-18px !important" }}
                                        onChange={() => {
                                          // Unselect all other phones as primary
                                          const updatedPhones =
                                            formik.values.phones.map(
                                              (phone, i) => ({
                                                ...phone,
                                                isPrimaryPhone: i === index,
                                              })
                                            );
                                          formik.setValues({
                                            phones: updatedPhones,
                                          });
                                        }}
                                        disabled={!row.isEditing}
                                      /> */}
                                    </>
                                  ) : (
                                    <Stack
                                        direction="row"
                                        alignItems="flex-start"
                                        spacing={1}
                                      >
                                    <IconButton
                                      sx={{
                                        backgroundColor: "red", // Red background
                                        color: "white", // White icon color
                                        width: 20,
                                        height: 20,
                                        alignSelf:"flex-start",
                                        "&:hover": {
                                          backgroundColor: "red !important", // Maintain red on hover
                                          opacity: 0.9, // Slight effect
                                        },
                                      }}
                                      onClick={() =>
                                        row.isEditing
                                          ? cancelEdit(index, rows)
                                          : handleDeleteRow(row.id, index, rows)
                                      }
                                    >
                                      <RemoveIcon sx={{fontSize:".9rem !important"}} />
                                    </IconButton>
                                    </Stack>
                                  )}
                                </>
                              )}
                            </Stack>
                     
                          <Stack
                            sx={{ width: "77%" }}
                            direction="column"
                            spacing={4}
                            columnGap={4}
                            paddingBottom={5}
                          >
                            <Stack
                              sx={{ width: "99%" }}
                              direction="row"
                              spacing={12}
                              columnGap={10}
                            >
                              <FormControl fullWidth>
                                {/* {index === 0 && (
                                  <InputLabel
                                    sx={{
                                      color:
                                        "var(--mui-palette-text-secondary)", // Change text color
                                      fontSize: "16px !important",
                                      fontWeight: 500,
                                      marginTop: "-10px!important",
                                      marginLeft: "-12px !important"
                                    }}
                                  >
                                    Phone Type
                                  </InputLabel>
                                )} */}
                                <Select
                                  size="small"
                                  variant="standard"
                                  name={`phones.${index}.phoneType`}
                                  value={row.phoneType || ""}
                                  onChange={(event) => {
                                    const value = event.target.value;
                                    const isCustom = value === "Custom";

                                    formik.setFieldValue(
                                      `phones.${index}.phoneType`,
                                      value
                                    );

                                    if (isCustom) {
                                      // Restore previous customType if it exists
                                      formik.setFieldValue(
                                        `phones.${index}.customType`,
                                        row.customType || row.phoneType || ""
                                      );
                                    } else {
                                      // Store the current customType before clearing it
                                      formik.setFieldValue(
                                        `phones.${index}.customType`,
                                        row.customType || ""
                                      );
                                    }
                                  }}
                                  disabled={!row.isEditing}
                                  sx={{
                                    "& .MuiInputBase-input.Mui-disabled": {
                                      color:
                                        "var(--mui-palette-text-secondary)", // Change text color
                                      WebkitTextFillColor:
                                        "var(--mui-palette-text-secondary)", // Ensure consistency
                                    },
                                    "& .MuiInputLabel-root.Mui-disabled": {
                                      color:
                                        "var(--mui-palette-text-secondary)", // Change text color
                                      fontSize: "16px !important",
                                      fontWeight: 500,
                                      marginTop: "-27px!important",
                                    },
                                  }}

                                >
                                  {phoneTypeOptions.map((type) => (
                                    <MenuItem key={type} value={type}>
                                      {type}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                              <TextField
                                // label={index === 0 ? "Phone Number" : ""}
                                size="small"
                                fullWidth
                                variant="standard"
                                name={`phones.${index}.phone`}
                                value={formik.values.phones[index].phone}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={
                                  phoneTouched?.phone &&
                                  typeof phoneError === "object" &&
                                  Boolean(phoneError?.phone)
                                }
                                helperText={
                                  phoneTouched?.phone &&
                                  typeof phoneError === "object"
                                    ? phoneError.phone
                                    : ""
                                }
                                disabled={!row.isEditing}
                                sx={{
                                  "& .MuiInputBase-input.Mui-disabled": {
                                    color: "var(--mui-palette-text-secondary)", // Change text color
                                    WebkitTextFillColor:
                                      "var(--mui-palette-text-secondary)", // Ensure consistency
                                  },
                                  "& .MuiInputLabel-root.Mui-disabled": {
                                    color: "var(--mui-palette-text-secondary)", // Change text color
                                    fontSize: "16px !important",
                                    fontWeight: 500,
                                    marginTop: "-17px!important",
                                  },
                                  "& .MuiFormLabel-root.MuiInputLabel-root": {
                                    fontSize: "16px !important",
                                    fontWeight: 500,
                                    marginTop: "-17px!important",
                                  },
                                }}
                              />
                              {row.isEditing ? (
                                 <Checkbox
                                 title="Set As Primary"
                                 name={`phones.${index}.isPrimaryPhone`}
                                 checked={row.isPrimaryPhone}
                                 // sx={{ marginTop: "-18px !important" }}
                                 onChange={() => {
                                   // Unselect all other phones as primary
                                   const updatedPhones =
                                     formik.values.phones.map(
                                       (phone, i) => ({
                                         ...phone,
                                         isPrimaryPhone: i === index,
                                       })
                                     );
                                   formik.setValues({
                                     phones: updatedPhones,
                                   });
                                 }}
                                 disabled={!row.isEditing}
                               />
                              ):(
                                  <Stack
                                  sx={{ width: "2%",marginTop: "8px !important" }}
                                  direction="row"
                                >
                                {row.isPrimaryPhone && (
                                  <Done sx={{ color: "green", fontSize: 20 }} titleAccess="Primary Phone" />
                                )}
                              </Stack>
                              )}
                            </Stack>
                            {row.phoneType === "Custom" && (
                              <Stack
                                sx={{ width: "45%" }}
                                direction="row"
                                spacing={4}
                                columnGap={4}
                              >
                                
                                <TextField
                                  label={index === 0 ? "Custom Value" : ""}
                                  size="small"
                                  variant="standard"
                                  name={`phones.${index}.customType`}
                                  value={formik.values.phones[index].customType || ""}
                                  onChange={formik.handleChange}
                                  onBlur={formik.handleBlur} // Trigger validation when user leaves field
                                  onFocus={() =>
                                    formik.setTouched({
                                      ...formik.touched,
                                      phones: formik.touched.phones?.map((item, i) =>
                                        i === index ? { ...item, customType: true } : item
                                      ),
                                    })
                                  }
                
                                  error={
                                    phoneTouched?.customType &&
                                    typeof phoneError === "object" &&
                                    Boolean(phoneError?.customType)
                                  }
                                  helperText={
                                    phoneTouched?.customType &&
                                    typeof phoneError === "object"
                                      ? phoneError.customType
                                      : ""
                                  }
                                  fullWidth
                                  disabled={!row.isEditing}
                                  sx={{
                                    "& .MuiInputBase-input.Mui-disabled": {
                                      color:
                                        "var(--mui-palette-text-secondary)", // Change text color
                                      WebkitTextFillColor:
                                        "var(--mui-palette-text-secondary)", // Ensure consistency
                                    },
                                    "& .MuiInputLabel-root.Mui-disabled": {
                                      color:
                                        "var(--mui-palette-text-secondary)", // Change text color
                                      fontSize: "14px !important",
                                      fontWeight: 500,
                                      marginTop: "-10px!important",
                                    },
                                    "& .MuiFormLabel-root.MuiInputLabel-root": {
                                      fontSize: "14px !important",
                                      fontWeight: 500,
                                      marginTop: "-10px!important",
                                    },
                                  }}
                                />
                              </Stack>
                            )}
                          </Stack>
                          <Stack
                            style={{
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              width: "100px",
                              marginBottom: "12px",
                              // width: "300px",
                            }}
                            direction="row"
                            spacing={2}
                            sx={{ width: "20%" }}
                          >                          
                            {row.isEditing && (
                              <>                                
                                <IconButton
                                  onClick={() =>
                                    row.isEditing
                                      ? saveData(index)
                                      : toggleEdit(index)
                                  }
                                >
                                  {row.isEditing ? (
                                    <GridCheckCircleIcon color="primary" />
                                  ) : (
                                    <Edit />
                                  )}
                                </IconButton>
                                <IconButton
                                  onClick={() =>
                                    row.isEditing
                                      ? cancelEdit(index, rows)
                                      : handleDeleteRow(row.id, index, rows)
                                  }
                                >
                                  {row.isEditing ? <Cancel /> : null}
                                </IconButton>
                              </>
                            )}

                            {hoveredIndex === index && !row.isEditing && (
                              <>
                                <IconButton
                                  onClick={() =>
                                    row.isEditing
                                      ? saveData(index)
                                      : toggleEdit(index)
                                  }
                                >
                                  {row.isEditing ? (
                                    <GridCheckCircleIcon color="primary" />
                                  ) : (
                                    <Edit />
                                  )}
                                </IconButton>

                                {/* <IconButton
                                  onClick={() =>
                                    row.isEditing
                                      ? cancelEdit(index, rows)
                                      : handleDeleteRow(row.id, index, rows)
                                  }
                                >
                                  {row.isEditing ? (
                                    <Cancel />
                                  ) : (
                                    <DeleteOutlineOutlined />
                                  )}
                                </IconButton> */}
                              </>
                            )}
                          </Stack>
                        </Stack>
                      );
                    })}

                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={2}
                      sx={{ cursor: "pointer", padding:"13px 0" }}
                      onClick={() => {
                        const hasEmptyRow = formik.values.phones.some(
                          (phone) => !phone.phone
                        );
                        if (!hasEmptyRow) {
                          rows.push({
                            id: `temp-${Date.now()}`,
                            phone: "",
                            phoneType: "Mobile",
                            isPrimaryPhone: false,
                            isPrimaryMobile: false,
                            isEditing: true,
                          });
                        }
                      }}                      
                    >
                      <IconButton
                        sx={{
                          backgroundColor: "green",
                          color: "white",
                          "&:hover": {
                            backgroundColor: "#008000 !important",
                            opacity: "0.9 !important",
                          },
                          width: 20,
                          height: 20,
                        }}                        
                      >
                        <Add sx={{fontSize:".9rem !important"}} />
                      </IconButton>
                      <Typography
                        variant="body1"
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          cursor: "pointer",
                          width:"100%"
                        }}                        
                      >
                        Add Phone
                      </Typography>
                    </Stack>
                  </>
                )}
              </FieldArray>
            </Stack>
          </form>
        </FormikProvider>
      </Grid>
    </Grid>
  );
}
