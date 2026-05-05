"use client";
import { readAccessTokenDataParsed } from '@/utils/accessTokenDataStorage'

import React, { useEffect, useState } from "react";
import {
    Box,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    SelectChangeEvent,
    Typography,
} from "@mui/material";
import axios from "axios";
import { CONSTANTS } from "@/services/config/app-config";

interface LayoutOption {
    value: string;
    label: string;
}

interface LayoutSelectionProps {
    module: string;
    rolename?: string;
    /** Current selected layout (e.g. record layout_id); when provided, dropdown is synced to this value */
    value?: string;
    /** When true, dropdown is disabled (e.g. view-only mode) */
    readOnly?: boolean;
    /** Called whenever the selected layout value changes */
    onLayoutChange?: (layoutValue: string) => void;
    /** Optional sx to align with parent layout (e.g. CommonForm) */
    sx?: object;
    /** When true, uses minimal padding to align with CommonForm */
    compact?: boolean;
}

const LayoutSelection: React.FC<LayoutSelectionProps> = ({
    module,
    rolename,
    value: valueProp,
    readOnly = false,
    onLayoutChange,
    sx,
    compact,
}) => {
    const [userToken] = useState<any>(() => {
        try {
            return readAccessTokenDataParsed() || {};
        } catch {
            return {};
        }
    });

    const [options, setOptions] = useState<LayoutOption[]>([]);
    const [selectedValue, setSelectedValue] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLayouts = async () => {
            if (!module || !userToken?.access_token) {
                return;
            }

            setLoading(true);
            setError(null);

            const roleProfile = userToken?.role_profile || "";
            const method =
                "/api/method/sdl_metadata.api.layout.get_layout_list";
            const params = `?module=${encodeURIComponent(
                module
            )}&role_profile=${encodeURIComponent(roleProfile)}`;

            const url = `${CONSTANTS.API_BASE_URL}${method}${params}`;

            try {
                const config = {
                    headers: {
                        Authorization: userToken.access_token,
                    },
                };

                const res = await axios.get(url, config);
                const message = res?.data?.message;

                let layoutOptions: LayoutOption[] = [];

                if (Array.isArray(message)) {
                    layoutOptions = message.map((item: any) => ({
                        value: item.name || item.layout_name || "",
                        label: item.layout_name || item.name || "",
                    }));
                } else if (Array.isArray(message?.layouts)) {
                    layoutOptions = message.layouts.map((item: any) => ({
                        value: item.name || item.layout_name || "",
                        label: item.layout_name || item.name || "",
                    }));
                } else if (message && (message.name || message.layout_name)) {
                    layoutOptions = [
                        {
                            value: message.name || message.layout_name,
                            label: message.layout_name || message.name,
                        },
                    ];
                }

                setOptions(layoutOptions);

                // Module default: from message.name/layout_name, or first layout
                const defaultFromMessage: string =
                    (message && (message.name || message.layout_name)) || "";
                let moduleDefault = "";
                if (defaultFromMessage) {
                    const match =
                        layoutOptions.find(
                            (opt) => opt.value === defaultFromMessage
                        ) ||
                        layoutOptions.find(
                            (opt) => opt.label === defaultFromMessage
                        );
                    if (match) moduleDefault = match.value;
                }
                if (!moduleDefault && layoutOptions.length > 0) {
                    moduleDefault = layoutOptions[0].value;
                }

                // Use record layout_id only if it is set and exists in options; otherwise use module default
                const recordLayoutId = valueProp != null && String(valueProp).trim() !== "" ? valueProp : null;
                const recordLayoutInOptions =
                    recordLayoutId != null && layoutOptions.some((opt) => opt.value === recordLayoutId);
                const initialValue = recordLayoutInOptions ? recordLayoutId! : moduleDefault;

                if (initialValue) {
                    setSelectedValue(initialValue);
                    onLayoutChange && onLayoutChange(initialValue);
                }
            } catch (err: any) {
                console.error("Failed to fetch layouts:", err);
                setError("Failed to load layouts");
            } finally {
                setLoading(false);
            }
        };

        fetchLayouts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [module, userToken?.access_token, userToken?.role_profile]);

    // Sync selection when record layout_id (valueProp) is set from parent and exists in options
    useEffect(() => {
        if (
            valueProp != null &&
            valueProp !== "" &&
            options.some((opt) => opt.value === valueProp)
        ) {
            setSelectedValue(valueProp);
        }
    }, [valueProp, options]);

    const handleChange = (event: SelectChangeEvent<string>) => {
        const value = event.target.value as string;
        setSelectedValue(value);
        if (onLayoutChange) {
            onLayoutChange(value);
        }
    };

    const labelText = loading ? "Loading layouts..." : "Select Layout";

    return (
        <Box sx={{
            flexGrow: 1,
            overflow: compact ? "visible" : "auto",
            overflowY: compact ? "visible" : "auto",
            ...(compact ? { padding: 0, pt: 0 } : { padding: 2, pt: 2 }),
            ...sx,
        }}>
            <Grid container spacing={compact ? 2 : 6} sx={{ p: compact ? 0 : 5, pb: 0 }}>
                <Grid item xs={12} sm={6}>
                    <FormControl
                        fullWidth
                        size="small"
                        disabled={readOnly || loading || options.length === 0}
                        variant="outlined"
                        sx={{ minHeight: 48 }}
                    >
                        <InputLabel
                            id="layout-selection-label"
                            shrink={!!selectedValue}
                        >
                            {labelText}
                        </InputLabel>
                        <Select
                            labelId="layout-selection-label"
                            value={valueProp ?? selectedValue}
                            label={labelText}
                            onChange={handleChange}
                        >
                            {options.map((opt) => (
                                <MenuItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    {error && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5, display: "block" }}>
                            {error}
                        </Typography>
                    )}
                </Grid>
            </Grid>
        </Box>
    );
};

export default LayoutSelection;

