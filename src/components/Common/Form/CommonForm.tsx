"use client";
import { readAccessTokenString } from '@/utils/accessTokenDataStorage'

/**
 * CommonForm Component
 * 
 * A reusable form component that renders layout-driven fields with editable functionality.
 * This component uses EditableField and EditableLookupField to display values that can be
 * edited inline with a hover effect showing an edit icon.
 * 
 * Features:
 * - Layout-driven: Fetches field configurations from the layout API
 * - Editable fields: Shows edit icon on hover for allowed fields
 * - Supports multiple field types: text, select, date, textarea, lookup, etc.
 * - Section grouping: Automatically groups fields by their section property
 * - Lookup integration: Uses EditableLookupField for lookup field types
 * 
 * Usage Example:
 * ```tsx
 * <CommonForm
 *   fields={formFields}           // Array of field configurations from layout API
 *   data={recordData}              // Current record data
 *   onSave={handleSave}            // Callback function to save changes
 *   isEditPermission={true}        // Whether user has edit permissions
 *   loading={false}                // Loading state
 * />
 * ```
 * 
 * @see EditableField - For standard field types
 * @see EditableLookupField - For lookup field types
 * @see getFormFields - For fetching layout configurations
 */

import React, { useEffect, useMemo, useState } from "react";
import {
    Grid,
    Stack,
    Typography,
    Divider,
    Box,
    FormControlLabel,
    Checkbox,
    IconButton,
    Tooltip,
    Card,
    CardContent,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import EditableField from "@/components/Common/EditableField";
import EditableFirstNameField from "@/components/Common/EditableFirstNameField";
import EditableLookupField from "@/components/Common/EditableLookupField";
import EditablePicklist from "@/components/Common/EditablePicklist";
import EditableAddressField from "@/components/Common/EditableAddressField";
import EditableStageProbabilityField from "@/components/Common/EditableStageProbabilityField";
import StagePipeline from "@/components/Common/StagePipeline/StagePipeline";
import { FieldConfigNew } from "./validationSchema";
import Notes from "@/components/Customer/Detail/Notes";
import MultiFileUpload from "@/components/Common/Upload/MultiFileUpload";
import LayoutSelection from "@/components/Common/Form/LayoutSelection";
import EditableFieldContactlead from "@/components/Common/EditableFieldContactlead";
import EditableFieldRelatedto from "@/components/Common/EditableFieldRelatedto";
import EditablefieldReminder from "@/components/Common/EditablefieldReminder";
import { getComponentStagePipeline, StageProbabilityOption } from "@/services/api/general_apis/component-picklist-api";
import OrgContactListing from "@/components/Customer/Detail/OrgContactListing";
import StageHistory from "@/components/Common/RelatedList/StageHistory";
import DealRelatedList from "@/components/Common/RelatedList/DealRelatedList";
import ContactRelatedList from "@/components/Common/RelatedList/ContactRelatedList";
import AccountRelatedList from "@/components/Common/RelatedList/AccountRelatedList";
import TaskRelatedList from "@/components/Common/RelatedList/TaskRelatedList";
import ContactLead from "./FormFields/ContactLeadField";
import RelatedTo from "./FormFields/RelatedToField";
import ReminderField from "./FormFields/ReminderField";
import {
    inlineEditLabelColumnSx,
    inlineEditValueColumnSx,
    inlineEditRowRootSx,
} from "@/components/Common/inlineFieldLayout";

interface CommonFormProps {
    fields: FieldConfigNew[];
    data: any;
    onSave: (field: string, value: any) => Promise<void>;
    /** Optional: save multiple fields in one API call (used by firstname + salutation) */
    onSaveBatch?: (updates: Record<string, any>) => Promise<void>;
    isEditPermission?: boolean;
    loading?: boolean;
    moduleName?: string;
    layoutId?: string;
    /** When true, shows layout dropdown; use when layout is not pre-set (e.g. from record) */
    showLayoutSelection?: boolean;
    /** When true, layout dropdown is read-only (e.g. in view details) */
    layoutSelectionReadOnly?: boolean;
    /** Called when user selects a different layout */
    onLayoutChange?: (layoutId: string) => void;
    /** When provided, enables Notes & Attachments cards using this doctype and record name */
    docTypeForRelated?: string;
    recordNameForRelated?: string;
    /** Optional: full layout JSON content for deriving business card and other metadata */
    layoutContent?: any;
    /** Dynamic related lists to render */
    relatedLists?: any[];
    /** Callback to refresh parent data (counts, etc) */
    onRefresh?: () => void;
    /** Counter that increments when parent data changes */
    refreshTrigger?: number;
}

interface EditableCheckboxFieldProps {
    field: FieldConfigNew;
    fieldValue: any;
    isEditPermission: boolean;
    isFieldDisabled: boolean | undefined;
    onSave: (field: string, value: any) => Promise<void>;
}

const EditableCheckboxField: React.FC<EditableCheckboxFieldProps> = ({
    field,
    fieldValue,
    isEditPermission,
    isFieldDisabled,
    onSave,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [hover, setHover] = useState(false);
    const [tempValue, setTempValue] = useState(Boolean(fieldValue));

    const handleSave = async () => {
        await onSave(field.name, tempValue);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setTempValue(Boolean(fieldValue));
        setIsEditing(false);
    };

    const handleEdit = () => {
        setTempValue(Boolean(fieldValue));
        setIsEditing(true);
    };

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
                {field.label}:
            </Typography>

            <Box sx={inlineEditValueColumnSx}>
            {isEditing ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0, width: "100%" }}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={tempValue}
                                onChange={(e) => setTempValue(e.target.checked)}
                                name={field.name}
                                disabled={isFieldDisabled}
                            />
                        }
                        label=""
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
            ) : (
                <>
                    {hover && isEditPermission && !isEditing && !isFieldDisabled ? (
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
                                {fieldValue ? "Yes" : "No"}
                            </Box>
                            <Tooltip title="Edit">
                                <IconButton size="small" onClick={handleEdit}>
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
                            {fieldValue ? "Yes" : "No"}
                        </Typography>
                    )}
                </>
            )}
            </Box>
        </Box>
    );
};

// Fields that are always read-only and show a paired timestamp
const META_FIELD_CONFIG: Record<string, string> = {
    created_by: "creation",
    modified_by: "modified",
};

const formatMetaDate = (isoDate?: string): string => {
    if (!isoDate) return "";
    const d = new Date(isoDate);
    return (
        d.toLocaleDateString("en-US", {
            weekday: "short",
            day: "2-digit",
            month: "short",
            year: "numeric",
        }) +
        " " +
        d.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        })
    );
};

interface ReadOnlyMetaFieldProps {
    label: string;
    value: string;
    dateValue?: string;
}

const ReadOnlyMetaField: React.FC<ReadOnlyMetaFieldProps> = ({ label, value, dateValue }) => (
    <Box display="flex" alignItems="flex-start" justifyContent="flex-start" gap={0} flexDirection="row" sx={inlineEditRowRootSx}>
        <Typography
            className="font-medium text-1xl"
            color="GrayText"
            sx={inlineEditLabelColumnSx}
        >
            {label}:
        </Typography>
        <Box sx={{ ...inlineEditValueColumnSx, padding: "1px 0 0 0" }}>
            {value && (
                <Typography
                    variant="body2"
                    sx={{ fontWeight: 500 }}
                    color="var(--mui-palette-secondary-dark)"
                >
                    {value}
                </Typography>
            )}
            {dateValue && (
                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                    {formatMetaDate(dateValue)}
                </Typography>
            )}
        </Box>
    </Box>
);

const CommonForm: React.FC<CommonFormProps> = ({
    fields,
    data,
    onSave,
    onSaveBatch,
    isEditPermission = true,
    loading = false,
    moduleName,
    layoutId,
    showLayoutSelection,
    layoutSelectionReadOnly,
    onLayoutChange,
    docTypeForRelated,
    recordNameForRelated,
    layoutContent,
    relatedLists = [],
    onRefresh,
    refreshTrigger,
}) => {
    const stageField = useMemo(
        () => fields.find((f) => String(f?.type ?? "").toLowerCase() === "stage"),
        [fields]
    );

    const [pipelineStages, setPipelineStages] = useState<StageProbabilityOption[]>([]);
    const [pipelineLoading, setPipelineLoading] = useState(false);
    const [contactLeadType, setContactLeadType] = useState<string>("Contact");
    const [relatedToTypes, setRelatedToTypes] = useState<Record<string, "CRM Organization" | "CRM Deal">>({});

    useEffect(() => {
        const loadStages = async () => {
            if (!stageField || !moduleName || !layoutId) {
                setPipelineStages([]);
                return;
            }
            const token = readAccessTokenString();
            if (!token) {
                setPipelineStages([]);
                return;
            }

            setPipelineLoading(true);
            try {
                const res = await getComponentStagePipeline(moduleName, layoutId, stageField.name, token);
                setPipelineStages(Array.isArray(res) ? res : []);
            } finally {
                setPipelineLoading(false);
            }
        };

        loadStages();
    }, [stageField?.name, moduleName, layoutId]);

    // Extract business card configuration
    const businessCardFields = useMemo(() => {
        const enabled = !!layoutContent?.business_card_enabled;
        let selectedFields = layoutContent?.business_card_config || layoutContent?.business_card_fields || [];

        if (typeof selectedFields === "string") {
            try { selectedFields = JSON.parse(selectedFields); } catch { selectedFields = []; }
        }

        if (!enabled || !Array.isArray(selectedFields) || selectedFields.length === 0) return [];

        return selectedFields
            .map((item: any) => {
                if (!item) return null;

                const isObject = typeof item === "object";
                const targetId = isObject ? (item.name || item.id || item.fieldname) : item;
                if (!targetId) return null;

                const idLower = String(targetId).toLowerCase().trim();

                // Try to find in main fields list for additional properties (like componentProps)
                const mainField = fields.find((f: any) => {
                    const fname = String(f.name || "").toLowerCase().trim();
                    const flabel = String(f.label || "").toLowerCase().trim();
                    const fid = String(f.id || "").toLowerCase().trim();
                    return fid === idLower || fname === idLower || flabel === idLower;
                });

                // If it's a full field definition in config, use it (enriched by mainField if possible)
                if (isObject && item.type && item.label) {
                    return { ...mainField, ...item, hide: false, visible: true } as FieldConfigNew;
                }

                return mainField ? { ...mainField, hide: false, visible: true } : null;
            })
            .filter(Boolean) as FieldConfigNew[];
    }, [layoutContent, fields]);

    // Group fields by section
    const groupedFields = fields.reduce(
        (acc, field) => {
            const section = field.section || "General Information";
            if (!acc[section]) {
                acc[section] = [];
            }
            // Only include fields that are not hidden
            if (!field.hide) {
                acc[section].push(field);
            }
            return acc;
        },
        {} as Record<string, FieldConfigNew[]>
    );

    const renderField = (field: FieldConfigNew) => {
        const fieldValue = data?.[field.name] || "";

        // Determine if field is disabled (handle both boolean and function)
        const isFieldDisabled = typeof field.disable === "function"
            ? field.disable(data)
            : field.disable;

        // created_by / modified_by / owner — always read-only, shows paired timestamp
        if (META_FIELD_CONFIG[field.name]) {
            const dateField = META_FIELD_CONFIG[field.name];
            return (
                <ReadOnlyMetaField
                    label={field.label}
                    value={fieldValue}
                    dateValue={data?.[dateField]}
                />
            );
        }

        // Handle lookup field type
        if (field.type === "lookup") {
            return (
                <EditableLookupField
                    label={field.label}
                    field={field.name}
                    value={fieldValue}
                    onSave={onSave}
                    isEditPermission={isEditPermission && !isFieldDisabled}
                    doctype={field.doctype || ""}
                    referenceDoctype={field.referenceDoctype}
                    filters={field.filters}
                    searchFields={field.searchFields || field.search_fields}
                    displayFields={field.displayFields || field.display_fields}
                />
            );
        }

        // Handle address fields (store address name, show details, edit via dialog)
        if (field.type === "address") {
            const fieldValue = data?.[field.name] || "";
            return (
                <EditableAddressField
                    label={field.label}
                    field={field.name}
                    docName={data?.name}
                    value={fieldValue}
                    isEditPermission={isEditPermission && !isFieldDisabled}
                    onSave={onSave}
                />
            );
        }

        // First name: salutation + text (same UX as CustomForm firstname)
        if ((field.type as string) === "firstname") {
            return (
                <EditableFirstNameField
                    field={field}
                    data={data || {}}
                    onSave={onSave}
                    onSaveBatch={onSaveBatch}
                    isEditPermission={isEditPermission}
                    isFieldDisabled={isFieldDisabled}
                />
            );
        }

        // Handle picklist field type with color-aware display
        if (field.type === "picklist") {
            const options = (field.options || []) as any[];
            const selected = options.find((opt: any) =>
                typeof opt === "string"
                    ? opt === fieldValue
                    : opt.value === fieldValue
            ) as any;
            const displayColor =
                selected && typeof selected === "object" ? selected.color : undefined;

            return (
                <EditableField
                    label={field.label}
                    field={field.name}
                    value={fieldValue}
                    type="select"
                    options={options as any}
                    onSave={onSave}
                    isEditpermission={isEditPermission && !isFieldDisabled}
                    displayColor={displayColor}
                />
            );
        }

        // Handle select/autocomplete field type
        if (field.type === "select" || field.type === "autocomplete") {
            return (
                <EditablePicklist
                    label={field.label}
                    field={field.name}
                    value={fieldValue}
                    module={moduleName || ""}
                    layoutName={layoutId || ""}
                    parentValue={field.dependsOn ? data?.[field.dependsOn] : undefined}
                    onSave={onSave}
                    isEditPermission={isEditPermission && !isFieldDisabled}
                />
            );
        }

        // Handle date field type
        if (field.type === "date" || field.type === "datetime") {
            return (
                <EditableField
                    label={field.label}
                    field={field.name}
                    value={fieldValue}
                    type="date"
                    onSave={onSave}
                    isEditpermission={isEditPermission && !isFieldDisabled}
                />
            );
        }

        // Handle stage probability field type
        if (String(field.type ?? "").toLowerCase() === "stage") {
            return (
                <EditableStageProbabilityField
                    label={field.label}
                    field={field.name}
                    value={fieldValue as any}
                    module={moduleName || ""}
                    layoutName={layoutId || ""}
                    onSave={onSave}
                    onSaveBatch={onSaveBatch}
                    isEditPermission={isEditPermission && !isFieldDisabled}
                />
            );
        }

        // Handle textarea
        if (field.type === "textarea" || field.type === "multiline") {
            return (
                <EditableField
                    label={field.label}
                    field={field.name}
                    value={fieldValue}
                    type="textarea"
                    onSave={onSave}
                    isEditpermission={isEditPermission && !isFieldDisabled}
                />
            );
        }

        // Handle checkbox - editable checkbox component
        if (field.type === "checkbox") {
            return <EditableCheckboxField
                field={field}
                fieldValue={fieldValue}
                isEditPermission={isEditPermission}
                isFieldDisabled={isFieldDisabled}
                onSave={onSave}
            />;
        }

        if (String(field.type).toLowerCase() === "contactlead") {
            return (
                <EditableFieldContactlead
                    label={field.label}
                    field={field}
                    value={fieldValue}
                    onSave={onSave}
                    isEditPermission={isEditPermission}
                    onTypeChange={setContactLeadType}
                    onRelatedData={(relatedData) => {
                        console.log("CommonForm: Received onRelatedData:", relatedData);
                        if (relatedData.related_to) {
                            const relatedToField = fields.find(
                                (f) => String(f.type).toLowerCase() === "relatedto"
                            );
                            console.log("CommonForm: Found relatedToField:", relatedToField?.name);
                            if (relatedToField) {
                                onSave(relatedToField.name, relatedData.related_to);
                                if (relatedData.related_to_type) {
                                    console.log("CommonForm: Setting relatedToType for", relatedToField.name, "to", relatedData.related_to_type);
                                    setRelatedToTypes((prev) => ({
                                        ...prev,
                                        [relatedToField.name]: relatedData.related_to_type as any,
                                    }));
                                }
                            }
                        }
                    }}
                />
            );
        }

        if (String(field.type).toLowerCase() === "relatedto") {
            return (
                <EditableFieldRelatedto
                    label={field.label}
                    field={field}
                    value={fieldValue}
                    type={relatedToTypes[field.name]}
                    onSave={onSave}
                    isEditPermission={isEditPermission}
                    onTypeChange={(type) =>
                        setRelatedToTypes((prev) => ({
                            ...prev,
                            [field.name]: type,
                        }))
                    }
                    disabled={contactLeadType !== "Contact"}
                />
            );
        }

        if (String(field.type).toLowerCase() === "reminder") {
            return (
                <EditablefieldReminder
                    label={field.label}
                    field={field}
                    value={fieldValue}
                    onSave={onSave}
                    isEditPermission={isEditPermission}
                />
            );
        }

        // Handle switch - display as text (read-only)
        if (field.type === "switch") {
            return (
                <EditableField
                    label={field.label}
                    field={field.name}
                    value={fieldValue ? "Yes" : "No"}
                    onSave={onSave}
                    isEditpermission={false} // Usually displayed as read-only
                />
            );
        }

        // Default text field
        return (
            <EditableField
                label={field.label}
                field={field.name}
                value={fieldValue}
                type="text"
                onSave={onSave}
                isEditpermission={isEditPermission && !isFieldDisabled}
                max_length={field.max_length ?? 255}
            />
        );
    };

    const resolvedRecordName = recordNameForRelated || data?.name;
    const resolvedDocType = docTypeForRelated || moduleName || "";
    const currentStageValue = stageField ? (data?.[stageField.name] ?? "") : "";
    const startDateValue = (data?.creation ?? data?.start_date ?? data?.start ?? null) as any;
    const closingDateValue = (data?.closed_date ?? data?.close_date ?? data?.closing_date ?? null) as any;

    const handlePipelineChange = async (stage: StageProbabilityOption) => {
        if (!stageField) return;

        const updates: Record<string, any> = {
            [stageField.name]: stage.value ?? stage.label ?? "",
        };

        const hasProb = fields.some((f) => String(f?.name) === "probability");
        const hasRecordCat = fields.some((f) => String(f?.name) === "record_category");
        const hasForecast = fields.some((f) => String(f?.name) === "forecast_category");

        if (hasProb) updates.probability = stage.probability ?? 0;
        if (hasRecordCat) updates.record_category = stage.record_category ?? "";
        if (hasForecast) updates.forecast_category = stage.forecast_category ?? "";

        if (onSaveBatch) {
            await onSaveBatch(updates);
        } else {
            // Fallback: save stage first, then dependent fields
            await onSave(stageField.name, updates[stageField.name]);
            if (hasProb) await onSave("probability", updates.probability);
            if (hasRecordCat) await onSave("record_category", updates.record_category);
            if (hasForecast) await onSave("forecast_category", updates.forecast_category);
        }
    };

    return (
        <Box sx={{ pt: 7, px: 2 }}>
            {showLayoutSelection && moduleName && onLayoutChange && (
                <Box sx={{ mb: 2 }}>
                    <LayoutSelection
                        module={moduleName}
                        value={layoutId}
                        readOnly={layoutSelectionReadOnly}
                        onLayoutChange={onLayoutChange}
                        compact
                    />
                </Box>
            )}
            {stageField && (
                <Card sx={{ mb: 4, boxShadow: "0px 0px 10px 0px rgba(0, 0, 0, 0.1)" }} className="border">
                    <CardContent>

                        <Box sx={{ mb: 3 }}>
                            <StagePipeline
                                stages={pipelineStages}
                                currentStage={String(currentStageValue || "")}
                                onChange={handlePipelineChange}
                                disabled={!isEditPermission}
                                showActions
                                startDate={startDateValue}
                                closingDate={closingDateValue}
                                loading={pipelineLoading}
                            />
                        </Box>
                    </CardContent>
                </Card>
            )}
            {businessCardFields.length > 0 && (
                <Card sx={{ mb: 4, boxShadow: "0px 0px 10px 0px rgba(0, 0, 0, 0.1)" }} className="border">
                    <CardContent>
                        <Stack direction="column" spacing={2}>
                            {businessCardFields.map((field) => (
                                <Box key={field.name} sx={{ width: "100%" }}>
                                    {renderField(field)}
                                </Box>
                            ))}
                        </Stack>
                    </CardContent>
                </Card>
            )}
            <Card sx={{ mb: 4, boxShadow: "0px 0px 10px 0px rgba(0, 0, 0, 0.1)" }} className="border">
                <CardContent>
                    {Object.entries(groupedFields).map(([section, sectionFields], index) => {
                        const isSingleCol = (sectionFields[0]?.section_column_count ?? 2) === 1;
                        return (
                            <Box key={section} sx={{ mb: index < Object.entries(groupedFields).length - 1 ? 4 : 0 }}>
                                <Typography variant="h6" sx={{ mb: 2 }}>
                                    {section}
                                </Typography>
                                <Divider sx={{ borderBottomWidth: "2px", mb: 3 }} />
                                {isSingleCol ? (
                                    // Single-column: each field spans full width
                                    <Stack direction="column" spacing={2}>
                                        {sectionFields.map((field) => (
                                            <Box key={field.name} sx={{ width: "100%" }}>
                                                {renderField(field)}
                                            </Box>
                                        ))}
                                    </Stack>
                                ) : (
                                    // Double-column: two fields per row
                                    <Grid container spacing={2}>
                                        {sectionFields.map((field) => (
                                            <Grid item xs={field.fullwidth ? 12 : 6} key={field.name}>
                                                {renderField(field)}
                                            </Grid>
                                        ))}
                                    </Grid>
                                )}
                            </Box>
                        );
                    })}
                </CardContent>
            </Card>
            {relatedLists.map((rl) => {
                const label = rl.label || rl.name || "Related List";
                const isNotes = label.toLowerCase().includes("notes");
                const isAttachments = label.toLowerCase().includes("attachments");
                const isDeals = label.toLowerCase().includes("deal");
                const isContacts = label.toLowerCase().includes("contact");
                const isTasks = label.toLowerCase().includes("task");
                const isStageHistory = rl.link_field_name === "stage_history";

                if (isNotes) {
                    return (
                        <Card key={rl.id || rl.name} id="related-notes" sx={{ mb: 4, boxShadow: "0px 0px 10px 0px rgba(0, 0, 0, 0.1)" }} className="border">
                            <CardContent>
                                <Typography variant="h6" sx={{ mb: 2 }}>
                                    {label}
                                </Typography>
                                <Divider sx={{ borderBottomWidth: "2px", mb: 3 }} />
                                <Notes link_name={resolvedRecordName} doc_type={resolvedDocType} onRefresh={onRefresh} />
                            </CardContent>
                        </Card>
                    );
                }

                if (isAttachments) {
                    return (
                        <Card key={rl.id || rl.name} id="related-attachments" sx={{ mb: 4, boxShadow: "0px 0px 10px 0px rgba(0, 0, 0, 0.1)" }} className="border">
                            <CardContent>
                                <MultiFileUpload
                                    attachedToDoctype={resolvedDocType}
                                    attachedToName={resolvedRecordName}
                                    allowedTypes={["image/*", "application/pdf"]}
                                    folder="Home/Attachments"
                                    maxFiles={5}
                                    heading={""}
                                    btnHeading={"Attach"}
                                    onUploadComplete={() => undefined}
                                    onRefresh={onRefresh}
                                />
                            </CardContent>
                        </Card>
                    );
                }

                if (isDeals) {
                    return (
                        <Card key={rl.id || rl.name} id="related-deals" sx={{ mb: 4, boxShadow: "0px 0px 10px 0px rgba(0, 0, 0, 0.1)" }} className="border">
                            <CardContent>
                                <DealRelatedList
                                    parent_module={moduleName || ""}
                                    parent_doctype={resolvedDocType}
                                    link_name={resolvedRecordName}
                                    config={rl}
                                    onRefresh={onRefresh}
                                    refreshTrigger={refreshTrigger}
                                />
                            </CardContent>
                        </Card>
                    );
                }

                if (isContacts) {
                    return (
                        <Card key={rl.id || rl.name} id="related-contacts" sx={{ mb: 4, boxShadow: "0px 0px 10px 0px rgba(0, 0, 0, 0.1)" }} className="border">
                            <CardContent>
                                <ContactRelatedList
                                    parent_module={moduleName || ""}
                                    parent_doctype={resolvedDocType}
                                    link_name={resolvedRecordName}
                                    config={rl}
                                    onRefresh={onRefresh}
                                    refreshTrigger={refreshTrigger}
                                />
                            </CardContent>
                        </Card>
                    );
                }

                if (isTasks) {
                    return (
                        <Card key={rl.id || rl.name} id="related-tasks" sx={{ mb: 4, boxShadow: "0px 0px 10px 0px rgba(0, 0, 0, 0.1)" }} className="border">
                            <CardContent>
                                <TaskRelatedList
                                    parent_module={moduleName || ""}
                                    parent_doctype={resolvedDocType}
                                    link_name={resolvedRecordName}
                                    config={rl}
                                    onRefresh={onRefresh}
                                    refreshTrigger={refreshTrigger}
                                />
                            </CardContent>
                        </Card>
                    );
                }

                if (label.toLowerCase().includes("account")) {
                    return (
                        <Card key={rl.id || rl.name} id="related-accounts" sx={{ mb: 4, boxShadow: "0px 0px 10px 0px rgba(0, 0, 0, 0.1)" }} className="border">
                            <CardContent>
                                <AccountRelatedList
                                    parent_module={moduleName || ""}
                                    parent_doctype={resolvedDocType}
                                    link_name={resolvedRecordName}
                                    config={rl}
                                    onRefresh={onRefresh}
                                    refreshTrigger={refreshTrigger}
                                />
                            </CardContent>
                        </Card>
                    );
                }

                if (isStageHistory) {
                    return (
                        <Card key={rl.id || rl.name} id="related-stage-history" sx={{ mb: 4, boxShadow: "0px 0px 10px 0px rgba(0, 0, 0, 0.1)" }} className="border">
                            <CardContent>
                                <StageHistory
                                    module={moduleName || ""}
                                    module_name={resolvedDocType}
                                    layout_name={layoutId || ""}
                                    link_name={resolvedRecordName}
                                    onRefresh={onRefresh}
                                    refreshTrigger={refreshTrigger}
                                />
                            </CardContent>
                        </Card>
                    );
                }

                return null;
            })}

            {/* Fallback for Notes & Attachments if not in relatedLists (to keep existing behavior) */}
            {relatedLists.length === 0 && resolvedRecordName && resolvedDocType && (
                <>
                    <Card sx={{ mb: 4, boxShadow: "0px 0px 10px 0px rgba(0, 0, 0, 0.1)" }} className="border">
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                Notes
                            </Typography>
                            <Divider sx={{ borderBottomWidth: "2px", mb: 3 }} />
                            <Notes link_name={resolvedRecordName} doc_type={resolvedDocType} />
                        </CardContent>
                    </Card>
                    <Card sx={{ mb: 4, boxShadow: "0px 0px 10px 0px rgba(0, 0, 0, 0.1)" }} className="border">
                        <CardContent>
                            <MultiFileUpload
                                attachedToDoctype={resolvedDocType}
                                attachedToName={resolvedRecordName}
                                allowedTypes={["image/*", "application/pdf"]}
                                folder="Home/Attachments"
                                maxFiles={5}
                                heading={""}
                                btnHeading={"Attach"}
                                onUploadComplete={() => undefined}
                            />
                        </CardContent>
                    </Card>
                </>
            )}
        </Box>
    );
};

export default CommonForm;

