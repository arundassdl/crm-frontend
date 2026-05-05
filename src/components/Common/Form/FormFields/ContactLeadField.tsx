"use client";
import { readAccessTokenString } from '@/utils/accessTokenDataStorage'

import React, { useEffect, useMemo, useState } from "react";
import { Box, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from "@mui/material";
import LookupField from "./LookupField";
import { getDocument } from "@/services/api/common-erpnext-api/create-edit-api";

type ContactLeadType = "Contact" | "CRM Lead";

interface ContactLeadFieldProps {
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
  onTypeChange?: (type: ContactLeadType) => void;
  onRelatedData?: (data: any) => void;
}

const FIELD_OPTIONS: { label: string; value: ContactLeadType }[] = [
  { label: "Contact", value: "Contact" },
  { label: "Lead", value: "CRM Lead" },
];

const resolveInitialType = (doctype?: string, referenceDoctype?: string): ContactLeadType => {
  const candidate = String(referenceDoctype || doctype || "").trim().toLowerCase();
  if (candidate === "crm lead" || candidate === "lead") return "CRM Lead";
  return "Contact";
};

const ContactLead: React.FC<ContactLeadFieldProps> = ({
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
  onTypeChange,
  onRelatedData,
}) => {
  const [selectedType, setSelectedType] = useState<ContactLeadType>(
    resolveInitialType(doctype, referenceDoctype)
  );
  const typeLabelId = `${fieldName || "contactlead"}-type-label`;

  useEffect(() => {
    const initialType = resolveInitialType(doctype, referenceDoctype);
    setSelectedType(initialType);
    if (onTypeChange) onTypeChange(initialType);
  }, [doctype, referenceDoctype]);

  const lookupPlaceholder = useMemo(() => {
    if (placeholder) return placeholder;
    return selectedType === "Contact" ? "Search Contact" : "Search Lead";
  }, [placeholder, selectedType]);

  const handleTypeChange = (event: SelectChangeEvent<ContactLeadType>) => {
    const nextType = event.target.value as ContactLeadType;
    setSelectedType(nextType);
    if (onTypeChange) onTypeChange(nextType);
    // Prevent stale selected value when switching doctype.
    onChange(null);
  };

  return (
    <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
      <FormControl sx={{ minWidth: 180 }} disabled={disabled}>
        {/* <InputLabel id={typeLabelId}>Type</InputLabel> */}
        <Select
          labelId={typeLabelId}
          value={selectedType}
          label=""
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
          label=""
          value={value}
          onChange={async (val) => {
            console.log("ContactLead: onChange triggered", { val, selectedType, hasOnRelatedData: !!onRelatedData });
            onChange(val);
            if (val && selectedType === "Contact" && onRelatedData) {
              console.log("ContactLead: Conditions met, fetching details via getDocument standard API...");
              const token = readAccessTokenString();
              if (token) {
                try {
                  const details = await getDocument("Contact", val, token);
                  console.log("ContactLead: Received details via getDocument for", val, details);

                  // Use account_name as specified, with fallbacks
                  const accountName = details?.account_name || details?.company_name || details?.customer;

                  if (accountName) {
                    console.log("ContactLead: Notifying related account:", accountName);
                    onRelatedData({
                      related_to: accountName,
                      related_to_type: "CRM Organization"
                    });
                  } else {
                    console.warn("ContactLead: No account_name or fallback found in details:", details);
                  }
                } catch (err) {
                  console.error("Error fetching contact details via getDocument:", err);
                }
              }
            }
          }}
          error={error}
          helperText={helperText}
          disabled={disabled}
          placeholder=""
          filters={filters}
          searchFields={searchFields}
          displayFields={displayFields}
        />
      </Box>
    </Box>
  );
};

export default ContactLead;
