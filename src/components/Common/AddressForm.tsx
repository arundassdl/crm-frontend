"use client";

import React, { useEffect, useState } from "react";
import { Autocomplete, Box, Button, FormControl, FormHelperText, Grid, InputLabel, MenuItem, Select, TextField, Typography } from "@mui/material";
import {
  fetchAddressTypes,
  FetchCitiesForAddressForm,
  FetchCountryList,
  FetchPostalCodeByStateCity,
  FetchStateForCountry,
} from "@/services/api/general_apis/customer-form-data-api";
import LocationSelect from "./LocationSelect";

interface AddresssFormProps {
  values: any;
  setFieldValue: (field: string, value: any) => void;
  errors: any;
  touched: any;
  handleChange: any;
  handleBlur: any;
  onClose?: () => void;
  heading?: string
}

const AddresssForm: React.FC<AddresssFormProps> = ({
  values,
  setFieldValue,
  errors,
  touched,
  handleChange,
  handleBlur,
  onClose,
  heading
}) => {
  const [addresstypes, setAddressTypes] = useState<any>([]);
const [userToken, setUserToken] = useState<any>(() => {    
    const initialValue = JSON.parse(
      localStorage.getItem("AccessTokenData") || "{}"
    );
    return initialValue || "";
  });
  useEffect(() => {
    
     const getAddressTypeData = async () => {
      const getPincodesFromStateCity = await fetchAddressTypes(
        userToken?.access_token
      );
      if (getPincodesFromStateCity?.length > 0) {
        const pinArrys = getPincodesFromStateCity.map((item: any) => ({
          value: item,
          label: item,
        }));
        setAddressTypes(pinArrys);
      } else {
        setAddressTypes([]);
      }
    };
    getAddressTypeData();
  }, []);
  return (
    <>
      <Box
            sx={{
              flexGrow: 1,
              overflowY: "auto",
              padding: 2,
              height: "100%",
            }}
          >
            <Grid
              container
              spacing={6}
              sx={{
                paddingTop: "30px",
                paddingLeft: "15px",
              }}
            >
              {(heading) &&(
              <Typography variant="h6">{heading}</Typography>
              )}
              <Grid
                container
                spacing={6}
                className="mt-5 ml-3"
                
              >
               
                <Grid item xs={12} sm={12}>
                
                  <Grid
                    container
                    spacing={6}
                    
                  >
                    <Grid
                      container
                      spacing={6}
                      
                    >
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          id="address_title"
                          name="address_title"
                          label="Address title"
                          value={values.address_title ?? ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            setFieldValue("address_title", value);
                          }}
                          onBlur={(e) => {
                            setFieldValue("address_title", e.target.value || "");
                          }}
                          error={
                            touched.address_title &&
                            Boolean(errors.address_title)
                          }
                          helperText={
                            touched.address_title &&
                            typeof errors.address_title == "string"
                              ? errors.address_title
                              : " "
                          }
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControl
                          fullWidth
                          error={
                            touched.address_type &&
                            Boolean(errors.address_type)
                          }
                        >
                          <InputLabel id="address-type-label">
                            Address Type
                          </InputLabel>
                          <Select
                            labelId="address-type-label"
                            id="address-type"
                            value={values.address_type ?? ""}
                            // onChange={handleChange}
                            onChange={(e) => {
                              const value = e.target.value;
                              setFieldValue("address_type", value);
                            }}
                            label="Address Type"
                          >
                             {addresstypes.map((option) => (
                                  <MenuItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </MenuItem>
                                ))}
                            {/* <MenuItem value="Billing">Billing</MenuItem>
                            <MenuItem value="Shipping">Shipping</MenuItem>
                            <MenuItem value="Office">Office</MenuItem>
                            <MenuItem value="Personal">Personal</MenuItem>
                            <MenuItem value="Plant">Plant</MenuItem>
                            <MenuItem value="Postal">Postal</MenuItem>
                            <MenuItem value="Shop">Shop</MenuItem>
                            <MenuItem value="Subsidiary">Subsidiary</MenuItem>
                            <MenuItem value="Warehouse">Warehouse</MenuItem>
                            <MenuItem value="Current">Current</MenuItem>
                            <MenuItem value="Permanent">Permanent</MenuItem>
                            <MenuItem value="Other">Other</MenuItem> */}
                          </Select>
                          {touched.address_type &&
                            errors.address_type && (
                              <FormHelperText>
                                {typeof errors.address_type === "string"
                                  ? errors.address_type
                                  : " "}
                              </FormHelperText>
                            )}
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          name="address_line1"
                          variant="outlined"
                          label="Address 1"
                          multiline
                          rows={2}
                          placeholder="Enter Address Line 1"
                          value={values?.address_line1 ?? ""}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={
                            touched.address_line1 &&
                            Boolean(errors.address_line1)
                          }
                          helperText={
                            touched.address_line1 &&
                            errors.address_line1
                          }
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          name="address_line2"
                          variant="outlined"
                          label="Address 2"
                          multiline
                          rows={2}
                          placeholder="Enter Address Line 2"
                          value={values?.address_line2 ?? ""}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                      </Grid>
                      <Grid item xs={12} sm={12}>
                      <LocationSelect values={values} setFieldValue={setFieldValue} errors={errors} touched={touched} />
                      </Grid>                     
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Box>
          
    </>
  );
};

export default AddresssForm;
