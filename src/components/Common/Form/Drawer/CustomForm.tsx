"use client";
import { readAccessTokenDataRaw } from '@/utils/accessTokenDataStorage'

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
  FetchReportto,
} from "@/services/api/general_apis/customer-form-data-api";
import { useDebounce } from "react-use";
import { fetchDataBySearch } from "@/services/api/common-erpnext-api/lookup-api";
import { GridExpandMoreIcon } from "@mui/x-data-grid";
import DatePickerField from "../FormFields/DatePickerField";
import LookupField from "../FormFields/LookupField";
import ContactLead from "../FormFields/ContactLeadField";
import RelatedTo from "../FormFields/RelatedToField";
import ReminderField from "../FormFields/ReminderField";
import PickListField from "../FormFields/PickListField";
import StageProbabilityField from "../FormFields/StageProbabilityField";
import AddressField from "../FormFields/AddressField";
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
  btnDisable?: boolean | ((values: any) => boolean);
  fullwidth?: boolean | ((values: any) => boolean);
  loading?: boolean;
  moduleName?: string;
  layoutId?: string;
  /** When true, hides the footer actions (Cancel/Submit). Useful for read-only previews. */
  hideActions?: boolean;
  /** Optional labels for footer actions (used e.g. in Quick Create). */
  cancelLabel?: string;
  submitLabel?: string;
  /** UI tweaks for specific dialog usage (e.g. Quick Create popup). */
  variant?: "default" | "quickCreate";
}

const HiddenField = ({ field, values, handleBlur, errors, touched, setFieldValue, handleFieldChange }: any) => (
  <TextField
    fullWidth
    name={field.name}
    label={field.label}
    value={values[field.name] || field.value}
    onBlur={handleBlur}
    error={touched[field.name] && Boolean(errors[field.name])}
    helperText={touched[field.name] ? errors[field.name] : ""}
    multiline={String(field.type) === "textarea" || String(field.type) === "multiline"}
    rows={String(field.type) === "textarea" || String(field.type) === "multiline" ? 3 : 1}
    onChange={(e) => handleFieldChange(field.name, e.target.value, setFieldValue, values)}
    inputProps={(() => {
      const ft = String(field.type);
      if (ft === "text") return { maxLength: field.max_length ?? 255 };
      if (ft === "number") return { maxLength: (field as any).max_digits ?? 9 };
      if (ft === "longinteger" || ft === "currency") return { maxLength: (field as any).max_digits ?? 18 };
      return undefined;
    })()}
    sx={{ display: "none" }}
  />
);

/**
 * Clamps a raw string value to the allowed decimal places for currency fields.
 * Returns the original value unchanged for non-currency or non-decimal inputs.
 */
const clampDecimalPlaces = (value: string, decimalPlaces: number): string => {
  if (!value.includes('.')) return value;
  const [integer, fraction] = value.split('.');
  return `${integer}.${fraction.slice(0, decimalPlaces)}`;
};

interface FormFieldProps {
  field: FieldConfigNew;
  values: any;
  handleChange: any;
  handleBlur: any;
  setFieldValue: any;
  touched: any;
  errors: any;
  mode?: string;
  editValues?: any;
  dynamicOptions: any;
  handleFieldChange: (field: string, value: any, setFieldValue: any, values: any) => void;
  handleChangeImage: (files: File[], setFieldValue: (field: string, value: any) => void) => void;
  moduleName?: string;
  layoutId?: string;
  onContactLeadTypeChange: (type: string) => void;
  contactLeadType: string;
  relatedToTypes: Record<string, "CRM Organization" | "CRM Deal">;
  onRelatedToTypeChange: (fieldName: string, type: "CRM Organization" | "CRM Deal") => void;
  fields: FieldConfigNew[];
}

const FormField: React.FC<FormFieldProps> = ({
  field,
  values,
  handleChange,
  handleBlur,
  setFieldValue,
  touched,
  errors,
  mode,
  editValues,
  dynamicOptions,
  handleFieldChange,
  handleChangeImage,
  moduleName,
  layoutId,
  onContactLeadTypeChange,
  contactLeadType,
  relatedToTypes,
  onRelatedToTypeChange,
  fields,
}) => {
  const isHidden =
    typeof field.hide === "function" ? field.hide(values) : field.hide === true;

  const [selectedValue, setSelectedValue] = useState(values[field.name] ?? "");
  let [isGroupValue, setIsGroupValue] = useState<any>((values[field.name] != "") ? 1 : 0);
  const autocompleteOptions = dynamicOptions[field.name] || field.options || [];
  const currentValue = autocompleteOptions.find((opt: any) => opt.value === values[field.name]) || null;

  useEffect(() => {
    if (field.type == "switch") {
      setFieldValue("is_group", isGroupValue);
    }
  }, [field.type, isGroupValue]);

  const handleChangeGrp = (_: any, newStatus: string | null) => {
    if (newStatus !== null) {
      setIsGroupValue(newStatus);
      let status = newStatus ? 1 : 0;
      setFieldValue("is_group", status);
    }
  };

  return field.type === "custom" && field.component ? (
    <>
      {!field.showIf || field.showIf(values) ? (
        <>
          {(field.hideInEdit == true && mode == "Edit" && !field?.value) ||
            isHidden ? (null) : field.hideInEdit == true && field?.value != "" ? (
              <HiddenField field={field} values={values} handleBlur={handleBlur} errors={errors} touched={touched} setFieldValue={setFieldValue} handleFieldChange={handleFieldChange} />
            ) : (
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
                if (customer?.value) {
                  setFieldValue(field.name, customer?.value || "");
                  console.log("field.name here", customer?.value);

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
      ) : (null)}
    </>
  ) : field.type === "select" || field.type === "picklist" || String(field.type) === "stage" ? (
    <>
      {console.log("field.type", field.type)}
      {console.log("moduleName", moduleName)}
      {console.log("layoutId", layoutId)}
      {!field.showIf || field.showIf(values) ? (
        <>
          {(field.hideInEdit == true && mode == "Edit" && !field?.value) ||
            isHidden ? (null) : field.hideInEdit == true && field?.value != "" ? (
              <TextField
                fullWidth
                name={field.name}
                label={field.label}
                placeholder={field.placeholder}
                value={values[field.name] || field.value}
                onBlur={handleBlur}
                error={touched[field.name] && Boolean(errors[field.name])}
                helperText={touched[field.name] ? errors[field.name] : ""}
                onChange={(e) => handleFieldChange(field.name, e.target.value, setFieldValue, values)}
                disabled={
                  (field.disable && field.name === "mobile_no" && editValues?.mobile_no) ||
                  (field.disable && field.name === "email_id" && editValues?.email_id)
                }
                sx={{ display: "none" }}
              />
            ) : field.type === "select" && moduleName && layoutId ? (
              <PickListField
                module={moduleName}
                layoutName={layoutId}
                fieldName={field.name}
                label={field.label}
                placeholder={field.placeholder}
                value={values[field.name]}
                parentValue={field.dependsOn ? values[field.dependsOn] : undefined}
                onChange={(val) =>
                  handleFieldChange(field.name, val, setFieldValue, values)
                }
                error={touched[field.name] && Boolean(errors[field.name])}
                helperText={
                  touched[field.name] && typeof errors[field.name] === "string"
                    ? (errors[field.name] as string)
                    : undefined
                }
                disabled={
                  (field.disable && field.name === "mobile_no" && editValues?.mobile_no) ||
                  (field.disable && field.name === "email_id" && editValues?.email_id)
                }
              />
            ) : String(field.type) === "stage" && moduleName && layoutId ? (
              <StageProbabilityField
                module={moduleName}
                layoutName={layoutId}
                fieldName={field.name}
                label={field.label}
                placeholder={field.placeholder}
                value={values[field.name]}
                onChange={(val) => handleFieldChange(field.name, val, setFieldValue, values)}
                error={touched[field.name] && Boolean(errors[field.name])}
                helperText={
                  touched[field.name] && typeof errors[field.name] === "string"
                    ? (errors[field.name] as string)
                    : undefined
                }
                disabled={
                  (field.disable && field.name === "mobile_no" && editValues?.mobile_no) ||
                  (field.disable && field.name === "email_id" && editValues?.email_id)
                }
                setFieldValue={setFieldValue}
                values={values}
              />
            ) : (
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
                {field.options?.map((option: any) => {
                  const isSelected = values[field.name] === option.value;
                  const hasColor = (option as any)?.color;
                  return (
                    <MenuItem
                      key={option.value}
                      value={option.value}
                      sx={
                        hasColor && isSelected
                          ? {
                            bgcolor: (option as any).color,
                            color: '#fff',
                            '&.Mui-selected': {
                              bgcolor: (option as any).color,
                            },
                            '&.Mui-selected:hover': {
                              bgcolor: (option as any).color,
                            },
                          }
                          : undefined
                      }
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        {option.icon ? option.icon : ""}
                        <Typography>{option.label}</Typography>
                      </Stack>
                    </MenuItem>
                  );
                })}
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
      ) : (null)}
    </>
  ) : (field as any).type === "address" ? (
    <>
      {!field.showIf || field.showIf(values) ? (
        <>
          {(field.hideInEdit == true && mode == "Edit" && !field?.value) ||
            isHidden ? null : field.hideInEdit == true && field?.value != "" ? (
              <HiddenField
                field={field}
                values={values}
                handleBlur={handleBlur}
                errors={errors}
                touched={touched}
                setFieldValue={setFieldValue}
                handleFieldChange={handleFieldChange}
              />
            ) : (
            <AddressField
              label={field.label}
              value={values[field.name]}
              onChange={(val) =>
                handleFieldChange(field.name, val, setFieldValue, values)
              }
              disabled={
                typeof field.disable === "function"
                  ? field.disable(values)
                  : field.disable
              }
              error={touched[field.name] && Boolean(errors[field.name])}
              helperText={
                touched[field.name] && typeof errors[field.name] === "string"
                  ? (errors[field.name] as string)
                  : undefined
              }
              addressAvailableFields={field.address_available_fields as any}
            />
          )}
        </>
      ) : null}
    </>
  ) : field.type === "autocomplete" ? (
    <>
      {!field.showIf || field.showIf(values) ? (
        <>
          {(field.hideInEdit == true && mode == "Edit" && !field?.value) ||
            isHidden ? (null) : field.hideInEdit == true && field?.value != "" ? (
              <HiddenField field={field} values={values} handleBlur={handleBlur} errors={errors} touched={touched} setFieldValue={setFieldValue} handleFieldChange={handleFieldChange} />
            ) : (
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
                (field.disable && field.name === "item_group_name" && editValues?.item_group_name === "All Item Groups") ||
                (field.name === "state" && !values.country) ||
                (field.name === "city" && !values.state) ||
                (field.name === "pincode" && !values.city)
              }
            />
          )}
        </>
      ) : (null)}
    </>
  ) : field.type === "checkbox" ? (
    <FormControlLabel
      control={
        <Checkbox
          checked={values[field.name] || false}
          onChange={(e) => setFieldValue(field.name, e.target.checked)}
          onBlur={handleBlur}
          name={field.name}
          disabled={typeof field.disable === "function" ? field.disable(values) : field.disable}
        />
      }
      label={field.label}
    />
  ) : field.type === "switch" ? (
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
                "&:hover": { backgroundColor: isGroupValue === false || isGroupValue === 0 ? "darkred" : "gray !important", color: isGroupValue === false || isGroupValue === 0 ? "white !important" : "black !important" },
              }}
            >
              {field.switchlabels?.[1] ?? "No"}
            </ToggleButton>
          </ToggleButtonGroup>
        </>
      ) : (null)}
    </>
  ) : field.type === "file" ? (
    <>
      {!field.showIf || field.showIf(values) ? (
        <>
        </>
      ) : (null)}
    </>

  ) : field.type === "date" ? (
    <>
      {!field.showIf || field.showIf(values) ? (
        <>
          <DatePickerField name={field?.name} label={field.label} value={values[field.name] || field.value} />
        </>
      ) : (null)}
    </>
  ) : field.type === "datetime" ? (
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
  ) : (field.type as string) === "firstname" ? (
    /* First Name: [Salutation Select] [Text Input] side-by-side */
    <>
      {(!field.showIf || field.showIf(values)) && (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
          <FormControl sx={{ minWidth: 90 }}>
            <InputLabel id={`sal-label-${field.name}`}>Salutation</InputLabel>
            <Select
              labelId={`sal-label-${field.name}`}
              label="Salutation"
              value={values[`${field.name}_salutation`] ?? ""}
              onChange={(e) => setFieldValue(`${field.name}_salutation`, e.target.value)}
              disabled={typeof field.disable === "function" ? field.disable(values) : field.disable}
            >
              {((field as any).salutation_options as string[] ?? ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.']).map((opt: string) => (
                <MenuItem key={opt} value={opt}>{opt}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            name={field.name}
            label={field.label}
            placeholder={field.placeholder}
            value={values[field.name] ?? ""}
            onBlur={handleBlur}
            error={touched[field.name] && Boolean(errors[field.name])}
            helperText={touched[field.name] && typeof errors[field.name] === "string" ? errors[field.name] as string : undefined}
            onChange={(e) => handleFieldChange(field.name, e.target.value, setFieldValue, values)}
            disabled={typeof field.disable === "function" ? field.disable(values) : field.disable}
            inputProps={{ maxLength: (field as any).max_length ?? 255 }}
          />
        </Box>
      )}
    </>
  ) : field.type === "lookup" ? (
    <>
      {!field.showIf || field.showIf(values) ? (
        <LookupField
          doctype={field.doctype || ""}
          label={field.label}
          placeholder={field.placeholder}
          value={values[field.name]}
          onChange={(val) => setFieldValue(field.name, val)}
          error={touched[field.name] && Boolean(errors[field.name])}
          helperText={touched[field.name] ? (errors[field.name] as string) : ""}
          disabled={typeof field.disable === "function" ? field.disable(values) : field.disable}
          referenceDoctype={field.referenceDoctype}
          filters={field.filters}
          searchFields={field.searchFields || field.search_fields}
          displayFields={field.displayFields || field.display_fields}
        />
      ) : null}
    </>
  ) : String(field.type).toLowerCase() === "contactlead" ? (
    <>
      {!field.showIf || field.showIf(values) ? (
        <ContactLead
          fieldName={field.name}
          doctype={field.doctype || ""}
          referenceDoctype={field.referenceDoctype}
          label={field.label}
          placeholder={field.placeholder}
          value={values[field.name]}
          onChange={(val) => setFieldValue(field.name, val)}
          onTypeChange={onContactLeadTypeChange}
          onRelatedData={(relatedData) => {
            console.log("CustomForm: Received onRelatedData:", relatedData);
            if (relatedData.related_to) {
              const relatedToField = fields.find(
                (f) => String(f.type).toLowerCase() === "relatedto"
              );
              console.log("CustomForm: Found relatedToField:", relatedToField?.name);
              if (relatedToField) {
                setFieldValue(relatedToField.name, relatedData.related_to);
                if (relatedData.related_to_type) {
                  onRelatedToTypeChange(relatedToField.name, relatedData.related_to_type as any);
                }
              }
            }
          }}
          error={touched[field.name] && Boolean(errors[field.name])}
          helperText={touched[field.name] ? (errors[field.name] as string) : ""}
          disabled={typeof field.disable === "function" ? field.disable(values) : field.disable}
          filters={field.filters}
          searchFields={field.searchFields || field.search_fields}
          displayFields={field.displayFields || field.display_fields}
        />
      ) : null}
    </>
  ) : String(field.type).toLowerCase() === "relatedto" ? (
    <>
      {!field.showIf || field.showIf(values) ? (
        <RelatedTo
          fieldName={field.name}
          doctype={field.doctype || ""}
          referenceDoctype={field.referenceDoctype}
          label={field.label}
          placeholder={field.placeholder}
          value={values[field.name]}
          type={relatedToTypes[field.name]}
          onTypeChange={(type) => onRelatedToTypeChange(field.name, type)}
          onChange={(val) => setFieldValue(field.name, val)}
          error={touched[field.name] && Boolean(errors[field.name])}
          helperText={touched[field.name] ? (errors[field.name] as string) : ""}
          disabled={
            (typeof field.disable === "function" ? field.disable(values) : field.disable) ||
            contactLeadType !== "Contact"
          }
          filters={field.filters}
          searchFields={field.searchFields || field.search_fields}
          displayFields={field.displayFields || field.display_fields}
        />
      ) : null}
    </>
  ) : String(field.type).toLowerCase() === "reminder" ? (
    <>
      {!field.showIf || field.showIf(values) ? (
        <ReminderField
          fieldName={field.name}
          label={field.label}
          placeholder={field.placeholder}
          value={values[field.name]}
          onChange={(val) => setFieldValue(field.name, val)}
          error={touched[field.name] && Boolean(errors[field.name])}
          helperText={touched[field.name] ? (errors[field.name] as string) : ""}
          disabled={typeof field.disable === "function" ? field.disable(values) : field.disable}
          filters={field.filters}
          searchFields={field.searchFields || field.search_fields}
          displayFields={field.displayFields || field.display_fields}
        />
      ) : null}
    </>
  ) : (
    <>
      {(field.hideInEdit == true && mode == "Edit" && !field?.value) ||
        isHidden ? (null) : field.hideInEdit == true && field?.value != "" ? (

          <TextField
            fullWidth
            name={field.name}
            label={field.label}
            placeholder={field.placeholder}
            value={values[field.name] || field.value}
            onBlur={handleBlur}
            error={touched[field.name] && Boolean(errors[field.name])}
            helperText={touched[field.name] ? errors[field.name] : ""}
            multiline={String(field.type) === "textarea" || String(field.type) === "multiline"}
            rows={String(field.type) === "textarea" || String(field.type) === "multiline" ? 3 : 1}
            onChange={(e) => {
              const ft = field.type as string;
              let val = e.target.value;
              if (ft === "currency") {
                const dp: number = (field as any).decimal_places ?? 2;
                val = clampDecimalPlaces(val, dp);
              }
              handleFieldChange(field.name, val, setFieldValue, values);
            }}
            disabled={
              (field.disable && typeof field.disable === "function" ? field.disable(values) : field.disable)
            }
            inputProps={(() => {
              const ft = field.type as string;
              if (ft === "text") return { maxLength: (field as any).max_length ?? 255 };
              if (ft === "number") return { maxLength: (field as any).max_digits ?? 9 };
              if (ft === "longinteger" || ft === "currency") return { maxLength: (field as any).max_digits ?? 18 };
              return undefined;
            })()}
            sx={{ display: "none" }}
          />
        ) : (
        <>
          {!field.showIf || field.showIf(values) ? (
            <TextField
              fullWidth
              name={field.name}
              label={field.label}
              placeholder={field.placeholder}
              value={values[field.name]}
              onBlur={handleBlur}
              error={touched[field.name] && Boolean(errors[field.name])}
              helperText={
                touched[field.name] && typeof errors[field.name] === "string"
                  ? (errors[field.name] as string)
                  : undefined
              }
              multiline={String(field.type) === "textarea" || String(field.type) === "multiline"}
              rows={String(field.type) === "textarea" || String(field.type) === "multiline" ? 3 : 1}
              onChange={(e) => {
                const ft = field.type as string;
                let val = e.target.value;
                if (ft === "currency") {
                  const dp: number = (field as any).decimal_places ?? 2;
                  val = clampDecimalPlaces(val, dp);
                }
                handleFieldChange(field.name, val, setFieldValue, values);
              }}
              disabled={
                (field.disable && typeof field.disable === "function" ? field.disable(values) : field.disable)
              }
              inputProps={(() => {
                const ft = field.type as string;
                if (ft === "text") return { maxLength: (field as any).max_length ?? 255 };
                if (ft === "number") return { maxLength: (field as any).max_digits ?? 9 };
                if (ft === "longinteger" || ft === "currency") return { maxLength: (field as any).max_digits ?? 18 };
                return undefined;
              })()}
            />
          ) : null}
        </>
      )}
    </>
  );
};

const CustomForm: React.FC<CustomFormProps> = ({
  fields,
  initialValues,
  onClose,
  onSubmit,
  editValues = {},
  mode,
  onFieldChange,
  btnDisable,
  loading,
  moduleName,
  layoutId,
  hideActions,
  cancelLabel = "Cancel",
  submitLabel = "Submit",
  variant = "default",
}) => {
  const [contactLeadType, setContactLeadType] = useState<string>("Contact");
  const [relatedToTypes, setRelatedToTypes] = useState<Record<string, "CRM Organization" | "CRM Deal">>({});
  const isQuickCreate = variant === "quickCreate";
  const formInitialValues = { ...initialValues, ...editValues }; // Merge default & edit values

  fields.forEach(field => {
    if (field.value !== "" && field.value !== undefined) {
      formInitialValues[field.name] = field.value;
    }
  });
  console.log("formInitialValues", formInitialValues);
  console.log("formInitialValues fields", fields);

  const groupedFields = fields.reduce(
    (acc, field) => {
      console.log(field.name, 'field hide', field.hide)

      // const sectiontype = field.sectiontype || "";
      const section = field.section || "";
      acc[section] = acc[section] || [];
      // acc[sectiontype] = acc[sectiontype] || [];
      // acc[sectiontype].push(field);
      // Only exclude fields that are statically hidden (hide === true).
      // If hide is a function, visibility may change with Formik values.
      const isStaticallyHidden = typeof field.hide === "function" ? false : field.hide === true;
      if (!isStaticallyHidden) {
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
      readAccessTokenDataRaw()
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

  const fetchusers = async (role_profile_name: string) => {
    const result = await FetchReportto(role_profile_name, userToken?.access_token);
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
      // if (editValues?.role_profile_name) {
      //   const reporttouser = await fetchusers(edit.role_profile_name)
      //   setDynamicOptions((prev) => ({ ...prev, report_to: reporttouser }));
      // }
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
    console.log(fieldName, 'handleFieldChange', value, values)

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

    if (fieldName === "role_profile_name") {
      if (value) {
        const reporttouser = await fetchusers(decodeURIComponent(value))
        setDynamicOptions((prev) => ({ ...prev, report_to: reporttouser }));
      } else {
        setDynamicOptions((prev) => ({ ...prev, report_to: [] }));
      }
      setFieldValue("report_to", "");
    }
  };



  const handleChangeImage = async (
    files: File[],
    setFieldValue: (field: string, value: any) => void
  ) => {
    const file = files[0];
    if (file) {
      console.log("filefilefile", file);

      setFieldValue('image', file); // Pass real File object, not blob URL
    }
  };


  console.log("editValues", editValues);

  console.log("editValues", editValues);

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
        <Form
          style={
            isQuickCreate
              ? { display: "flex", flexDirection: "column", height: "auto" }
              : undefined
          }
        >
          <SyncTypeStates
            contactLeadType={contactLeadType}
            relatedToTypes={relatedToTypes}
            setFieldValue={setFieldValue}
            values={values}
          />
          <Box
            sx={{
              flexGrow: isQuickCreate ? 0 : 1,
              overflowY: isQuickCreate ? "visible" : "auto",
              padding: isQuickCreate ? 2 : 2,
              height: isQuickCreate ? "auto" : "100%",
              minHeight: 0,
            }}
          >
            <Grid container spacing={isQuickCreate ? 2 : 6} p={isQuickCreate ? 2 : 5} key={110}>
              {Object.entries(groupedFields).map(([section, fields]) => {
                const isFieldVisible = (field: FieldConfigNew) => {
                  // Respect showIf
                  if (field.showIf && !field.showIf(values)) return false;

                  // Respect dynamic/static hide
                  const isHidden =
                    typeof field.hide === "function" ? field.hide(values) : field.hide === true;
                  if (isHidden) return false;

                  // Mirror FormField null-branch for hideInEdit (Edit mode + empty value)
                  if (field.hideInEdit == true && mode == "Edit" && !field?.value) return false;

                  return true;
                };

                const visibleFields = fields.filter(isFieldVisible);

                const isAccordion = visibleFields.some(
                  (field) =>
                    typeof field?.sectiontype === "function"
                      ? field.sectiontype(values)
                      : field.sectiontype === "Accoridon"
                );
                const issection = visibleFields.some(
                  (field) =>
                    typeof field?.sectiontype === "function" ? field.sectiontype(values) : field.section
                );
                const hasFields = visibleFields.length > 0;
                // Derive column count from section metadata (default: 2 columns)
                const sectionColCount = fields[0]?.section_column_count ?? 2;
                const isSingleCol = sectionColCount === 1;

                // Compute xs breakpoint for each field directly:
                // single-column section → xs=12 (full width, always)
                // double-column section → xs=6 (half) unless field.fullwidth forces full width
                const getFieldXs = (field: FieldConfigNew): 6 | 12 => {
                  if (isSingleCol) return 12;
                  const fw = typeof field.fullwidth === "function" ? field.fullwidth(values) : field.fullwidth;
                  return fw ? 12 : 6;
                };

                // Shared field renderer used in both accordion and regular section
                const renderFields = () =>
                  isSingleCol ? (
                    // Single-column: Stack ensures every field is full width, no grid math
                    <Stack
                      direction="column"
                      spacing={isQuickCreate ? 2 : 3}
                      sx={{ pt: isQuickCreate ? 0 : "20px", pl: isQuickCreate ? 0 : "10px" }}
                    >
                      {visibleFields.map((field) => (
                        <Box key={field.name} sx={{ width: "100%" }}>
                          <FormField
                            field={field}
                            values={values}
                            handleChange={handleChange}
                            handleBlur={handleBlur}
                            setFieldValue={setFieldValue}
                            touched={touched}
                            errors={errors}
                            mode={mode}
                            editValues={editValues}
                            dynamicOptions={dynamicOptions}
                            handleFieldChange={handleFieldChange}
                            handleChangeImage={handleChangeImage}
                            moduleName={moduleName}
                            layoutId={layoutId}
                            onContactLeadTypeChange={(type) => {
                              setContactLeadType(type);
                              setFieldValue("_contactLeadType", type);
                            }}
                            contactLeadType={contactLeadType}
                            relatedToTypes={relatedToTypes}
                            onRelatedToTypeChange={(name, type) => {
                              setRelatedToTypes((prev) => {
                                const next = { ...prev, [name]: type };
                                setFieldValue("_relatedToTypes", next);
                                return next;
                              });
                            }}
                            fields={fields}
                          />
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    // Double-column: Grid with xs=6 per field (fullwidth fields span all 12)
                    <Grid
                      container
                      spacing={6}
                      sx={{ paddingTop: "20px", paddingLeft: "10px" }}
                    >
                      {visibleFields.map((field) => (
                        <Grid item xs={getFieldXs(field)} key={field.name}>
                          <FormField
                            field={field}
                            values={values}
                            handleChange={handleChange}
                            handleBlur={handleBlur}
                            setFieldValue={setFieldValue}
                            touched={touched}
                            errors={errors}
                            mode={mode}
                            editValues={editValues}
                            dynamicOptions={dynamicOptions}
                            handleFieldChange={handleFieldChange}
                            handleChangeImage={handleChangeImage}
                            moduleName={moduleName}
                            layoutId={layoutId}
                            onContactLeadTypeChange={(type) => {
                              setContactLeadType(type);
                              setFieldValue("_contactLeadType", type);
                            }}
                            contactLeadType={contactLeadType}
                            relatedToTypes={relatedToTypes}
                            onRelatedToTypeChange={(name, type) => {
                              setRelatedToTypes((prev) => {
                                const next = { ...prev, [name]: type };
                                setFieldValue("_relatedToTypes", next);
                                return next;
                              });
                            }}
                            fields={fields}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  );

                return (
                  hasFields ? (
                    isAccordion ? (
                      <Grid item xs={12} key={section}>
                        <Accordion>
                          <AccordionSummary
                            expandIcon={<GridExpandMoreIcon />}
                            aria-controls="panel2-content"
                            id="panel2-header"
                          >
                            <Typography component="span">{section}</Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            {renderFields()}
                          </AccordionDetails>
                        </Accordion>
                      </Grid>
                    ) : (
                      <Grid item xs={12} key={section}>
                        {section && issection && <Typography variant="h6">{section}</Typography>}
                        {renderFields()}
                      </Grid>
                    )
                  ) : null
                );
              })}
            </Grid>
          </Box>

          {!hideActions && (
            <Box
              sx={{
                position: isQuickCreate ? "static" : "sticky",
                bottom: isQuickCreate ? undefined : 0,
                width: "100%",
                display: "flex",
                justifyContent: "flex-end",
                mt: 0,
                padding: isQuickCreate ? 2 : 2,
                borderTop: isQuickCreate ? "1px solid #ccc" : "1px solid #ccc",
                background: "var(--mui-palette-background-paper)",
                zIndex: 1100,
              }}
            >
              <Button onClick={onClose} color="secondary">
                {cancelLabel}
              </Button>
              {typeof btnDisable === 'function' ? btnDisable(values) : btnDisable}
              <Button
                color="primary"
                type="submit"
                variant="contained"
                sx={{ ml: 2 }}
                disabled={typeof btnDisable === 'function' ? btnDisable(values) : btnDisable}
              >
                {submitLabel}
              </Button>
            </Box>
          )}
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

/**
 * Helper component to sync local state types to Formik values
 * without triggering infinite re-renders.
 */
const SyncTypeStates = ({ contactLeadType, relatedToTypes, setFieldValue, values }: any) => {
  useEffect(() => {
    if (values._contactLeadType !== contactLeadType) {
      setFieldValue("_contactLeadType", contactLeadType);
    }
    if (JSON.stringify(values._relatedToTypes) !== JSON.stringify(relatedToTypes)) {
      setFieldValue("_relatedToTypes", relatedToTypes);
    }
  }, [contactLeadType, relatedToTypes, setFieldValue, values._contactLeadType, values._relatedToTypes]);

  return null;
};

export default CustomForm;
