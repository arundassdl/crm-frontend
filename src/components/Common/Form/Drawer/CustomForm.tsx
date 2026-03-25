"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Grid,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Checkbox,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
  Backdrop,
  Stack,
} from "@mui/material";
import { styled } from '@mui/material/styles'
import { Autocomplete } from "@mui/lab";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { FieldConfigNew, getValidationSchema } from "../validationSchema";
import {
  FetchCitiesForAddressForm,
  FetchPostalCodeByStateCity,
  FetchStateForCountry,
} from "@/services/api/general_apis/customer-form-data-api";
import { useDebounce } from "react-use";
import { fetchDataBySearch } from "@/services/api/common-erpnext-api/listing-api-get";
import { GridExpandMoreIcon } from "@mui/x-data-grid";
import DatePickerField from "../FormFields/DatePickerField";
// import { DropzoneArea } from 'react-mui-dropzone';
// import CustomDropzone from "../../CustomDropzone";

interface CustomFormProps {
  fields: FieldConfigNew[];
  initialValues: any;
  onClose: () => void;
  onSubmit: (values: any, action: any) => void;
  editValues?: any;
  mode?: string;
  onFieldChange?: (name: any, value: any) => void;
  btnDisable?:boolean | ((values: any) => boolean); 
  fullwidth?:boolean | ((values: any) => boolean); 
  loading?:boolean;
}

const CustomForm: React.FC<CustomFormProps> = ({
  fields,
  initialValues,
  onClose,
  onSubmit,
  editValues = {},
  mode,
  onFieldChange,
  btnDisable,
  loading
}) => {
  const formInitialValues = { ...initialValues, ...editValues }; // Merge default & edit values
 
  fields.forEach(field => {
    if (field.value !== "" && field.value !== undefined ) {
      formInitialValues[field.name] = field.value;
    }
  });
  console.log("formInitialValues",formInitialValues);
  console.log("formInitialValues fields",fields);

  const groupedFields = fields.reduce(
    (acc, field) => {
      // const sectiontype = field.sectiontype || "";
      const section = field.section || "";
      acc[section] = acc[section] || [];
      // acc[sectiontype] = acc[sectiontype] || [];
      // acc[sectiontype].push(field);
      if (field.hide  && field.hide !== undefined ) {
        console.log('dont push');
      } else {
        acc[section].push(field);
      }
      
      return acc;
    },
    {} as Record<string, FieldConfigNew[]>
  );

  const validationSchemaNew = getValidationSchema(fields);


  const [dynamicOptions, setDynamicOptions] = React.useState<{
    [key: string]: { label: string; value: string }[];
  }>({});
  const [userToken, setUserToken] = useState<any>(() => {
    const initialValue = JSON.parse(
      localStorage.getItem("AccessTokenData") || "{}"
    );
    return initialValue || "";
  });

  // const StyledDropzoneArea = styled(DropzoneArea)(({ theme }) => ({
  //   '.MuiDropzoneArea-textContainer': {
  //     paddingTop: '80px', // Custom padding for the text container
  //   },
  // }));
  
  

  const fetchStates = async (country: string) => {
    const result = await FetchStateForCountry(country, userToken?.access_token);
    if (result?.length > 0) {
      const data = result.map((item: any) => ({
        value: item.name,
        label: item.name,
      }));
      return data;
    } else {
      return [];
    }
  };

  const fetchCities = async (state: string) => {
    const result = await FetchCitiesForAddressForm(
      state,
      userToken?.access_token
    );
    if (result?.length > 0) {
      const data = result.map((item: any) => ({
        value: item.name,
        label: item.name,
      }));
      return data;
    } else {
      return [];
    }
  };

  const fetchPincodes = async (state: string, city: string) => {
    if (!state || !city) return []; // Prevent API call if state/city is empty
    try {
      const result = await FetchPostalCodeByStateCity(
        state,
        city,
        userToken?.access_token
      );
      return (
        result?.map((item: any) => ({
          value: item.label,
          label: item.label,
        })) || []
      );
    } catch (error) {
      console.error("Error fetching pincodes:", error);
      return [];
    }
  };

  useEffect(() => {
    console.log("editValues", editValues);

  }, [editValues]);
  
  useEffect(() => {
    console.log("editValues", editValues);

    const loadInitialDependentData = async () => {
      if (editValues?.country) {
        const states = await fetchStates(editValues.country);
        setDynamicOptions((prev) => ({ ...prev, state: states }));
      }

      if (editValues?.state) {
        const cities = await fetchCities(editValues.state);
        setDynamicOptions((prev) => ({ ...prev, city: cities }));
      }

      if (editValues?.state && editValues?.city) {
        const pincodes = await fetchPincodes(editValues.state, editValues.city);
        setDynamicOptions((prev) => ({ ...prev, pincode: pincodes }));
      }
    };

    loadInitialDependentData();
  }, [editValues]);

  const changeFieldValue = async (
    fieldName: string,
    value: string,
    setFieldValue: any,
  ) => {
    setFieldValue(fieldName, value);
  }
  const handleFieldChange = async (
    fieldName: string,
    value: string,
    setFieldValue: any,
    values: any
  ) => {
    setFieldValue(fieldName, value);

    if (fieldName === "country") {
      if (value) {
        const states = await fetchStates(value);
        setDynamicOptions((prev) => ({ ...prev, state: states }));
      } else {
        setDynamicOptions((prev) => ({
          ...prev,
          state: [],
          city: [],
          pincode: [],
        }));
      }
      setFieldValue("state", "");
      setFieldValue("city", "");
      setFieldValue("pincode", "");
    }

    if (fieldName === "state") {
      if (value) {
        const cities = await fetchCities(value);
        setDynamicOptions((prev) => ({ ...prev, city: cities }));
      } else {
        setDynamicOptions((prev) => ({ ...prev, city: [], pincode: [] }));
      }
      setFieldValue("city", "");
      setFieldValue("pincode", "");
    }

    if (fieldName === "city") {
      if (value) {
        const pincodes = await fetchPincodes(values.state, value);
        setDynamicOptions((prev) => ({ ...prev, pincode: pincodes }));
      } else {
        setDynamicOptions((prev) => ({ ...prev, pincode: [] }));
      }
      setFieldValue("pincode", "");
    }
  };
 
 

  const handleChangeImage = async (
    files: File[],
    setFieldValue: (field: string, value: any) => void
  ) => {
    const file = files[0];
    if (file) {
      console.log("filefilefile",file);
      
      setFieldValue('image', file); // Pass real File object, not blob URL
    }
  };


  console.log("editValues", editValues);

  const isFieldVisible = (field, mode, values) => {
    if (field.hide) return false;
    if (field.hideInEdit && mode === "Edit" && !field?.value) return false;
    if (field.hideInEdit && mode === "Edit" && field?.value !== "") return false;
    if (field.showIf && !field.showIf(values)) return false;
    return true;
  };
  const renderHiddenField = (field, values, handleBlur, errors, touched, setFieldValue) => (
    <TextField
      fullWidth
      name={field.name}
      label={field.label}
      value={values[field.name] || field.value}
      onBlur={handleBlur}
      error={touched[field.name] && Boolean(errors[field.name])}
      helperText={touched[field.name] ? errors[field.name] : ""}
      multiline={field.type === "textarea"}
      rows={field.type === "textarea" ? 3 : 1}
      onChange={(e) => handleFieldChange(field.name, e.target.value, setFieldValue, values)}
      sx={{ display: "none" }}
    />
  );

  
  const renderFormField = (
    field,
    values,
    handleChange,
    handleBlur,
    setFieldValue,
    touched,
    errors
  ) => {
    const [selectedValue, setSelectedValue] = useState(values[field.name] ?? "");
    let [isGroupValue, setIsGroupValue] = useState<any>((values[field.name]!="")?1:0);
    const autocompleteOptions = dynamicOptions[field.name] || field.options || [];
    const currentValue = autocompleteOptions.find(opt => opt.value === values[field.name]) || null;
    console.log("Formik Errors:", errors);
    console.log("Formik Touched:", touched);
    useEffect(() => {
      if(field.type=="switch"){
        console.log("field.type", isGroupValue);
        setFieldValue("is_group", isGroupValue);
      }
    }, [field.type,isGroupValue]);
  
    const handleChangeGrp = (_: any, newStatus: string | null) => {
      if (newStatus !== null) {
        setIsGroupValue(newStatus);
        let status = newStatus?1:0;
        setFieldValue("is_group", status);
      }
    };

    return field.type === "custom" && field.component ? (
      <> 
      {!field.showIf || field.showIf(values) ? (
        <>    
        {(field.hideInEdit == true && mode == "Edit" && !field?.value) ||
        field.hide == true ? (null) : field.hideInEdit == true && field?.value!="" ?(
          renderHiddenField(field, values, handleBlur, errors, touched, setFieldValue)
        ):(
          <field.component
            {...field.componentProps} //  Pass additional props
            value={values[field.name]} //  Bind to Formik field value
            onCustomerSelect={(customer: any) => {
              console.log("selected cus value11122", customer);
              
              
              if (customer && typeof customer === "object") {
                setFieldValue('customer_name', customer.name);
                setFieldValue('customer_address_line1', customer.addresses?.address_line1);
                setFieldValue('customer_emailid', customer?.email || customer.addresses?.email);
                setFieldValue('customer_phonenumber', customer?.phone || customer.addresses?.phone);
                setFieldValue('customer_state', customer.addresses?.state);
                setFieldValue('customer_city', customer.addresses?.city);
                setFieldValue('customer_pincode', customer.addresses?.pincode);  
              }
              if(customer?.value){
                setFieldValue(field.name, customer?.value || "");
                console.log("field.name here",customer?.value);
                
                if (field.componentProps?.onCustomerSelect) {
                  field.componentProps.onCustomerSelect(customer); //  Call additional logic if provided
                }             
              }
            }} // Handle value update
            error={touched[field.name] && Boolean(errors[field.name])} //  Pass error
            helperText={touched[field.name] ? errors[field.name] : ""}
          />
        )}
      </>
       ):(null)}
       </>
    ) : field.type === "select" ? (
      <>
      {!field.showIf || field.showIf(values) ? (
        <>  
        {(field.hideInEdit == true && mode == "Edit" && !field?.value) ||
        field.hide == true ? (null) : field.hideInEdit == true && field?.value!=""  ?(
          <TextField
            fullWidth
            name={field.name}
            label={field.label}
            placeholder={field.placeholder}
            value={values[field.name] || field.value}
            onBlur={handleBlur}
            error={touched[field.name] && Boolean(errors[field.name])}
            helperText={touched[field.name] ? errors[field.name] : ""}
            multiline={field.type === "textarea"}
            rows={field.type === "textarea" ? 3 : 1}
            onChange={(e) => handleFieldChange(field.name, e.target.value, setFieldValue, values)}
            disabled={
              (field.disable && field.name === "mobile_no" && editValues?.mobile_no) ||
              (field.disable && field.name === "email_id" && editValues?.email_id)
            }
            sx={{display:"none"}}
          />
        ): (
          <FormControl
            fullWidth
            error={touched[field.name] && Boolean(errors[field.name])}
          >
            <InputLabel id={field.name}>{field.label}</InputLabel>
            <Select
              labelId={field.name}
              name={field.name}
              value={values[field.name]}
              onChange={handleChange}
             
              onBlur={handleBlur}
              label={field.label}
            >
              {field.options?.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {/* {option.label} */}
                    <Stack direction="row" spacing={1} alignItems="center">
                        {(option.icon)?option.icon:""}
                        <Typography>{option.label}</Typography>
                    </Stack>
                </MenuItem>
              ))}
            </Select>
            {touched[field.name] && errors[field.name] && (
              <FormHelperText>
                {touched[field.name] && typeof errors[field.name] === "string"
                  ? (errors[field.name] as string)
                  : undefined}
              </FormHelperText>
            )}
          </FormControl>
        )}
      </>
       ):(null)}
       </>
    ) : field.type === "autocomplete" ? (
      <>
      {!field.showIf || field.showIf(values) ? (
        <>
        {(field.hideInEdit == true && mode == "Edit" && !field?.value) ||
        field.hide == true ? (null) : field.hideInEdit == true && field?.value!="" ?(
          renderHiddenField(field, values, handleBlur, errors, touched, setFieldValue)            
        ): (
          <Autocomplete
          options={autocompleteOptions}
          getOptionLabel={(option) => option.label}
          value={currentValue}            
          onChange={(event, newValue) =>
              handleFieldChange(
                field.name,
                newValue?.value || "",
                setFieldValue,
                values
              )
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label={field.label}
                error={touched[field.name] && Boolean(errors[field.name])}
                helperText={
                  touched[field.name] && typeof errors[field.name] === "string"
                    ? (errors[field.name] as string)
                    : undefined
                }
                fullWidth
              />
            )}
            disabled={
              // (field.name != "country" && field.name != "territory" &&
              //   field.name != "customer_name" &&
              //   !values.country) ||
              (field.disable && field.name === "item_group_name" && editValues?.item_group_name==="All Item Groups") ||
              (field.name === "state" && !values.country) ||
              (field.name === "city" && !values.state) ||
              (field.name === "pincode" && !values.city)
            }
          />
        )}
        </>
      ):(null)}
      </>
    ) : field.type === "checkbox" ? (
      <FormControlLabel
        control={
          <Checkbox
            checked={values[field.name] || false}
            onChange={(e) => setFieldValue(field.name, e.target.checked)}
            onBlur={handleBlur}
            name={field.name}
          />
        }
        label={field.label}
      />
    ): field.type === "switch" ? (
      <>      
     
      {!field.showIf || field.showIf(values) ? (
      <>           
        <Typography>{field.label}</Typography>
          <ToggleButtonGroup
            value={values[field.name] || field.value || isGroupValue}
            exclusive
            onChange={handleChangeGrp}
            sx={{ display: "flex" }}            
          >
            <ToggleButton
              value={true}
              sx={{
                backgroundColor: isGroupValue === true || isGroupValue === 1 ? "green !important" : "lightgray",
                color: isGroupValue === true || isGroupValue === 1 ? "white !important" : "black !important",
                "&:hover": { backgroundColor: isGroupValue === true || isGroupValue === 1 ? "darkgreen !important" : "gray !important" },
              }}
            >

              {field.switchlabels?.[0] ?? "Yes"}

            </ToggleButton>
            <ToggleButton
              value={false}
              sx={{
                backgroundColor: isGroupValue === false || isGroupValue === 0 ? "red  !important" : "lightgray",
                color: isGroupValue === false || isGroupValue === 0 ? "white !important" : "black !important",
                "&:hover": { backgroundColor: isGroupValue === false || isGroupValue === 0 ? "darkred" : "gray !important",color: isGroupValue === false || isGroupValue === 0 ? "white !important" : "black !important" },
              }}
            >
              {field.switchlabels?.[1] ?? "No"}
            </ToggleButton>
          </ToggleButtonGroup>
      </>
            ):(null)}
            </>
    ) : field.type === "file" ? (
      <> 
      {!field.showIf || field.showIf(values) ? (
        <> 
            {/* <DropzoneArea
              key="image"
              acceptedFiles={['image/*']}
              filesLimit={1}
              showPreviews={false}
              showFileNamesInPreview={false}
              onChange={(files: File[]) => {
                handleChangeImage(files, setFieldValue);
              }}              
            /> */}
            {/* <DropzoneArea
            key="image"
            acceptedFiles={['image/*']}
  filesLimit={1}
  showAlerts={false}
  // showPreviewsInDropzone={false}
  showFileNames={false}
  Icon={""}
  dropzoneText={
    <Box className={"classes.customDropZone"} px={16} py={6} display="flex" flexDirection="column" justifyContent="center" alignItems="center" gridGap={4}>      
    <Typography variant="subtitle1">Drop your file here</Typography>
    <Typography>or</Typography>
    <Box mt={2}>
      <Button color="primary" variant="outlined" style={{ width: 125 }}>
        Select File
      </Button>
    </Box>
    <Box mt={1}>
      <Typography>
        Accepted file types: <br />
        <strong>.png, .jpg</strong>
      </Typography>
    </Box>
    <Box mt={1}>
      <Typography>
        Maximum file size: <strong>2MB</strong>
      </Typography>
    </Box>
  </Box>
  }
  maxFileSize={2097152}
  
  onChange={(files: File[]) => {
    handleChangeImage(files, setFieldValue);
  }}   
>                    
</DropzoneArea> */}
{/* <CustomDropzone setFieldValue={setFieldValue}/> */}
{/* <DropzoneArea
  key="image" 
  acceptedFiles={['image/*']}
  filesLimit={1}
  showAlerts={false}
  showFileNames={false}
  dropzoneClass="custom-dropzone"
  dropzoneText={
    <Box
        px={16}
        py={6}
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        gap={2}
      >
        <Typography variant="subtitle1">
          {  "Drop the files here..."  }
        </Typography>
        <Typography>or</Typography>
        <Box mt={2}>
          <Button color="primary" variant="outlined" style={{ width: 125 }}>
            Select File
          </Button>
        </Box>
        <Box mt={1}>
          <Typography>
            Accepted file types: <strong>.png, .jpg</strong>
          </Typography>
        </Box>
        <Box mt={1}>
          <Typography>
            Maximum file size: <strong>2MB</strong>
          </Typography>
        </Box>
      </Box>
  }
  maxFileSize={2097152}
  onChange={(files: File[]) => {
    handleChangeImage(files, setFieldValue);
  }}  
  dropzoneProps={{
    children: ({ isDragActive }) => (
      <Box
        px={16}
        py={6}
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        gap={2}
      >
        <Typography variant="subtitle1">
          {isDragActive ? "Drop the files here..." : "Drop your file here"}
        </Typography>
        <Typography>or</Typography>
        <Box mt={2}>
          <Button color="primary" variant="outlined" style={{ width: 125 }}>
            Select File
          </Button>
        </Box>
        <Box mt={1}>
          <Typography>
            Accepted file types: <strong>.png, .jpg</strong>
          </Typography>
        </Box>
        <Box mt={1}>
          <Typography>
            Maximum file size: <strong>2MB</strong>
          </Typography>
        </Box>
      </Box>
    ),
  }}
/> */}

                </>
            ):(null)}
        </>
                
    ): field.type === "date" ? (
      <>
       <DatePickerField name={field?.name} label={field.label}/>
       </>
    ):  field.type === "datetime" ? (
      <>
       <TextField
          label={field.label}
          type="datetime-local"
          name={field?.name}
          value={values[field.name] || field.value}
          onChange={(e) => handleFieldChange(field.name, e.target.value, setFieldValue, values)}
          InputLabelProps={{ shrink: true }}
          onBlur={handleBlur}
          error={touched[field.name] && Boolean(errors[field.name])}
          helperText={touched[field.name] ? errors[field.name] : ""}
          fullWidth
      />
       </>
    ): (
      <>
        {(field.hideInEdit == true && mode == "Edit" && !field?.value) ||
        field.hide == true ? (null) : field.hideInEdit == true && field?.value!="" ?(
           <TextField
          fullWidth
          name={field.name}
          label={field.label}
          placeholder={field.placeholder}
          value={values[field.name] || field.value}
          onBlur={handleBlur}
          error={touched[field.name] && Boolean(errors[field.name])}
          helperText={touched[field.name] ? errors[field.name] : ""}
          multiline={field.type === "textarea"}
          rows={field.type === "textarea" ? 3 : 1}
          onChange={(e) => handleFieldChange(field.name, e.target.value, setFieldValue, values)}
          disabled={
            (field.disable && field.name === "mobile_no" && editValues?.mobile_no) ||
            (field.disable && field.name === "email_id" && editValues?.email_id) ||
            (field.disable && field.name === "first_name" && editValues?.first_name)
          }
          sx={{display:"none"}}
        />
        ):(
          <>
            {!field.showIf || field.showIf(values) ? (
              <TextField
                fullWidth
                name={field.name}
                label={field.label}
                placeholder={field.placeholder}
                value={values[field.name]}
                // onChange={handleChange}
                onBlur={handleBlur}
                error={touched[field.name] && Boolean(errors[field.name])}
                helperText={
                  touched[field.name] && typeof errors[field.name] === "string"
                    ? (errors[field.name] as string)
                    : undefined
                }
                multiline={field.type === "textarea"}
                rows={field.type === "textarea" ? 3 : 1}
                onChange={(e) =>
                  handleFieldChange(
                    field.name,
                    e.target.value,
                    setFieldValue,
                    values
                  )
                }
                disabled={
                  (field.disable && field.name === "item_group_name" && editValues?.item_group_name==="All Item Groups") ||
            (field.disable && field.name === "first_name" && editValues?.first_name) ||
                  field.disable &&
                  field?.name === "mobile_no" &&
                  editValues?.mobile_no
                    ? true
                    : field.disable &&
                        field?.name === "email_id" &&
                        editValues?.email_id
                      ? true
                      : false
                }
              />
            ) : null}
          </>
        )}
      </>
    );
  };

  return (
    <Formik
      initialValues={formInitialValues}
      validationSchema={validationSchemaNew}
      enableReinitialize
      onSubmit={onSubmit}
    >
      {({
        values,
        handleChange,
        handleBlur,
        setFieldValue,
        errors,
        touched,
      }) => (
        
        <Form>
          <Box
            sx={{ flexGrow: 1, overflowY: "auto", padding: 2, height: "100%" }}
          >
            <Grid container spacing={6} p={5} key={110}>
              {Object.entries(groupedFields).map(([section, fields]) => {
                const isAccordion = fields.some(
                  (field) => typeof field?.sectiontype === "function" ? field.sectiontype(values) : field.sectiontype === "Accoridon"
                );
                const issection = fields.some(
                  (field) => typeof field?.sectiontype === "function" ? field.sectiontype(values) : field.section
                );
                // const resolvedSectionType = typeof fields[0]?.sectiontype === "function"
              //   ? fields[0].sectiontype(values) // If it's a function, call it with `values`
              //   : fields[0]?.sectiontype; // Otherwise, just use the string value
              
              // // If sectiontype is a string, it should be "Accordion"
              // const isAccordion = resolvedSectionType === "Accordion";
              const hasFields = fields.length > 0;

                return (
                  hasFields ? (
                    isAccordion ? (
                  <Grid item xs={12} sm={12}>
                    <Accordion>
                      <AccordionSummary
                        expandIcon={<GridExpandMoreIcon />}
                        aria-controls="panel2-content"
                        id="panel2-header"
                      >
                        <Typography component="span">{section}</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid
                          container
                          spacing={6}
                          sx={{ paddingTop: "20px", paddingLeft: "10px" }}
                        >
                          {fields.map((field) => (
                            <Grid item xs={12} sm={field.fullwidth?12:6} key={field.name}>
                              {renderFormField(
                                field,
                                values,
                                handleChange,
                                handleBlur,
                                setFieldValue,
                                touched,
                                errors
                              )}
                            </Grid>
                          ))}
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  </Grid>
                ) : (
                  <Grid item xs={12} key={section}>
                    {section && issection && <Typography variant="h6">{section}</Typography>}
                    <Grid
                      container
                      spacing={6}
                      sx={{ paddingTop: "20px", paddingLeft: "10px" }}
                    >
                      {fields.map((field) => (
                        <Grid item xs={12} sm={field.fullwidth?12:6} key={field.name}>
                          {renderFormField(
                            field,
                            values,
                            handleChange,
                            handleBlur,
                            setFieldValue,
                            touched,
                            errors
                          )}
                        </Grid>
                      ))}
                    </Grid>
                  </Grid>
                )
              ) : null  
            );
              })}
            </Grid>
          </Box>

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
            {typeof btnDisable === 'function' ? btnDisable(values) : btnDisable}
            <Button
              color="primary"
              type="submit"
              variant="contained"
              sx={{ ml: 2 }}
              disabled={typeof btnDisable === 'function' ? btnDisable(values) : btnDisable}
            >
              Submit
            </Button>
          </Box>
          <Backdrop
            sx={{
              color: '#fff',
              zIndex: (theme) => theme.zIndex.drawer + 1,
            }}
            open={!!loading} // Convert `loading` to a boolean
          >
            {mode === "Edit" ? "Updating..." : "Creating..."}
            <CircularProgress color="inherit" />
          </Backdrop>
        </Form>
      )}
    </Formik>
  );
};

export default CustomForm;
