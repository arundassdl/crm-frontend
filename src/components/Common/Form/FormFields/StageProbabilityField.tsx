"use client";
import { readAccessTokenString } from '@/utils/accessTokenDataStorage'

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Autocomplete } from "@mui/lab";
import { Box, CircularProgress, TextField, Typography } from "@mui/material";
import {
  getComponentStageProbability,
  StageProbabilityOption,
} from "@/services/api/general_apis/component-picklist-api";

interface StageProbabilityFieldProps {
  module: string;
  layoutName: string;
  fieldName: string; // technical stage field name
  label: string;
  value?: string;
  onChange: (value: string | null) => void;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  placeholder?: string;
  /**
   * Formik helpers (passed from CustomForm) so selecting a stage
   * can also populate related fields (probability/category).
   */
  setFieldValue?: (field: string, value: any) => void;
  values?: any;
  probabilityFieldName?: string;
  recordCategoryFieldName?: string;
  forecastCategoryFieldName?: string;
}

const StageProbabilityField: React.FC<StageProbabilityFieldProps> = ({
  module,
  layoutName,
  fieldName,
  label,
  value,
  onChange,
  error,
  helperText,
  disabled,
  placeholder,
  setFieldValue,
  values,
  probabilityFieldName = "probability",
  recordCategoryFieldName = "record_category",
  forecastCategoryFieldName = "forecast_category",
}) => {
  const [options, setOptions] = useState<StageProbabilityOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<StageProbabilityOption | null>(null);
  const didAutoSelectDefaultRef = useRef(false);

  const hasField = useMemo(() => {
    if (!values) return () => false;
    return (name: string) => Object.prototype.hasOwnProperty.call(values, name);
  }, [values]);

  useEffect(() => {
    const loadOptions = async () => {
      const token = readAccessTokenString();

      if (!token || !module || !layoutName || !fieldName) {
        setOptions([]);
        return;
      }

      // Reset auto-default selection for this load cycle.
      didAutoSelectDefaultRef.current = false;
      setSelectedOption(null);
      setLoading(true);
      try {
        const result = await getComponentStageProbability(module, layoutName, fieldName, token);
        setOptions(Array.isArray(result) ? result : []);
      } catch (err) {
        console.error("StageProbabilityField: Failed to load options", err);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    };

    loadOptions();
  }, [module, layoutName, fieldName]);

  useEffect(() => {
    // If a value already exists, keep selection in sync.
    if (value) {
      const match =
        options.find((opt) => opt.value === value) ||
        options.find((opt) => opt.label === value) ||
        null;
      setSelectedOption(match);
      return;
    }

    // No current value => if there is a backend default, auto-select it once.
    if (!options.length) return;

    const defaultOpt =
      options.find((opt) => opt.is_default === 1 || opt.is_default === true) || null;

    if (!defaultOpt || didAutoSelectDefaultRef.current) {
      setSelectedOption(null);
      return;
    }

    didAutoSelectDefaultRef.current = true;
    setSelectedOption(defaultOpt);

    // Update Formik stage value.
    onChange(defaultOpt.value);

    // Populate related fields on initial auto-default load.
    if (setFieldValue && values) {
      if (hasField(probabilityFieldName)) {
        setFieldValue(probabilityFieldName, defaultOpt.probability ?? 0);
      }
      if (hasField(recordCategoryFieldName)) {
        setFieldValue(recordCategoryFieldName, defaultOpt.record_category ?? "");
      }
      if (hasField(forecastCategoryFieldName)) {
        setFieldValue(forecastCategoryFieldName, defaultOpt.forecast_category ?? "");
      }
    }
  }, [
    value,
    options,
    onChange,
    setFieldValue,
    values,
    probabilityFieldName,
    recordCategoryFieldName,
    forecastCategoryFieldName,
    hasField,
  ]);

  const selectedColor = selectedOption?.color;

  return (
    <Autocomplete
      disabled={disabled}
      options={options}
      loading={loading}
      getOptionLabel={(option) =>
        typeof option === "string" ? option : option.label || option.value || ""
      }
      value={selectedOption || null}
      onChange={(_, newValue) => {
        const opt = newValue as StageProbabilityOption | null;
        const stageVal = opt?.value ?? null;

        setSelectedOption(opt);
        onChange(stageVal);

        // Populate related fields only if they exist in the current Formik values.
        if (!setFieldValue || !values || !opt) return;

        if (hasField(probabilityFieldName)) {
          setFieldValue(probabilityFieldName, opt.probability ?? 0);
        }
        if (hasField(recordCategoryFieldName)) {
          setFieldValue(recordCategoryFieldName, opt.record_category ?? "");
        }
        if (hasField(forecastCategoryFieldName)) {
          setFieldValue(forecastCategoryFieldName, opt.forecast_category ?? "");
        }
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          error={error}
          helperText={helperText}
          sx={
            selectedColor
              ? {
                  "& .MuiOutlinedInput-input": {
                    bgcolor: selectedColor,
                    color: "#fff",
                  },
                }
              : undefined
          }
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      renderOption={(props, option) => (
        <li {...props} key={option.value}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {option.color ? (
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  bgcolor: option.color,
                  border: "1px solid rgba(0,0,0,0.12)",
                }}
              />
            ) : null}
            <Typography variant="body2">{option.label || option.value}</Typography>
          </Box>
        </li>
      )}
      noOptionsText="No values found"
      loadingText="Loading values..."
      fullWidth
    />
  );
};

export default StageProbabilityField;

