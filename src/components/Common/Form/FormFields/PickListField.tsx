"use client";
import { readAccessTokenString } from '@/utils/accessTokenDataStorage'

import React, { useEffect, useState } from "react";
import {
    Box,
    CircularProgress,
    TextField,
    Typography,
} from "@mui/material";
import { Autocomplete } from "@mui/lab";
import { useTheme } from "@mui/material/styles";
import {
    ComponentPicklistOption,
    getComponentPicklist,
} from "@/services/api/general_apis/component-picklist-api";
import { getFormFieldSx } from "@/@core/styles/formFieldStyles";

interface PickListFieldProps {
    module: string;
    layoutName: string;
    fieldName: string;
    label: string;
    value?: string;
    parentValue?: string | null;
    onChange: (value: string | null) => void;
    error?: boolean;
    helperText?: string;
    disabled?: boolean;
    placeholder?: string;
}

const PickListField: React.FC<PickListFieldProps> = ({
    module,
    layoutName,
    fieldName,
    label,
    value,
    parentValue,
    onChange,
    error,
    helperText,
    disabled,
    placeholder,
}) => {
    const [options, setOptions] = useState<ComponentPicklistOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedOption, setSelectedOption] = useState<ComponentPicklistOption | null>(null);

    // Load options whenever module/layout/field/parentValue change
    useEffect(() => {
        const loadOptions = async () => {
            const token = readAccessTokenString();

            if (!token || !module || !layoutName || !fieldName) {
                setOptions([]);
                return;
            }

            setLoading(true);
            try {
                const result = await getComponentPicklist(
                    module,
                    layoutName,
                    fieldName,
                    token,
                    parentValue ?? undefined
                );
                const loadedOptions = result || [];
                setOptions(loadedOptions);
            } catch (err) {
                console.error("PickListField: Failed to load options", err);
                setOptions([]);
            } finally {
                setLoading(false);
            }
        };

        loadOptions();
    }, [module, layoutName, fieldName, parentValue]);

    // Handle default value if no value is currently selected
    useEffect(() => {
        if (!value && options.length > 0) {
            const defaultOpt = options.find((opt) => opt.is_default === 1);
            if (defaultOpt) {
                onChange(defaultOpt.value);
            }
        }
    }, [options, value, onChange]);

    // Keep selected option in sync with external value
    useEffect(() => {
        if (!value) {
            setSelectedOption(null);
            return;
        }
        const match = options.find((opt) => opt.value === value);
        setSelectedOption(match || null);
    }, [value, options]);

    const selectedColor = selectedOption?.color;
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";
    const fieldSx = getFormFieldSx(isDark);

    return (
        <Autocomplete
            disabled={disabled}
            options={options}
            loading={loading}
            getOptionLabel={(option) =>
                typeof option === "string"
                    ? option
                    : option.label || option.value || ""
            }
            value={selectedOption || null}
            onChange={(_, newValue) => {
                const opt = newValue as ComponentPicklistOption | null;
                const val = typeof newValue === "string" ? newValue : opt?.value || null;
                setSelectedOption(opt);
                onChange(val);
            }}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label}
                    placeholder={placeholder}
                    error={error}
                    helperText={helperText}
                    sx={{
                        ...fieldSx,
                        ...(selectedColor
                            ? {
                                '& .MuiOutlinedInput-input': {
                                    bgcolor: selectedColor,
                                    color: '#fff',
                                },
                            }
                            : {}),
                    }}
                    InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                            <>
                                {loading ? (
                                    <CircularProgress color="inherit" size={20} />
                                ) : null}
                                {params.InputProps.endAdornment}
                            </>
                        ),
                    }}
                />
            )}
            renderOption={(props, option) => (
                <li {...props} key={option.value}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {option.color && (
                            <Box
                                sx={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: "50%",
                                    bgcolor: option.color,
                                    border: "1px solid rgba(0,0,0,0.12)",
                                }}
                            />
                        )}
                        <Typography variant="body2">
                            {option.label || option.value}
                        </Typography>
                    </Box>
                </li>
            )}
            noOptionsText="No values found"
            loadingText="Loading values..."
            fullWidth
        />
    );
};

export default PickListField;

