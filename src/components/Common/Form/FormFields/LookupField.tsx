"use client";
import { readAccessTokenDataRaw, readAccessTokenString } from '@/utils/accessTokenDataStorage'

import React, { useState, useEffect, useCallback } from "react";
import {
    TextField,
    CircularProgress,
    Typography,
    Box,
    debounce,
} from "@mui/material";
import { Autocomplete } from "@mui/lab";
import { fetchDataBySearch } from "@/services/api/common-erpnext-api/lookup-api";
import QuickCreatePopup from "@/components/Common/QuickCreate/QuickCreatePopup";

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
        // Heuristic: frontend module names usually have no spaces
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

interface LookupFieldProps {
    doctype: string;
    label: string;
    value?: string;
    onChange: (value: string | null) => void;
    error?: boolean;
    helperText?: string;
    disabled?: boolean;
    placeholder?: string;
    referenceDoctype?: string;
    filters?: any;
    searchFields?: string[];
    displayFields?: string[];
}

const LookupField: React.FC<LookupFieldProps> = ({
    doctype,
    label,
    value,
    onChange,
    error,
    helperText,
    disabled,
    placeholder,
    referenceDoctype,
    filters,
    searchFields,
    displayFields,
}) => {
    const [open, setOpen] = useState(false);
    const [options, setOptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const [selectedOption, setSelectedOption] = useState<any>(null);
    const [quickCreateOpen, setQuickCreateOpen] = useState(false);

    const moduleForApi = resolveModuleForQuickCreate(referenceDoctype, doctype);
    const createDoctype = resolveCreateDoctype(doctype, referenceDoctype, moduleForApi);
    const isUserLookup = doctype === "User" || referenceDoctype === "User";
    const canQuickCreate = Boolean(moduleForApi && createDoctype && !isUserLookup);

    const roleProfile = (() => {
        try {
            const tokenDataRaw = readAccessTokenDataRaw();
            const tokenData = JSON.parse(tokenDataRaw);
            return tokenData?.role_profile || "Super Admin";
        } catch {
            return "Super Admin";
        }
    })();

    // Fetch the display value for the selected option when value changes
    useEffect(() => {
        const fetchSelectedValue = async () => {
            if (value && !selectedOption) {
                const token = readAccessTokenString();
                if (!token) return;

                try {
                    // Fetch the full record to get display fields
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
    }, [value, doctype, referenceDoctype, JSON.stringify(filters), JSON.stringify(searchFields), JSON.stringify(displayFields)]);

    const fetchResults = useCallback(
        debounce(async (searchValue: string) => {
            const token = readAccessTokenString();
            if (!token) {
                console.warn("LookupField: No access token found");
                return;
            }

            setLoading(true);
            try {
                console.log(`LookupField: Fetching ${doctype} with query: "${searchValue}"`);
                const results = await fetchDataBySearch(
                    searchValue,
                    doctype,
                    token,
                    referenceDoctype,
                    filters,
                    searchFields,
                    displayFields
                );
                console.log(`LookupField: Received ${results?.length} results for ${doctype}`);
                setOptions(results || []);
            } catch (err) {
                console.error("LookupField error:", err);
                setOptions([]);
            } finally {
                setLoading(false);
            }
        }, 500),
        [doctype, referenceDoctype, JSON.stringify(filters), JSON.stringify(searchFields), JSON.stringify(displayFields)]
    );

    useEffect(() => {
        if (open) {
            fetchResults(inputValue);
        }
    }, [open, inputValue, fetchResults]);

    const moduleToQuickCreateLabel: Record<string, string> = {
        Accounts: "New Account",
        Contacts: "New Contact",
        Leads: "Lead",
    };

    const quickCreateLabel = moduleForApi
        ? moduleToQuickCreateLabel[moduleForApi] || `New ${moduleForApi}`
        : "New Record";

    const ListboxComponent = React.useMemo(() => {
        // Sticky footer inside the dropdown list.
        // Autocomplete's default listbox is scrollable; `position: sticky` keeps this action pinned.
        return React.forwardRef<HTMLUListElement, React.HTMLAttributes<HTMLElement>>(
            function ListboxComponentInner(props, ref) {
                const { children, ...rest } = props as any;
                return (
                    <ul
                        ref={ref}
                        {...rest}
                        style={{
                            ...(rest.style || {}),
                            paddingBottom: canQuickCreate ? 0 : rest.style?.paddingBottom,
                        }}
                    >
                        {children}
                        {canQuickCreate && (
                            <li
                                // Match the list item height/padding similar to options.
                                style={{
                                    listStyle: "none",
                                    position: "sticky",
                                    bottom: 0,
                                    zIndex: 1,
                                    background: "var(--mui-palette-background-paper, #fff)",
                                    borderTop: "1px solid rgba(0, 0, 0, 0.12)",
                                    padding: "7px 16px",
                                    cursor: "pointer",
                                }}
                                onMouseDown={(e) => {
                                    // Prevent Autocomplete from taking focus / selecting.
                                    e.preventDefault();
                                }}
                                onClick={() => {
                                    setOpen(false);
                                    setQuickCreateOpen(true);
                                }}
                            >
                                <Box
                                    sx={{
                                        width: "100%",
                                        textAlign: "left",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "flex-start",
                                        cursor: "pointer",
                                        "&:hover": { backgroundColor: "action.hover" },
                                    }}
                                >
                                    <Typography
                                        variant="body1"
                                        sx={{ fontWeight: 700, textAlign: "left" }}
                                    >
                                        {quickCreateLabel}
                                    </Typography>
                                </Box>
                            </li>
                        )}
                    </ul>
                );
            }
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canQuickCreate, quickCreateLabel]);

    return (
        <>
        <Autocomplete
            open={open}
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}
            disabled={disabled}
            options={options}
            loading={loading}
            getOptionLabel={(option) => (typeof option === "string" ? option : option.label || option.value || "")}
            value={selectedOption || (options.find(opt => opt.value === value)) || null}
            onChange={(_, newValue) => {
                // Special "New {Module}" option triggers quick create dialog.
                if (newValue && typeof newValue === "object" && (newValue as any).isQuickCreateNew) {
                    setOpen(false);
                    setQuickCreateOpen(true);
                    return;
                }
                const val = typeof newValue === "string" ? newValue : newValue?.value || null;
                setSelectedOption(newValue);
                onChange(val);
            }}
            onInputChange={(_, newInputValue) => {
                setInputValue(newInputValue);
            }}
            filterOptions={(x) => x}
            ListboxComponent={ListboxComponent as any}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label}
                    placeholder={placeholder}
                    error={error}
                    helperText={helperText}
                    InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                            <React.Fragment>
                                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                            </React.Fragment>
                        ),
                    }}
                />
            )}
            renderOption={(props, option) => (
                <li {...props} key={option.value}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                        <Typography variant="body1">{option.label || option.value}</Typography>
                        {displayFields && displayFields.length > 0 ? (
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                {displayFields.map((field) => (
                                    option[field] && field !== 'label' && field !== 'value' && (
                                        <Typography key={field} variant="caption" color="textSecondary">
                                            {String(option[field])}
                                        </Typography>
                                    )
                                ))}
                            </Box>
                        ) : (
                            option.description && (
                                <Typography variant="caption" color="textSecondary">
                                    {option.description}
                                </Typography>
                            )
                        )}
                    </Box>
                </li>
            )}
            noOptionsText="No results found"
            loadingText="Searching..."
            fullWidth
        />
        <QuickCreatePopup
            open={quickCreateOpen && canQuickCreate}
            onClose={() => setQuickCreateOpen(false)}
            moduleLabel={moduleForApi || "Record"}
            moduleForApi={moduleForApi}
            createDoctype={createDoctype}
            role={roleProfile}
            onCreated={(createdName) => {
                setSelectedOption(null);
                onChange(createdName);
            }}
        />
        </>
    );
};

export default LookupField;
