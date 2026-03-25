"use client";

import React, { useEffect, useState } from "react";
import { Autocomplete, Grid, TextField } from "@mui/material";
import {
  FetchCitiesForAddressForm,
  FetchCountryList,
  FetchPostalCodeByStateCity,
  FetchStateForCountry,
  get_arealist,
} from "@/services/api/general_apis/customer-form-data-api";

interface LocationSelectProps {
  values: any;
  setFieldValue: (field: string, value: any) => void;
  errors: any;
  touched: any;
}

const LocationSelect: React.FC<LocationSelectProps> = ({
  values,
  setFieldValue,
  errors,
  touched,
}) => {
  const [countries, setCountries] = useState<any>([]);
  const [territories, setTerritories] = useState<any>([]);
  const [states, setStates] = useState<any>([]);
  const [cities, setCities] = useState<any>([]);
  const [pincodes, setPincodes] = useState<any>([]);
  const [err, setErr] = useState<boolean>(false);

  // Fetch User Token from Local Storage
  // const [userToken] = useState<string | null>(() =>
  //   localStorage.getItem("AccessTokenData")
  // );
const [userToken, setUserToken] = useState<any>(() => {
    const initialValue = JSON.parse(
      localStorage.getItem("AccessTokenData") || "{}"
    );
    return initialValue || "";
  });
  /** Fetch Territories */
  const getTerritoryData = async () => {
    const areaData = await get_arealist(userToken?.access_token);
    if (areaData?.length > 0) {
     
      
      const areaArrys = areaData.map((item: any) => ({
        value: item.name,
        label: item.territory_name,
      }));
      console.log("areaData",areaArrys);
      setTerritories(areaArrys);
    } else {
      setErr(true);
    }
  };
 

  /** Fetch Countries */
  const getCountryData = async () => {
    const countryData = await FetchCountryList(userToken?.access_token);
    if (countryData?.length > 0) {
      const countryArrys = countryData.map((item: any) => ({
        value: item.country_name,
        label: item.country_name,
      }));
      setCountries(countryArrys);
    } else {
      setErr(true);
    }
  };

  /** Fetch States when Country changes */
  useEffect(() => {
    console.log("values======>>>>>",values);
    
    if (!values?.country) return;
    const getStateData = async () => {
      const stateData = await FetchStateForCountry(values?.country, userToken?.access_token);
      if (stateData?.length > 0) {
        const stateArrys = stateData.map((item: any) => ({
          value: item.name,
          label: item.name,
        }));
        setStates(stateArrys);
      } else {
        setStates([]);
      }
    };
    getStateData();
  }, [values?.country]);

  /** Fetch Cities when State changes */
  useEffect(() => {
    if (!values?.state) return;
    const getCityData = async () => {
      const getCitiesFromState = await FetchCitiesForAddressForm(
        values?.state,
        userToken?.access_token
      );
      if (getCitiesFromState?.length > 0) {
        const cityArrys = getCitiesFromState.map((item: any) => ({
          value: item.name,
          label: item.name,
        }));
        setCities(cityArrys);
      } else {
        setCities([]);
      }
    };
    getCityData();
  }, [values?.state]);

  /** Fetch Pincodes when City changes */
  useEffect(() => {
    if (!values?.city) return;
    const getPincodeData = async () => {
      const getPincodesFromStateCity = await FetchPostalCodeByStateCity(
        values?.state,
        values?.city,
        userToken?.access_token
      );
      if (getPincodesFromStateCity?.length > 0) {
        const pinArrys = getPincodesFromStateCity.map((item: any) => ({
          value: item.label,
          label: item.label,
        }));
        setPincodes(pinArrys);
      } else {
        setPincodes([]);
      }
    };
    getPincodeData();
  }, [values?.city]);

  // Fetch Country List on Mount
  useEffect(() => {
    getCountryData();
    getTerritoryData();
  }, []);

  return (
    <>
      <Grid container spacing={6}>
        {/* Country Select */}
        <Grid item xs={12} sm={6}>
          <Autocomplete
            options={countries}
            getOptionLabel={(option) => option?.label || ""}
            value={countries.find((c: any) => c.value === values?.country) || null}
            onChange={(event, newValue) => {
              setFieldValue("country", newValue?.value || "");
              setFieldValue("state", "");
              setFieldValue("city", "");
              setFieldValue("pincode", "");
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Country"
                error={touched.country && Boolean(errors.country)}
                helperText={touched.country && errors.country}
              />
            )}
            fullWidth
          />
        </Grid>

        {/* State Select */}
        <Grid item xs={12} sm={6}>
          <Autocomplete
            options={states}
            getOptionLabel={(option) => option?.label || ""}
            value={states.find((s: any) => s.value === values?.state) || null}
            onChange={(event, newValue) => {
              setFieldValue("state", newValue?.value || "");
              setFieldValue("city", "");
              setFieldValue("pincode", "");
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select State"
                error={touched.state && Boolean(errors.state)}
                helperText={touched.state && errors.state}
              />
            )}
            fullWidth
            disabled={!values.country}
          />
        </Grid>

        {/* City Select */}
        <Grid item xs={12} sm={6}>
          <Autocomplete
            options={cities}
            getOptionLabel={(option) => option?.label || ""}
            value={cities.find((c: any) => c.value === values?.city) || null}
            onChange={(event, newValue) => {
              setFieldValue("city", newValue?.value || "");
              setFieldValue("pincode", "");
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select City"
                error={touched.city && Boolean(errors.city)}
                helperText={touched.city && errors.city}
              />
            )}
            fullWidth
            disabled={!values.state}
          />
        </Grid>

        {/* Pincode Select */}
        <Grid item xs={12} sm={6}>
          <Autocomplete
            options={pincodes}
            getOptionLabel={(option) => option?.label || ""}
            value={pincodes.find((p: any) => p.value === values?.pincode) || null}
            onChange={(event, newValue) => {
              setFieldValue("pincode", newValue?.value || "");
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Pincode"
                error={touched.pincode && Boolean(errors.pincode)}
                helperText={touched.pincode && errors.pincode}
              />
            )}
            fullWidth
            disabled={!values.city}
          />
        </Grid>
        {/* Territory Select */}
        <Grid item xs={12} sm={6}> 
          <Autocomplete
            options={territories}
            getOptionLabel={(option) => option?.label || ""}
            value={territories.find((c: any) => c.value === values?.territory) || null}
            onChange={(event, newValue) => {
              setFieldValue("territory", newValue?.value || "");              
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Territory"
                error={touched.territory && Boolean(errors.territory)}
                helperText={touched.territory && errors.territory}
              />
            )}
            fullWidth
          />
        </Grid>
      </Grid>
    </>
  );
};

export default LocationSelect;
