import React, { useEffect, useState } from "react";
import {
  Form as FormikForm,
  useFormik,
  FormikProvider,
  Form,
} from "formik";
import {
  Button,
  TextField,
  Typography,
  IconButton,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Box,
  Drawer,
} from "@mui/material";
import { showToast } from "@/components/ToastNotificationNew";
import CloseIcon from "@mui/icons-material/Close";
import {
  createAdress,
  editAddress,
} from "@/services/api/customer-api/create-address";
import { addressValidation } from "@/validation/addressValidation";
import LocationSelect from "@/components/Common/LocationSelect";
import AddresssForm from "@/components/Common/AddressForm";

interface FormValueType {
  address_title: string;
  address_line1: string;
  address_line2: string;
  address_type: string;
  country: string;
  state: string;
  city: string;
  pincode: string;
  territory: string;
}

const formInitialValues: FormValueType = {
  address_title: "",
  address_line1: "",
  address_line2: "",
  address_type: "",
  country: "",
  state: "",
  city: "",
  pincode: "",
  territory: "",
};

interface AddEditCustomerDrawerProps {
  link_name: string;
  link_doctype: string;
  initialValues: FormValueType;
  open: boolean;
  onClose: () => void;
  operation: string;
  onSubmit?: () => void;
  loadData?: () => void;
}

export default function AddEditAddressDrawer({
  link_name,
  link_doctype,
  initialValues,
  open,
  onClose,
  operation,
  onSubmit,
  loadData,
}: AddEditCustomerDrawerProps) {
  useEffect(() => {
    if (Object.keys(initialValues).length > 0) {
      const mergedValues: FormValueType = {
        ...initialValues, // Override with actual data
        // email_id: initialValues.email_id ?? "", // Convert null to ""
        // mobile_no: initialValues.mobile_no ?? "", // Convert null to ""
      };
      formik.setValues(mergedValues);
    } else {
      formik.setValues(formInitialValues);
    }
  }, [initialValues]);

  const [userToken, setUserToken] = useState<any>(() => {
    const initialValue = JSON.parse(
      localStorage.getItem("AccessTokenData") || "{}"
    );
    return initialValue || "";
  });


  // Handle form submission
  const handleSave = () => {
    console.log("New User Data:");
    // Add your API call here to save the user
    onClose(); // Close the popup after saving
  };

  const formik = useFormik({
    initialValues: formInitialValues || initialValues,
    validationSchema: addressValidation,
    enableReinitialize: true,
    isInitialValid: true,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: async (values, action) => {
      // alert(JSON.stringify(values, null, 2));
      const requestParams = {
        value: { ...values },
        token: userToken?.access_token,
      };

      handlesubmit(values, action);
    },
  });

  const handlesubmit: any = async (values, action) => {
    // if(!Boolean(formik.errors.custom_error))
    if (formik.isValid) {
      const formData = new FormData();
      Object.keys(values).forEach(function (key) {
        console.log(key, "============", values[key]);

        formData.append(key, values[key]);
      });
      // formData.append("link_name", link_name);
      // formData.append("link_doctype", link_doctype);

      console.log("values form Data", values);
      // return false;
      if (operation == "New") {
        action.resetForm();
        createContact(formData);
      } else if (operation == "Edit") {
        editContact(formData);
      }
      // action.resetForm();
      onClose();
      // alert(JSON.stringify(values))
      action.setSubmitting(false);
    }
    // }
  };

  const createContact = async (formData) => {
    console.log("formData HERE ", formData);

    let customerApiRes: any = await createAdress(
      formData,
      userToken?.access_token,
      [{ link_doctype: link_doctype, link_name: link_name }]
    );
    console.log("customerApiRes==>", customerApiRes);
    // showToast(customerApiRes?.message, "success");

    if (customerApiRes?.success) {
      showToast(customerApiRes?.message, "success");
      setTimeout(() => {
        onSubmit ? onSubmit() : location.reload(); 
        onClose();
      }, 1000);
      // loadData();
      // router.push("/customers/detail/" + formData.get("customer_name"));
    } else showToast(customerApiRes?.message, "warning");

    if (customerApiRes?.error) showToast(customerApiRes?.error, "error");
  };

  const editContact = async (formData) => {
    console.log("formData edit", formData);

    let customerApiRes: any = await editAddress(
      formData.get("name"),
      formData,
      userToken?.access_token
    );
    console.log(
      "formData edit customerApiRes",
      customerApiRes?.data?.updatedCustomer?.data?.data?.name
    );

    if (customerApiRes?.success) {
      showToast(customerApiRes?.message, "success");
      setTimeout(() => {
        onSubmit ? onSubmit() : location.reload(); 
        onClose();
      }, 1000);
    } else showToast(customerApiRes?.message, "warning");
    if (customerApiRes?.error) showToast(customerApiRes?.error, "error");
  };

  return (
    <Drawer
      anchor="right"
      variant="persistent"
      open={open}
      onClose={onClose}
      sx={{
        "& .MuiDrawer-paper": {
          width: 900,
          // paddingTop: "72px",
          zIndex: 1300, // Set custom z-index
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          "& .MuiDrawer-paper": {
            height: "100vh", // Ensure drawer content also takes full height
          },
        },
        backgroundColor: "rgba(0, 0, 0, 0.3)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 2,
          borderBottom: "1px solid #ccc",
          position: "sticky",
          top: 0,
          zIndex: 1100,
          backgroundColor: "var(--mui-palette-background-default)",
          marginBottom: "25px",
          paddingLeft: 6,
        }}
      >
        <Typography variant="h5">
          <label>{operation}</label> Address
        </Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      <FormikProvider value={formik}>
        <Form>
        <AddresssForm values={formik.values} setFieldValue={formik.setFieldValue} errors={formik.errors} touched={formik.touched} handleChange={formik.handleChange} handleBlur={formik.handleBlur} onClose={onClose}  />
        <Box
            sx={{
              position: "sticky",
              bottom: 0,
              width: "100%",
              display: "flex",
              justifyContent: "flex-end",
              padding: 2,
              borderTop: "1px solid #ccc",
              background: "var(--mui-palette-background-paper)",
              zIndex: 1100,
            }}
             
          >
            <Button onClick={onClose} color="secondary">
              Cancel
            </Button>
            <Button
              color="primary"
              type="submit"
              variant="contained"
              sx={{ ml: 2 }}
            >
              Submit
            </Button>
          </Box>
        </Form>
      </FormikProvider>
    </Drawer>
  );
}
