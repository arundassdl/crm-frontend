"use client";
import { readAccessTokenString } from '@/utils/accessTokenDataStorage'

import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  CircularProgress,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  FetchCountryList,
  FetchStateForCountry,
} from "@/services/api/general_apis/customer-form-data-api";

const ADDRESS_SUB_FIELDS = [
  "Country / Region",
  "Flat / House No. / Building / Apartment Name",
  "Street Address",
  "City",
  "State / Province",
  "Zip / Postal Code",
] as const;

const ADDRESS_COORD_FIELDS = ["Latitude", "Longitude"] as const;

const ADDRESS_LABEL_TO_KEY: Record<string, string> = {
  "Country / Region": "country",
  // Map Flat / House field to address_line1 so it is stored and later displayed
  "Flat / House No. / Building / Apartment Name": "address_line1",
  "Street Address": "address_line2",
  City: "city",
  "State / Province": "state",
  "Zip / Postal Code": "pincode",
  Latitude: "latitude",
  Longitude: "longitude",
};

export type AddressValue = {
  [key: string]: any;
};

type CountryOption = { label: string; value: string };

interface AddressAvailableFieldConfig {
  key: string;
  label: string;
  technical_name?: string;
  enabled?: boolean;
  visible?: boolean;
  required?: boolean;
  hide?: boolean;
}

interface AddressFieldProps {
  label?: string;
  value?: AddressValue;
  onChange: (value: AddressValue) => void;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  addressAvailableFields?: AddressAvailableFieldConfig[];
}

const AddressField: React.FC<AddressFieldProps> = ({
  label,
  value,
  onChange,
  disabled,
  error,
  helperText,
  addressAvailableFields,
}) => {
  const [countryOptions, setCountryOptions] = useState<CountryOption[]>([]);
  const [stateOptionsByCountry, setStateOptionsByCountry] = useState<
    Record<string, string[]>
  >({});
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingStatesFor, setLoadingStatesFor] = useState<string | null>(null);

  const addressValue: AddressValue = value || {};

  // Load countries once
  useEffect(() => {
    let mounted = true;
    const loadCountries = async () => {
      try {
        setLoadingCountries(true);
        const token = readAccessTokenString() ?? "";
        if (!token) {
          setLoadingCountries(false);
          return;
        }
        const result = await FetchCountryList(token);
        if (!mounted) return;
        const options: CountryOption[] = Array.isArray(result)
          ? (result
              .map((item: any) => {
                const name =
                  typeof item === "string"
                    ? item
                    : item?.country_name ?? item?.name ?? "";
                if (!name) return null;
                return { label: name, value: name };
              })
              .filter(Boolean) as CountryOption[])
          : [];
        setCountryOptions(options);
      } catch (e) {
        console.error("AddressField: failed to load countries", e);
      } finally {
        if (mounted) {
          setLoadingCountries(false);
        }
      }
    };
    loadCountries();
    return () => {
      mounted = false;
    };
  }, []);

  const ensureStatesForCountry = useCallback(
    async (countryName: string) => {
      if (!countryName || stateOptionsByCountry[countryName]) return;
      try {
        setLoadingStatesFor(countryName);
        const token = readAccessTokenString() ?? "";
        if (!token) {
          setLoadingStatesFor(null);
          return;
        }
        const result = await FetchStateForCountry(countryName, token);
        const states: string[] = Array.isArray(result)
          ? (result
              .map((item: any) => {
                const name =
                  typeof item === "string"
                    ? item
                    : item?.state_name ?? item?.name ?? "";
                return name || null;
              })
              .filter(Boolean) as string[])
          : [];
        setStateOptionsByCountry((prev) => ({
          ...prev,
          [countryName]: states,
        }));
      } catch (e) {
        console.error(
          "AddressField: failed to load states for country",
          countryName,
          e
        );
      } finally {
        setLoadingStatesFor(null);
      }
    },
    [stateOptionsByCountry]
  );

  const countryKey = ADDRESS_LABEL_TO_KEY["Country / Region"];
  const stateKey = ADDRESS_LABEL_TO_KEY["State / Province"];
  const selectedCountry = addressValue[countryKey] || "";

  useEffect(() => {
    if (selectedCountry) {
      void ensureStatesForCountry(selectedCountry);
    }
  }, [selectedCountry, ensureStatesForCountry]);

  const stateOptions = selectedCountry
    ? stateOptionsByCountry[selectedCountry] || []
    : [];

  const handleAddressChange = (key: string, fieldValue: string) => {
    const next = { ...addressValue, [key]: fieldValue };
    if (key === countryKey) {
      next[stateKey] = "";
    }
    onChange(next);
  };

  const handleClearAddress = () => {
    const cleared: AddressValue = {};
    ADDRESS_SUB_FIELDS.forEach((lbl) => {
      const key = ADDRESS_LABEL_TO_KEY[lbl] || lbl;
      cleared[key] = "";
    });
    ADDRESS_COORD_FIELDS.forEach((lbl) => {
      const key = ADDRESS_LABEL_TO_KEY[lbl] || lbl;
      cleared[key] = "";
    });
    onChange(cleared);
  };

  const isSubFieldVisible = (lbl: string) => {
    const key = ADDRESS_LABEL_TO_KEY[lbl] || lbl;
    const availableConfig = (addressAvailableFields as AddressAvailableFieldConfig[] | undefined) || [];
    const entry = availableConfig.find(
      (cfg) => cfg.key === key || cfg.label === lbl
    );
    if (!entry) return true;
    return entry.visible !== false && entry.enabled !== false && entry.hide !== true;
  };

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: error ? "error.main" : "divider",
        borderRadius: 1,
        p: 2,
      }}
    >
      <Typography
        variant="subtitle2"
        fontWeight={600}
        sx={{ mb: 1, borderBottom: "1px solid", borderColor: "divider", pb: 0.5 }}
      >
        {label || "Address"}
      </Typography>

      <Stack spacing={1.2} sx={{ mt: 1 }}>
        {ADDRESS_SUB_FIELDS.map((lbl) => {
          if (!isSubFieldVisible(lbl)) return null;
          const key = ADDRESS_LABEL_TO_KEY[lbl] || lbl;
          const fieldValue = addressValue[key] || "";

          if (lbl === "Country / Region") {
            return (
              <FormControl
                key={lbl}
                fullWidth
                size="small"
                disabled={disabled}
                error={error}
              >
                <InputLabel>{lbl}</InputLabel>
                <Select
                  label={lbl}
                  value={fieldValue}
                  onChange={(e) =>
                    handleAddressChange(key, e.target.value as string)
                  }
                >
                  {countryOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
                {loadingCountries && (
                  <Box sx={{ position: "absolute", top: 8, right: 40 }}>
                    <CircularProgress size={16} />
                  </Box>
                )}
              </FormControl>
            );
          }

          if (lbl === "State / Province") {
            return (
              <FormControl
                key={lbl}
                fullWidth
                size="small"
                disabled={disabled || !selectedCountry}
                error={error}
              >
                <InputLabel>{lbl}</InputLabel>
                <Select
                  label={lbl}
                  value={fieldValue}
                  onChange={(e) =>
                    handleAddressChange(key, e.target.value as string)
                  }
                >
                  {stateOptions.map((st) => (
                    <MenuItem key={st} value={st}>
                      {st}
                    </MenuItem>
                  ))}
                </Select>
                {loadingStatesFor === selectedCountry && (
                  <Box sx={{ position: "absolute", top: 8, right: 40 }}>
                    <CircularProgress size={16} />
                  </Box>
                )}
              </FormControl>
            );
          }

          return (
            <TextField
              key={lbl}
              fullWidth
              size="small"
              label={lbl}
              value={fieldValue}
              onChange={(e) => handleAddressChange(key, e.target.value)}
              disabled={disabled}
              error={error}
              helperText={helperText}
            />
          );
        })}

        <Grid container spacing={1}>
          {ADDRESS_COORD_FIELDS.map((lbl) => {
            if (!isSubFieldVisible(lbl)) return null;
            const key = ADDRESS_LABEL_TO_KEY[lbl] || lbl;
            const fieldValue = addressValue[key] || "";
            return (
              <Grid item xs={6} key={lbl}>
                <TextField
                  fullWidth
                  size="small"
                  label={lbl}
                  value={fieldValue}
                  onChange={(e) => handleAddressChange(key, e.target.value)}
                  disabled={disabled}
                  error={error}
                  helperText={helperText}
                />
              </Grid>
            );
          })}
        </Grid>

        {helperText && (
          <Typography
            variant="caption"
            color={error ? "error" : "textSecondary"}
          >
            {helperText}
          </Typography>
        )}
      </Stack>

      {!disabled && (
        <Box sx={{ mt: 1.5, display: "flex", justifyContent: "flex-end" }}>
          <Typography
            variant="caption"
            color="primary"
            sx={{ cursor: "pointer" }}
            onClick={handleClearAddress}
          >
            Clear All
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default AddressField;

