"use client";
import { readAccessTokenDataRaw } from '@/utils/accessTokenDataStorage'

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import { fetchFromERPNext } from "@/services/api/common-erpnext-api/listing-api-get";
import { updateResource, createResource } from "@/services/api/common-erpnext-api/create-edit-api";
import {
  FetchCountryList,
  FetchStateForCountry,
} from "@/services/api/general_apis/customer-form-data-api";
import {
  inlineEditLabelColumnSx,
  inlineEditValueColumnSx,
  inlineEditRowRootSx,
} from "@/components/Common/inlineFieldLayout";

interface EditableAddressFieldProps {
  label: string;
  field: string;
  /** Current document name (e.g. Territory name) to prefix address_title when creating */
  docName?: string;
  value?: string; // Address name stored on main doc
  isEditPermission?: boolean;
  /** Optional callback so parent (CommonForm) can update main doc field with new Address name */
  onSave?: (field: string, value: string) => Promise<void> | void;
}

interface AddressDoc {
  name: string;
  address_title?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  longitude?: string;
  latitude?: string;
}

const EditableAddressField: React.FC<EditableAddressFieldProps> = ({
  label,
  field,
  docName,
  value,
  isEditPermission = true,
  onSave,
}) => {
  const [hover, setHover] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [address, setAddress] = useState<AddressDoc | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [countryOptions, setCountryOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [stateOptions, setStateOptions] = useState<string[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);

  const [userToken] = useState<any>(() => {
    const initialValue = JSON.parse(
      readAccessTokenDataRaw()
    );
    return initialValue || "";
  });

  // Fetch address details when we have an address name
  useEffect(() => {
    const loadAddress = async () => {
      if (!value) {
        setAddress(null);
        return;
      }
      const token = userToken?.access_token;
      if (!token) return;

      try {
        setLoading(true);
        const params = {
          filters: JSON.stringify({ name: value }),
          fields: JSON.stringify([
            "name",
            "address_title",
            "address_line1",
            "address_line2",
            "city",
            "state",
            "country",
            "pincode",
            "longitude",
            "latitude",
          ]),
        };
        const res = await fetchFromERPNext("Address", params, token);
        const rows = res?.data || res?.message?.data || [];
        const first: AddressDoc | null =
          (Array.isArray(rows) && rows[0]) || null;
        setAddress(first);
      } catch (e) {
        console.error("Failed to load address", e);
        setAddress(null);
      } finally {
        setLoading(false);
      }
    };

    loadAddress();
  }, [value, userToken]);

  // Load countries once
  useEffect(() => {
    const loadCountries = async () => {
      const token = userToken?.access_token;
      if (!token) return;
      try {
        setLoadingCountries(true);
        const result = await FetchCountryList(token);
        const options = Array.isArray(result)
          ? (result
              .map((item: any) => {
                const name =
                  typeof item === "string"
                    ? item
                    : item?.country_name ?? item?.name ?? "";
                if (!name) return null;
                return { label: name, value: name };
              })
              .filter(Boolean) as { label: string; value: string }[])
          : [];
        setCountryOptions(options);
      } catch (e) {
        console.error("EditableAddressField: failed to load countries", e);
      } finally {
        setLoadingCountries(false);
      }
    };
    loadCountries();
  }, [userToken]);

  // Load states whenever country changes
  useEffect(() => {
    const loadStates = async () => {
      if (!address?.country) {
        setStateOptions([]);
        return;
      }
      const token = userToken?.access_token;
      if (!token) return;
      try {
        setLoadingStates(true);
        const res = await FetchStateForCountry(address.country, token);
        const states: string[] = Array.isArray(res)
          ? (res
              .map((item: any) => {
                const name =
                  typeof item === "string"
                    ? item
                    : item?.state_name ?? item?.name ?? "";
                return name || null;
              })
              .filter(Boolean) as string[])
          : [];
        setStateOptions(states);
      } catch (e) {
        console.error(
          "EditableAddressField: failed to load states for country",
          address.country,
          e
        );
      } finally {
        setLoadingStates(false);
      }
    };
    loadStates();
  }, [address?.country, userToken]);

  const handleOpenDialog = () => {
    // When no address exists yet, start with an empty local address object so user can create one
    if (!value && !address) {
      setAddress({
        name: "",
        address_title: "",
        address_line1: "",
        address_line2: "",
        city: "",
        state: "",
        country: "",
        pincode: "",
        longitude: "",
        latitude: "",
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleFieldChange = (key: keyof AddressDoc, v: string) => {
    setAddress((prev) => (prev ? { ...prev, [key]: v } : prev));
  };

  const handleUpdate = async () => {
    if (!address) return;
    const token = userToken?.access_token;
    if (!token) return;

    try {
      setSaving(true);
      // Base address_title from dialog fields
      let address_title = address.address_title ||  "Address";

      // If we know the current document name (e.g. Territory name) and the
      // address is being created for a specific field (billing_address, etc.),
      // follow the same pattern as createCustomMultipleDocuments:
      // `${docName}-${field}`
      if (!address.name && docName) {
        address_title = `${docName}-${field}`;
      }

      const payload = {
        address_title,
        address_line1: address.address_line1,
        address_line2: address.address_line2,
        city: address.city,
        state: address.state,
        country: address.country,
        pincode: address.pincode,
        longitude: address.longitude,
        latitude: address.latitude,
      };

      // If we already have an Address name, update it; otherwise create a new Address doc
      if (address.name) {
        const res = await updateResource("Address", address.name, payload, token);
        if (!res?.success) {
          console.error("Failed to update address", res);
        }
      } else {
        const res = await createResource("Address", payload, token);
        if (res?.success && res.data?.name) {
          // Notify parent so it can update main doctype field (e.g. billing_address) with new Address name
          await onSave?.(field, res.data.name);
        } else {
          console.error("Failed to create address", res);
        }
      }
      setDialogOpen(false);
    } catch (e) {
      console.error("Error while updating address", e);
    } finally {
      setSaving(false);
    }
  };

  // Format address for display as:
  // address_line1
  // address_line2
  // City, State Pincode
  // Country
  const hasAddress =
    address?.address_line1 ||
    address?.address_line2 ||
    address?.city ||
    address?.state ||
    address?.pincode ||
    address?.country;

  const renderDisplayAddress = () => {
    if (!hasAddress && !value) return "-";

    const line1 = address?.address_line1;
    const line2 = address?.address_line2;
    const cityStatePincode = [
      address?.city,
      address?.state,
      address?.pincode,
    ]
      .filter(Boolean)
      .join(", ");
    const countryLine = address?.country;

    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.3 }}>
        {line1 && <span>{line1}</span>}
        {line2 && <span>{line2}</span>}
        {cityStatePincode && <span>{cityStatePincode}</span>}
        {countryLine && <span>{countryLine}</span>}
        {!hasAddress && value && <span>{`Address: ${value}`}</span>}
      </Box>
    );
  };

  return (
    <>
      <Box
        display="flex"
        alignItems="flex-start"
        justifyContent="flex-start"
        gap={0}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        flexDirection="row"
        sx={inlineEditRowRootSx}
      >
        <Typography
          className="font-medium text-1xl"
          color={"GrayText"}
          sx={inlineEditLabelColumnSx}
        >
          {label}:
        </Typography>

        <Box sx={inlineEditValueColumnSx}>
        {hover && isEditPermission ? (
          <Typography
            sx={{
              width: "100%",
              minWidth: 0,
              minHeight: 40,
              border: "1px solid transparent",
              "&:hover": {
                border: "1px solid var(--mui-palette-primary-main)",
                margin: "-8px 0 8px 0px",
              },
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              borderRadius: 1,
              margin: "-8px 0 8px 0px",
            }}
          >
            <Box sx={{ flexGrow: 1, padding: "8px 8px 0 0" }}>
              {loading ? "Loading address..." : renderDisplayAddress()}
            </Box>
            <Tooltip title="Edit">
              <IconButton size="small" onClick={handleOpenDialog}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Typography>
        ) : (
          <Typography
            sx={{
              width: "100%",
              minWidth: 0,
              minHeight: 40,
              padding: "1px 0 0 0",
            }}
            color={"var(--mui-palette-secondary-dark)"}
          >
            {loading ? "Loading address..." : renderDisplayAddress()}
          </Typography>
        )}
        </Box>
      </Box>

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight={600}>
              Update Address
            </Typography>
            <IconButton size="small" onClick={handleCloseDialog}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mt: 1 }}>
            <Typography
              variant="subtitle2"
              fontWeight={600}
              sx={{
                mb: 1,
                borderBottom: "1px solid",
                borderColor: "divider",
                pb: 0.5,
              }}
            >
              Address
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {/* Country / Region */}
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel>Country / Region</InputLabel>
                  <Select
                    label="Country / Region"
                    value={address?.country || ""}
                    onChange={(e) =>
                      handleFieldChange("country", e.target.value as string)
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
              </Grid>
              {/* Flat / House No. / Building / Apartment Name (maps to address_title) */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Flat / House No. / Building / Apartment Name"
                  value={address?.address_line1 || ""}
                  onChange={(e) =>
                    handleFieldChange("address_line1", e.target.value)
                  }
                />
              </Grid>
              {/* Street Address */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Street Address"
                  value={address?.address_line2 || ""}
                  onChange={(e) =>
                    handleFieldChange("address_line2", e.target.value)
                  }
                />
              </Grid>
              {/* City */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="City"
                  value={address?.city || ""}
                  onChange={(e) => handleFieldChange("city", e.target.value)}
                />
              </Grid>
              {/* State / Province */}
              <Grid item xs={12}>
                <FormControl fullWidth size="small" disabled={!address?.country}>
                  <InputLabel>State / Province</InputLabel>
                  <Select
                    label="State / Province"
                    value={address?.state || ""}
                    onChange={(e) =>
                      handleFieldChange("state", e.target.value as string)
                    }
                  >
                    {stateOptions.map((st) => (
                      <MenuItem key={st} value={st}>
                        {st}
                      </MenuItem>
                    ))}
                  </Select>
                  {loadingStates && (
                    <Box sx={{ position: "absolute", top: 8, right: 40 }}>
                      <CircularProgress size={16} />
                    </Box>
                  )}
                </FormControl>
              </Grid>
              {/* Zip / Postal Code */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Zip / Postal Code"
                  value={address?.pincode || ""}
                  onChange={(e) =>
                    handleFieldChange("pincode", e.target.value)
                  }
                />
              </Grid>
              {/* Coordinates */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Latitude"
                  value={address?.latitude || ""}
                  onChange={(e) =>
                    handleFieldChange("latitude", e.target.value)
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Longitude"
                  value={address?.longitude || ""}
                  onChange={(e) =>
                    handleFieldChange("longitude", e.target.value)
                  }
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleUpdate}
            variant="contained"
            disabled={saving}
          >
            {saving ? "Updating..." : "Update"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EditableAddressField;

