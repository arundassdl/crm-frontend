"use client";

import React from "react";
import { Autocomplete, TextField } from "@mui/material";
// import countries from "./countries";
const  countries = []
interface CountrySelectProps {
  value: any;
  onChange: (value: any) => void;
  error?: boolean;
  helperText?: string;
}

const CountrySelect: React.FC<CountrySelectProps> = ({ value, onChange, error, helperText }) => {
  return (
    <Autocomplete
      options={countries}
      getOptionLabel={(option) => option.label}
      value={value}
      onChange={(event, newValue) => onChange(newValue)}
      renderInput={(params) => (
        <TextField {...params} label="Select Country" error={error} helperText={helperText} />
      )}
      fullWidth
    />
  );
};

export default CountrySelect;
