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
  FormControlLabel,
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
  CreateContactEmail,
  deleteContactEmail,
  EditContactEmail,
} from "@/services/api/contact-api/manage-contact-api";
import { showToast } from "@/components/ToastNotificationNew";
import ConfirmDialog from "@/components/UI/ConfirmDialog";
import RemoveIcon from "@mui/icons-material/Remove"; // Minus icon

// Type Definition
interface EmailRow {
  id: string;
  email?: string;
  emailType?: string | null;
  isPrimary?: boolean;
  customType?: string;
  originalRow?: EmailRow;
  isEditing?: boolean;
}

interface FormValues {
  emails: EmailRow[];
}

const validationSchema = Yup.object({
  emails: Yup.array()
    .of(
      Yup.object({
        email: Yup.string()
          .email("Invalid email format") // Ensure valid email format
          .required("Email is required"),
        emailType: Yup.string().nullable().required("Email type is required"),
        isPrimary: Yup.boolean(),
        customType: Yup.string().when("emailType", {
          is: "Custom",
          then: (schema) => schema.required("Custom value is required"),
          otherwise: (schema) => schema.notRequired(),
        }),
      })
    )
    .test(
      "at-least-one-primary",
      "At least one email must be primary",
      (values) => values?.some((email) => email.isPrimary)
    ),
});

export default function EmailFields({
  contactname,
  emailids = [],
}: {
  contactname: string;
  emailids?: any[];
}) {
  const maxRows = 10;
  const emailTypeOptions = ["Business Email", "Personal Email", "Custom"];

  // Convert emailids to match EmailRow structure
  const formattedEmails: EmailRow[] = emailids.map((email) => ({
    id: email.name,
    email: email.email_id,
    emailType: emailTypeOptions.includes(email.email_type)
      ? email.email_type
      : "Custom",
    customType: emailTypeOptions.includes(email.email_type)
      ? ""
      : email.email_type,
    isPrimary: Boolean(email.is_primary),
    isEditing: false,
  }));

  const [userToken, setUserToken] = useState<any>(
    () => JSON.parse(localStorage.getItem("AccessTokenData") || "{}") || ""
  );
  const [selectedRowId, setSelectedRowId] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rows, setRows] = useState<any>(formattedEmails);
  const formik = useFormik<FormValues>({
    initialValues: { emails: formattedEmails },
    validationSchema,
    onSubmit: (values) => console.log("Submitted Data:", values),
  });
  const [hover, setHover] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    formik.setValues({ emails: formattedEmails });
  }, [emailids]);

  // Toggle Edit Mode
  const toggleEdit = (index: number) => {
    const updatedRows = [...formik.values.emails];
    updatedRows[index] = {
      ...updatedRows[index],
      originalRow: { ...updatedRows[index] },
      isEditing: true,
    };
    formik.setValues({ emails: updatedRows });
  };

  // Save Data (New or Edit)
  const saveData = async (index: number) => {
    const emailData = formik.values.emails[index];
    const isNew = emailData.id.startsWith("temp-");

    // Validate Row
    try {
      await validationSchema.validateAt(`emails[${index}]`, formik.values);
    } catch (error) {
      if (error instanceof Yup.ValidationError) {
        const fieldName = error.path?.split(".").pop(); // Extracts 'phone', 'customType', etc.
        console.log("error.message", error.message);

        formik.setFieldError(`emails.${index}.${fieldName}`, error.message);
        const field = document.getElementsByName(
          `emails.${index}.${fieldName}`
        )[0];
        field?.focus();
        setTimeout(() => {
          field?.focus();
        }, 3000);

        return;
      }
    }

    const formData = new FormData();
    formData.append("email_id", emailData.email ?? "");
    formData.append("is_primary", emailData.isPrimary ? "1" : "0");
    formData.append("contact_name", contactname ?? "");
    formData.append(
      "email_type",
      emailData.emailType === "Custom"
        ? emailData.customType || ""
        : emailData.emailType || ""
    );

    try {
      if (isNew) {
        let response = await CreateContactEmail(
          formData,
          userToken?.access_token
        );
        const newId = response?.data?.contact_email?.name; // Assuming API returns the new ID

        if (newId) {
          const updatedRows = [...formik.values.emails];
          updatedRows[index] = {
            ...updatedRows[index],
            id: newId,
            isEditing: false,
          };
          formik.setValues({ emails: updatedRows });
          showToast("Email added successfully", "success");
        } else {
          showToast(response?.message?.error, "error");
        }
      } else {
        formData.append("emailid_old", emailData.originalRow?.email || "");
        await EditContactEmail(formData, userToken?.access_token);
        showToast("Email updated successfully", "success");
        const updatedRows = [...formik.values.emails];
        updatedRows[index].isEditing = false;
        formik.setValues({ emails: updatedRows });
      }
    } catch (error) {
      showToast("Error saving email", "error");
    }
  };

  // Cancel Edit (Revert or Remove New)
  // const cancelEdit = (index: number, arrayHelpers: any) => {
  //   const updatedRows = [...formik.values.emails];

  //   if (updatedRows[index].id.startsWith("temp-")) {
  //     arrayHelpers.remove(index);
  //     // setRows(rows.filter((row) => row.id !== updatedRows[index].id));
  //   } else if (updatedRows[index].originalRow) {
  //     updatedRows[index] = {
  //       ...updatedRows[index].originalRow,
  //       isEditing: false,
  //     };
  //     formik.setValues({ emails: updatedRows });
  //   }
  // };
  const cancelEdit = (index: number, arrayHelpers: any) => {
    const updatedRows = [...formik.values.emails];

    if (!updatedRows[index]) return; // Prevents accessing an out-of-bounds index

    if (updatedRows[index].id?.startsWith("temp-")) {
      arrayHelpers.remove(index);
    } else if (updatedRows[index].originalRow) {
      updatedRows[index] = {
        ...updatedRows[index].originalRow,
        isEditing: false,
        id: updatedRows[index].originalRow?.id ?? "", // Safe access to `id`
      };
      formik.setValues({ emails: updatedRows });
    }

    formik.setFieldError(`emails.${index}.customType`, "");
    formik.setFieldTouched(`emails.${index}.customType`, false, false);
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
        formData.append("contact_name", contactname ?? ""); // Ensure contactname is defined
        formData.append("email_id", formik.values.emails[index].email ?? ""); // Default to empty string

        const response = await deleteContactEmail(
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
              <FieldArray name="emails">
                {(rows) => (
                  <>
                    {formik.values.emails.map((row, index) => {
                      const emailError = formik.errors.emails?.[index];
                      const emailTouched = formik.touched.emails?.[index];
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
                          <Stack sx={{ minWidth: 35 }}>
                            {index >= 0 && (
                              <>
                                {row.isEditing ? (
                                  <>
                                    {/* <Checkbox
                                        title="Is Primary"
                                        name={`emails.${index}.isPrimary`}
                                        checked={row.isPrimary}
                                        // sx={{ marginTop: "-18px  !important" }}
                                        onChange={() => {
                                          if (!row.isEditing) return; // Only allow changing when in edit mode

                                          const updatedEmails =
                                            formik.values.emails.map(
                                              (email, i) => ({
                                                ...email,
                                                isPrimary: i === index, // Set only the clicked one to true, others to false
                                              })
                                            );

                                          formik.setValues({
                                            emails: updatedEmails,
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
                                        alignSelf: "flex-start",
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
                                      {row.isEditing ? (
                                        <Cancel />
                                      ) : (
                                        <RemoveIcon sx={{fontSize:".9rem !important"}} />
                                      )}
                                    </IconButton>
                                  </Stack>
                                )}
                              </>
                            )}
                          </Stack>

                          {/* {row.isEditing && (
                              <>
                              <Checkbox
                                title="Is Primary"
                                name={`emails.${index}.isPrimary`}
                                checked={row.isPrimary}
                                onChange={() => {
                                  if (!row.isEditing) return; // Only allow changing when in edit mode

                                  const updatedEmails =
                                    formik.values.emails.map((email, i) => ({
                                      ...email,
                                      isPrimary: i === index, // Set only the clicked one to true, others to false
                                    }));

                                  formik.setValues({ emails: updatedEmails });
                                }}                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
                                disabled={!row.isEditing}
                              />
                              </>
                              )} */}
                          <Stack
                            sx={{ width: "77%" }}
                            direction="column"
                            spacing={2}
                            columnGap={2}
                            paddingBottom={5}
                          >
                            <Stack
                              sx={{ width: "100%" }}
                              direction="row"
                              spacing={12}
                              columnGap={12}
                            >
                              <FormControl fullWidth>
                                {/* {index === 0 && (
                                  <InputLabel
                                    sx={{
                                      color:
                                        "var(--mui-palette-text-secondary)", // Change text color
                                      fontSize: "16px !important",
                                      fontWeight: 500,
                                      marginTop: "-16px!important",
                                      marginLeft: "-12px !important"
                                    }}
                                  >
                                    Email Type
                                  </InputLabel>
                                )} */}
                                <Select
                                  size="small"
                                  variant="standard"
                                  name={`emails.${index}.emailType`}
                                  value={row.emailType || ""}
                                  onChange={(event) => {
                                    const value = event.target.value;
                                    const isCustom = value === "Custom";

                                    formik.setFieldValue(
                                      `emails.${index}.emailType`,
                                      value
                                    );

                                    if (isCustom) {
                                      // Restore previous customType if it exists
                                      formik.setFieldValue(
                                        `emails.${index}.customType`,
                                        row.customType || row.emailType || ""
                                      );
                                    } else {
                                      // Store the current customType before clearing it
                                      formik.setFieldValue(
                                        `emails.${index}.customType`,
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
                                      marginTop: "-17px!important",
                                    },
                                  }}
                                >
                                  {emailTypeOptions.map((type) => (
                                    <MenuItem key={type} value={type}>
                                      {type}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                              <TextField
                                // label={index === 0 ? "Email" : ""}
                                type="email"
                                size="small"
                                fullWidth
                                variant="standard"
                                name={`emails.${index}.email`}
                                value={formik.values.emails[index].email}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={
                                  emailTouched?.email &&
                                  typeof emailError === "object" &&
                                  Boolean(emailError?.email)
                                }
                                helperText={
                                  emailTouched?.email &&
                                  typeof emailError === "object"
                                    ? emailError.email
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
                                    marginTop: "-15px!important",
                                  },
                                  "& .MuiFormLabel-root.MuiInputLabel-root": {
                                    fontSize: "16px !important",
                                    fontWeight: 500,
                                    marginTop: "-22px!important",
                                  },
                                }}
                              />
                              {row.isEditing ? (
                                <Checkbox
                                  title="Set As Primary"
                                  name={`emails.${index}.isPrimary`}
                                  checked={row.isPrimary}
                                  // sx={{ marginTop: "-18px  !important" }}
                                  onChange={() => {
                                    if (!row.isEditing) return; // Only allow changing when in edit mode

                                    const updatedEmails =
                                      formik.values.emails.map((email, i) => ({
                                        ...email,
                                        isPrimary: i === index, // Set only the clicked one to true, others to false
                                      }));

                                    formik.setValues({
                                      emails: updatedEmails,
                                    });
                                  }}
                                  disabled={!row.isEditing}
                                />
                              ) : (
                                <Stack
                                  sx={{
                                    width: "2%",
                                    marginTop: "8px !important",
                                  }}
                                  direction="row"
                                >
                                  {row.isPrimary && (
                                    <Done
                                      sx={{ color: "green", fontSize: 20 }}
                                      titleAccess="Primary Email"
                                    />
                                  )}
                                </Stack>
                              )}
                            </Stack>

                            {row.emailType === "Custom" && (
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
                                  name={`emails.${index}.customType`}
                                  value={
                                    formik.values.emails[index].customType || ""
                                  }
                                  onChange={formik.handleChange}
                                  onBlur={formik.handleBlur} // Trigger validation when user leaves field
                                  onFocus={() =>
                                    formik.setTouched({
                                      ...formik.touched,
                                      emails: formik.touched.emails?.map(
                                        (item, i) =>
                                          i === index
                                            ? { ...item, customType: true }
                                            : item
                                      ),
                                    })
                                  }
                                  error={
                                    emailTouched?.customType &&
                                    typeof emailError === "object" &&
                                    Boolean(emailError?.customType)
                                  }
                                  helperText={
                                    emailTouched?.customType &&
                                    typeof emailError === "object"
                                      ? emailError.customType
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
                            }}
                            direction="row"
                            spacing={2}
                            sx={{ width: "22%" }}
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
                                    row.isEditing ? cancelEdit(index, rows) : ""
                                  }
                                >
                                  {row.isEditing ? <Cancel /> : ""}
                                </IconButton>
                              </>
                            )}
                            {hoveredIndex === index && !row.isEditing && (
                              <>
                                <IconButton
                                  sx={{ marginLeft: 0 }}
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
                        const hasEmptyRow = formik.values.emails.some(
                          (email) => !email.email
                        );
                        if (!hasEmptyRow) {
                          rows.push({
                            id: `temp-${Date.now()}`,
                            email: "",
                            emailType: "Business Email",
                            customType: "",
                            isPrimary: false,
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
                        <Add sx={{fontSize:".9rem !important"}}/>
                      </IconButton>
                      <Typography
                        variant="body1"
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          cursor: "pointer",
                          width: "100%", // Ensures entire text is clickable
                        }}
                      >
                        Add Email
                      </Typography>
                    </Stack>
                  </>
                )}
              </FieldArray>
            </Stack>
          </form>
        </FormikProvider>
        {/* Add the + Icon on the first row */}
      </Grid>
    </Grid>
  );
}
