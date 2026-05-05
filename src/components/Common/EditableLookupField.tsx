"use client";
import { readAccessTokenDataRaw } from '@/utils/accessTokenDataStorage'

/**
 * EditableLookupField Component
 * 
 * A specialized editable field component for lookup/reference fields.
 * Similar to EditableField but designed specifically for lookup field types
 * that need to search and select from a related doctype.
 * 
 * Features:
 * - Hover to edit: Shows edit icon on mouse hover
 * - Autocomplete search: Searches the related doctype as you type
 * - Async loading: Fetches options dynamically from the API
 * - Display value resolution: Fetches and displays the label for stored values
 * - Save/Cancel actions: Clear UI for confirming or canceling edits
 * 
 * Usage Example:
 * ```tsx
 * <EditableLookupField
 *   label="Parent Territory"
 *   field="parent_territory"
 *   value={data.parent_territory}
 *   onSave={handleSave}
 *   isEditPermission={true}
 *   doctype="CRM Territory"
 *   searchFields={["territory_name", "name"]}
 *   displayFields={["territory_name"]}
 * />
 * ```
 * 
 * @see EditableField - For standard non-lookup fields
 * @see LookupField - For lookup fields in regular forms
 */

import React, { useState, useEffect, useCallback } from "react";
import {
    Box,
    Typography,
    IconButton,
    Tooltip,
    CircularProgress,
    TextField,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { Autocomplete } from "@mui/lab";
import { fetchDataBySearch } from "@/services/api/common-erpnext-api/lookup-api";
import QuickCreatePopup from "@/components/Common/QuickCreate/QuickCreatePopup";
import {
    inlineEditLabelColumnSx,
    inlineEditValueColumnSx,
    inlineEditRowRootSx,
} from "@/components/Common/inlineFieldLayout";

const moduleToDoctypeMap: Record<string, string> = {
    Accounts: "CRM Organization",
    Contacts: "Contact",
    Leads: "CRM Lead",
};

const doctypeToModuleMap: Record<string, string> = {
    "CRM Organization": "Accounts",
    Contact: "Contacts",
    "CRM Lead": "Leads",
};

function resolveModuleForQuickCreate(referenceDoctype?: string, doctype?: string) {
    const candidates = [referenceDoctype, doctype].filter(Boolean) as string[];
    for (const c of candidates) {
        if (doctypeToModuleMap[c]) return doctypeToModuleMap[c];
        if (c && !c.includes(" ")) return c;
    }
    return doctypeToModuleMap[doctype || ""] || doctypeToModuleMap[referenceDoctype || ""] || candidates[0] || "";
}

function resolveCreateDoctype(doctype?: string, referenceDoctype?: string, moduleForApi?: string) {
    if (referenceDoctype && referenceDoctype.includes(" ")) return referenceDoctype;
    if (doctype && doctype.includes(" ")) return doctype;
    if (moduleForApi && moduleToDoctypeMap[moduleForApi]) return moduleToDoctypeMap[moduleForApi];
    return referenceDoctype || doctype || moduleForApi || "";
}

interface EditableLookupFieldProps {
    label: string;
    field: string;
    value: string;
    onSave: (field: string, value: any) => Promise<void> | void;
    isEditPermission?: boolean;
    doctype: string;
    referenceDoctype?: string;
    filters?: any;
    searchFields?: string[];
    displayFields?: string[];
}

const EditableLookupField: React.FC<EditableLookupFieldProps> = ({
    label,
    field,
    value,
    onSave,
    isEditPermission = true,
    doctype,
    referenceDoctype,
    filters,
    searchFields,
    displayFields,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [hover, setHover] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const [selectedOption, setSelectedOption] = useState<any>(null);
    const [options, setOptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [quickCreateOpen, setQuickCreateOpen] = useState(false);
    const [userToken, setUserToken] = useState<any>(() => {
        const initialValue = JSON.parse(
            readAccessTokenDataRaw()
        );
        return initialValue || "";
    });

    const moduleToQuickCreateLabel: Record<string, string> = {
        Accounts: "New Account",
        Contacts: "New Contact",
        Leads: "Lead",
    };
    const moduleForApi = resolveModuleForQuickCreate(referenceDoctype, doctype);
    const createDoctype = resolveCreateDoctype(doctype, referenceDoctype, moduleForApi);
    const isUserLookup = doctype === "User" || referenceDoctype === "User";
    const canQuickCreate = Boolean(moduleForApi && createDoctype && !isUserLookup);
    const quickCreateLabel = moduleForApi
        ? moduleToQuickCreateLabel[moduleForApi] || `New ${moduleForApi}`
        : "New Record";
    const roleProfile = userToken?.role_profile || "Super Admin";

    // Fetch the display value for the selected option when value changes
    useEffect(() => {
        const fetchSelectedValue = async () => {
            if (value && !selectedOption) {
                const token = userToken?.access_token;
                if (!token) return;

                try {
                    const results = await fetchDataBySearch(
                        value,
                        doctype,
                        token,
                        referenceDoctype,
                        filters,
                        searchFields,
                        displayFields
                    );

                    if (results && results.length > 0) {
                        const matchedOption = results.find((opt: any) => opt.value === value);
                        if (matchedOption) {
                            setSelectedOption(matchedOption);
                        }
                    }
                } catch (err) {
                    console.error("Error fetching selected value:", err);
                }
            } else if (!value) {
                setSelectedOption(null);
            }
        };

        fetchSelectedValue();
    }, [value, doctype, referenceDoctype]);

    // Fetch options based on search input
    const fetchResults = useCallback(async (searchTerm: string) => {
        if (!searchTerm || !doctype) return;

        const token = userToken?.access_token;
        if (!token) return;

        setLoading(true);
        try {
            const results = await fetchDataBySearch(
                searchTerm,
                doctype,
                token,
                referenceDoctype,
                filters,
                searchFields,
                displayFields
            );
            setOptions(results || []);
        } catch (err) {
            console.error("Error fetching lookup data:", err);
            setOptions([]);
        } finally {
            setLoading(false);
        }
    }, [doctype, referenceDoctype, filters, searchFields, displayFields, userToken]);

    useEffect(() => {
        if (open && inputValue) {
            fetchResults(inputValue);
        }
    }, [open, inputValue, fetchResults]);

    const handleSave = async () => {
        if (selectedOption?.value) {
            await onSave(field, selectedOption.value);
        }
        setIsEditing(false);
    };

    const handleCancel = () => {
        setSelectedOption(
            options.find((opt) => opt.value === value) || null
        );
        setInputValue("");
        setIsEditing(false);
    };

    const displayValue = selectedOption?.label || value || "";
    const quickCreateOption = canQuickCreate
        ? { value: "__quick_create__", label: quickCreateLabel, isQuickCreateNew: true }
        : null;
    const optionsWithQuickCreate = quickCreateOption ? [...options, quickCreateOption] : options;

    return (
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
            {isEditing ? (
                <>
                    <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1, gap: 1, minWidth: 0, width: "100%" }}>
                        <Autocomplete
                            open={open}
                            onOpen={() => setOpen(true)}
                            onClose={() => setOpen(false)}
                            options={optionsWithQuickCreate}
                            loading={loading}
                            getOptionLabel={(option) =>
                                typeof option === "string"
                                    ? option
                                    : option.label || option.value || ""
                            }
                            value={selectedOption}
                            onChange={(_, newValue) => {
                                if (newValue && typeof newValue === "object" && (newValue as any).isQuickCreateNew) {
                                    setOpen(false);
                                    setQuickCreateOpen(true);
                                    return;
                                }
                                setSelectedOption(newValue);
                            }}
                            onInputChange={(_, newInputValue) => {
                                setInputValue(newInputValue);
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    size="small"
                                    placeholder={`Search ${label}`}
                                    InputProps={{
                                        ...params.InputProps,
                                        endAdornment: (
                                            <React.Fragment>
                                                {loading ? (
                                                    <CircularProgress color="inherit" size={20} />
                                                ) : null}
                                                {params.InputProps.endAdornment}
                                            </React.Fragment>
                                        ),
                                    }}
                                />
                            )}
                            renderOption={(props, option) => (
                                <li {...props} key={option.value}>
                                    <Box>
                                        <Typography variant="body2">{option.label}</Typography>
                                        {option.description && (
                                            <Typography variant="caption" color="textSecondary">
                                                {option.description}
                                            </Typography>
                                        )}
                                    </Box>
                                </li>
                            )}
                            sx={{ minWidth: 0, flexGrow: 1, width: "100%" }}
                        />
                        <QuickCreatePopup
                            open={quickCreateOpen && canQuickCreate}
                            onClose={() => setQuickCreateOpen(false)}
                            moduleLabel={moduleForApi || "Record"}
                            moduleForApi={moduleForApi}
                            createDoctype={createDoctype}
                            role={roleProfile}
                            onCreated={(createdName) => {
                                setSelectedOption({ value: createdName, label: createdName });
                                setInputValue(createdName);
                            }}
                        />
                        <Tooltip title="Save">
                            <IconButton size="small" color="primary" onClick={handleSave}>
                                <CheckIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Cancel">
                            <IconButton size="small" onClick={handleCancel}>
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </>
            ) : (
                <>
                    {hover && isEditPermission && !isEditing ? (
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
                                {displayValue}
                            </Box>
                            <Tooltip title="Edit">
                                <IconButton size="small" onClick={() => setIsEditing(true)}>
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
                            {displayValue}
                        </Typography>
                    )}
                </>
            )}
            </Box>
        </Box>
    );
};

export default EditableLookupField;

