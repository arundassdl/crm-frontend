"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Box, FormControl, MenuItem, Select, SelectChangeEvent } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import LookupField from "./LookupField";
import { getFormFieldSx } from "@/@core/styles/formFieldStyles";

type RelatedToType = "CRM Organization" | "CRM Deal";

interface RelatedToFieldProps {
    fieldName?: string;
    label: string;
    value?: string;
    onChange: (value: string | null) => void;
    error?: boolean;
    helperText?: string;
    disabled?: boolean;
    placeholder?: string;
    filters?: any;
    searchFields?: string[];
    displayFields?: string[];
    doctype?: string;
    referenceDoctype?: string;
    type?: RelatedToType;
    onTypeChange?: (type: RelatedToType) => void;
}

const FIELD_OPTIONS: { label: string; value: RelatedToType }[] = [
    { label: "Account", value: "CRM Organization" },
    { label: "Deal", value: "CRM Deal" },
];

const resolveInitialType = (doctype?: string, referenceDoctype?: string): RelatedToType => {
    const candidate = String(referenceDoctype || doctype || "").trim().toLowerCase();
    if (candidate.includes("deal")) return "CRM Deal";
    return "CRM Organization";
};

const RelatedTo: React.FC<RelatedToFieldProps> = ({
    fieldName,
    label,
    value,
    onChange,
    error,
    helperText,
    disabled,
    placeholder,
    filters,
    searchFields,
    displayFields,
    doctype,
    referenceDoctype,
    type: controlledType,
    onTypeChange,
}) => {
    const [internalSelectedType, setInternalSelectedType] = useState<RelatedToType>(
        controlledType || resolveInitialType(doctype, referenceDoctype)
    );

    const selectedType = controlledType || internalSelectedType;
    const setSelectedType = (nextType: RelatedToType) => {
        if (onTypeChange) {
            onTypeChange(nextType);
        } else {
            setInternalSelectedType(nextType);
        }
    };
    const typeLabelId = `${fieldName || "relatedto"}-type-label`;

    useEffect(() => {
        if (!controlledType) {
            setSelectedType(resolveInitialType(doctype, referenceDoctype));
        }
    }, [doctype, referenceDoctype, controlledType]);

    const lookupPlaceholder = useMemo(() => {
        if (placeholder) return placeholder;
        return selectedType === "CRM Organization" ? "Search Account" : "Search Deal";
    }, [placeholder, selectedType]);

    const handleTypeChange = (event: SelectChangeEvent<RelatedToType>) => {
        const nextType = event.target.value as RelatedToType;
        setSelectedType(nextType);
        // Prevent stale selected value when switching doctype.
        onChange(null);
    };

    const theme = useTheme();
    const fieldSx = getFormFieldSx(theme.palette.mode === "dark");

    return (
        <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
            <FormControl sx={{ minWidth: 180, ...fieldSx }} disabled={disabled}>
                <Select
                    labelId={typeLabelId}
                    value={selectedType}
                    onChange={handleTypeChange}
                >
                    {FIELD_OPTIONS.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                            {opt.label}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <Box sx={{ flex: 1 }}>
                <LookupField
                    doctype={selectedType}
                    referenceDoctype={selectedType}
                    label={label}
                    value={value}
                    onChange={onChange}
                    error={error}
                    helperText={helperText}
                    disabled={disabled}
                    placeholder={lookupPlaceholder}
                    filters={filters}
                    searchFields={searchFields}
                    displayFields={displayFields}
                />
            </Box>
        </Box>
    );
};

export default RelatedTo;
