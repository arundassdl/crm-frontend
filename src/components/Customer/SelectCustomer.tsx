import React, { useState, useEffect } from "react";
import {
  Autocomplete,
  TextField,
  CircularProgress,
  Paper,
  Button,
  Typography,
  Box,
  ListSubheader,
} from "@mui/material";
import debounce from "lodash/debounce";
import { fetchCustomerSearch } from "@/services/api/contact-api/manage-customer-api";
import AddEditCustomerPopup from "./AddEditCustomer";
import AdvancedSearchPopup from "./AdvancedSearch";
import { Option } from "@/types/customer";
import { fetchDataBySearch } from "@/services/api/common-erpnext-api/listing-api-get";
// import { useDebounce } from "react-use";

const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

interface CustomerSearchProps {
  value: string; // Bound to Formik's field value
  touched: any; // Formik's touched object
  errors: any; // Formik's errors object
  onCustomerSelect: (customer: Option | null) => void;
}

export default function SelectCustomer({
  value,
  touched,
  errors,
  onCustomerSelect,
}: CustomerSearchProps) {
  const [options, setOptions] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [userToken, setUserToken] = useState<any>(() => {
    const initialValue = JSON.parse(
      localStorage.getItem("AccessTokenData") || "{}"
    );
    return initialValue || "";
  });
  const [selectedValue, setSelectedValue] = useState<any | null>(null); // Selected value for Autocomplete
  const [selectedCusValue, setSelectedCusValue] = useState<any>(null);
  // const [debouncedValue] = useDebounce(inputValue, 500);
  const debouncedValue = useDebounce(inputValue, 1000);

  // Debounced API call
  const fetchOptions = async () => {
    console.log("queryqueryquery", debouncedValue);

    // if (!debouncedValue) return;

    setLoading(true);

    try {
      const response = await fetchDataBySearch(
        debouncedValue,
        "Customer",
        userToken?.access_token
      );      
      setOptions(response);
    } catch (error) {
      console.error("Error fetching options:", error);
    } finally {
      setLoading(false);
    }
  }; // 300ms debounce delay

  useEffect(() => {
    
     if(value!=""){
      setInputValue(value);
      setSelectedValue({ 
        "value": value,
        })
      fetchOptions()
      }
   }, [value]);


  useEffect(() => {
    if (!debouncedValue) {
      setOptions([]);
      return;
    }

    fetchOptions();
  }, [debouncedValue]);

  useEffect(() => {
    console.log("selectedValue=>", selectedValue);

    if (
      selectedValue &&
      !options.find((opt) => opt.value === selectedValue?.value)
    ) {     
      setOptions((prevOptions) => [...prevOptions, selectedValue]); // Add selectedValue if missing
    }
  }, [selectedValue, options]);

  const [open, setOpen] = useState<boolean>(false);

  return (
    <div>
      
      <Autocomplete
        freeSolo
        open={open}
        onOpen={() => {
          setOpen(true);
          fetchOptions();
        }}
        onClose={() => setOpen(false)}
        options={options}
        value={selectedValue || selectedCusValue}
        loading={loading}
        getOptionLabel={(option) => option.value || ""}
        // groupBy={(option) => option.name}
        isOptionEqualToValue={(option, value) => {
          return option.value === value.value;
        }} // Custom equality check
        onInputChange={(event, value) => {
          // console.log("valuevaluevalue==",value);
          if (value != undefined) {
            setInputValue(value);
            if (value) fetchOptions();
          }
          // Fetch new options for the input
        }}
        onChange={(event, newValue) => {
          setSelectedValue(newValue);
          onCustomerSelect(newValue);
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Customer"
            variant="outlined"
            error={touched.customer_name && Boolean(errors.customer_name)}
            helperText={touched.customer_name && errors.customer_name}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? <CircularProgress size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        renderOption={(props, option, value) => (
          <>
            {option.value != null ? (
              <>
                <li {...props}>
                  <Box>
                    <Typography variant="body1">{option.value}</Typography>
                    {option.description != null && (
                      <Typography
                        key={option.description}
                        variant="body2"
                        color="textSecondary"
                        dangerouslySetInnerHTML={{ __html: option.description }}
                      />
                    )}
                  </Box>
                </li>
              </>
            ) : (
              <></>
            )}
          </>
        )}
        disablePortal // Disable portal to keep the dropdown in the same DOM tree
      />
    </div>
  );
}
