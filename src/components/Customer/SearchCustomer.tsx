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


interface CustomerSearchProps {
  value: string; // Bound to Formik's field value
  touched: any; // Formik's touched object
  errors: any; // Formik's errors object
  onCustomerSelect: (customer: Option | null) => void;
}

export default function CustomerSearch({
  value,
  touched,
  errors,
  onCustomerSelect,
}: CustomerSearchProps) {
  const [options, setOptions] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [userToken, setUserToken] = useState<any>(() => {
    const initialValue = JSON.parse(
      localStorage.getItem("AccessTokenData") || "{}"
    );
    return initialValue || "";
  });
  const [selectedValue, setSelectedValue] = useState<Option | null>(null); // Selected value for Autocomplete
  const [selectedCusValue, setSelectedCusValue] = useState<any>(null);

  console.log("valuevaluevaluevaluevaluevaluevalue",value);
  
  // Debounced API call
  const fetchOptions = debounce(async (query: string) => {
    console.log("queryqueryquery",query);
    
    // if (!query) return;

    setLoading(true);

    try {
      const response = await fetchCustomerSearch(
        query,
        userToken?.access_token
      );
      console.log("set options",(response));
      //   const data = await response.json();
      // const formattedOptions = response.map((user: any) => ({
      //   name: user.name,
      // }));
    
      const customers = Object.keys(response).map((customerKey) => {
        const customerData = response[customerKey];
        const { customer, addresses } = customerData;
  
          console.log("customer===",customer);
          console.log("addresses===",addresses);
        return {
          name: customer.customer_name, // Display name for the autocomplete
          id: customer.id, // Unique customer ID
          customerType: customer.customer_type,
          email: customer.email,
          phone: customer.phone,
          addresses: addresses || [], // Ensure addresses is an array
        };
      });

      const getAddresses = Object.keys(response)
  .map((customerKey) => {
    const customerData = response[customerKey];
    const { customer, addresses } = customerData;

    if (addresses.length === 0) {
      // Return only customer details if no addresses exist
      return {
        key:`${customerKey}-0`,
        name: customer.customer_name, // Display name for the autocomplete
        id: customer.id, // Unique customer ID
        customerType: customer.customer_type,
        email: customer.email,
        phone: customer.phone,
      };
    }else{

    // Return addresses with customer details
    return addresses.map((address,index) => ({
      ...address,
      key:`${address?.address_line1}`,
      name: customer.customer_name,
      id: customer.id,
      customerType: customer.customer_type,
      email: address?.email || customer.email,
      phone: address?.phone || customer.phone,
    }));
  }
  })
  .flat() // Flatten the array to avoid nested arrays
  .filter(Boolean); // Remove null values (if any)

      // console.log("getAddresses", getAddresses);

      const sortedOptions = getAddresses
  .slice()
  .sort((a, b) => a.key.localeCompare(b.key));
  
      // console.log("Mapped customers:", sortedOptions);
      setOptions(sortedOptions);


    } catch (error) {
      console.error("Error fetching options:", error);
    } finally {
      setLoading(false);
    }
  }, 300); // 300ms debounce delay

  useEffect(() => {
    fetchOptions(inputValue);
  }, [inputValue]);
  
  useEffect(() => {
    console.log("selectedValue=>",selectedValue);
    
    if (selectedValue && !options.find((opt) => opt.id === selectedValue.id)) {
      setOptions((prevOptions) => [...prevOptions, selectedValue]); // Add selectedValue if missing
    }
  }, [selectedValue, options]);

  const handleCreateNewUser = () => {
    alert(`Create new user: ${inputValue}`);
    // Logic to create a new user or open a form
  };
  const [openPopup, setOpenPopup] = useState(false); // State to control popup visibility
  const [openSrchPopup, setOpenSrchPopup] = useState(false);

  // Open the New User Popup
  const handleOpenPopup = () => {
    // console.log("Create new customer");    
    setOpenPopup(true);
  };

  // Close the New User Popup
  const handleClosePopup = () => {
    setOpenPopup(false);
  };
  const handlePopupSubmit = (newCustomer) => {
    // fetchOptions(newCustomer)
    setSelectedValue(newCustomer); // Update the selected value
    onCustomerSelect(newCustomer);
    setSelectedCusValue(newCustomer);
    // console.log("selectedCusValue",newCustomer);
    // console.log("selectedCusValuename",newCustomer);
    
    setInputValue(newCustomer);
    // setOptions((prevOptions) => [...prevOptions, newCustomer]); // Add to options
    setOpenPopup(false); // Close the popup
  };

  const handleAdvancedPopupSelect = (customer: Option | null) => {
    // Update the selected value in Autocomplete
    setSelectedValue(customer);
    setInputValue(customer?.name || ""); // Update input value
    onCustomerSelect(customer); // Trigger parent callback
  };


  return (
    <div>
      <Autocomplete
        options={options}
        value={selectedValue}
        loading={loading}
        getOptionLabel={(option) => option.name || ""}
        // groupBy={(option) => option.name}
        isOptionEqualToValue={(option, value) => {         
          return option.id === value.id 
        }
        } // Custom equality check
        onInputChange={(event, value) => {
          // console.log("valuevaluevalue==",value);
          if(value!=undefined){
            setInputValue(value);
            if (value) fetchOptions(value);
          }
            
            // Fetch new options for the input
        }}
        onChange={(event, newValue) => {
            // console.log("Selected customer: event", event);            
            const appendedObject = {
              // key:(newValue?.address_line1==undefined)?`${newValue?.name}-0`:`${newValue?.address_line1}`,
              id: newValue?.id,
              name: newValue?.name,
              email: newValue?.email,
              phone: newValue?.phone,
              addresses: {address_id: newValue?.address_id,address_line1: newValue?.address_line1,address_type: newValue?.address_type, city: newValue?.city,customerType: newValue?.customerType,email: newValue?.email,phone: newValue?.phone,pincode:newValue?.pincode,state: newValue?.state},
          };
            setSelectedValue(appendedObject);
            onCustomerSelect(appendedObject);
        }}
        renderInput={(params) => (
            <TextField
                {...params}
                label="Search Customer"
                variant="outlined"
                // error={touched.customername && Boolean(errors.customername)}
                // helperText={touched.customername && errors.customername}
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
        // renderGroup={(params) => (
        //   <li key={params.key}>
        //     <ListSubheader>{params.group}</ListSubheader>
        //     <ul>{params.children}</ul>
        //   </li>
        // )}
      
        renderOption={(props, option, value) => (
        <> 
          {option.key !=null ? (
          <>      
            <li {...props} key={option.key}>        
                <Box>
                    <Typography variant="body1">{option.name}</Typography>
                    {option.address_id !=null && option.address_id !=undefined && (
                        <Typography key={option.address_id} variant="body2" color="textSecondary">
                            {option.address_line1}, {option.city}, {option.state} - {option.pincode}
                        </Typography>
                    )}
                </Box>
            </li>  
              </>  
              ):(
              <></>

              )}     
            </>          
        )}
        PaperComponent={(props) => (
            <Paper {...props} elevation={3} sx={{ zIndex: 1300 }}>
                {props.children}
                <Box sx={{ padding: 2, borderTop: "1px solid #ddd", cursor: "pointer" }}>
                    <Typography
                        color="#000"
                        variant="body2"
                        onMouseDown={() => {
                            console.log("Add new");
                            handleOpenPopup();
                        }}
                        sx={{ zIndex: 1500, paddingTop: "10px" }}
                    >
                        + Create a new Customer
                    </Typography>
                    <Typography
                        variant="body2"
                        color="#000"
                        align="left"
                        onMouseDown={() => {
                            console.log("search");
                            setOpenSrchPopup(true);
                        }}
                        sx={{ marginTop: 1, color: "text.secondary", paddingTop: "10px" }}
                    >
                        <i className="ri-search-2-line" style={{ fontSize: 12 }} /> Advanced Search
                    </Typography>
                </Box>
            </Paper>
        )}
        disablePortal // Disable portal to keep the dropdown in the same DOM tree
    />
 
      <AddEditCustomerPopup open={openPopup} onClose={handleClosePopup} onCustomerSelect={onCustomerSelect} onSubmitForm={(newCustomer) => handlePopupSubmit(newCustomer)} />        
      <AdvancedSearchPopup open={openSrchPopup} onClose={()=>{setOpenSrchPopup(false)}} onCustomerSelect={handleAdvancedPopupSelect}  />

     </div>
  );
}
