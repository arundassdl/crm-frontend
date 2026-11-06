"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import dynamic from "next/dynamic";
import { createResource } from "@/services/api/common-erpnext-api/create-edit-api";
import { getQuickCreateFormFields } from "@/services/api/general_apis/layout-api";
import { showToast } from "@/components/ToastNotificationNew";
import { v4 as uuidv4 } from "uuid";
import { useCrmSession } from "@/components/CrmSessionContext";

// Avoid static import to prevent a circular dependency:
// LookupField -> QuickCreatePopup -> CustomForm -> LookupField
const CustomForm = dynamic(
  () => import("@/components/Common/Form/Drawer/CustomForm"),
  { ssr: false }
) as any;

type QuickCreatePopupProps = {
  open: boolean;
  onClose: () => void;
  moduleLabel: string;
  moduleForApi: string;
  createDoctype: string;
  role: string;
  onCreated: (createdName: string) => void;
};

type QuickCreateFieldResponse = {
  name: string;
  label: string;
  type: string;
  frontend_fieldtype: string;
  section_column_count?: 1 | 2;
  placeholder?: string;
  section?: string;
  validate?: boolean;
  disable?: boolean;
  hide?: boolean;
  in_list_view?: boolean;
  max_length?: number;
};

const initialValueForType = (fieldType: string) => {
  if (fieldType === "checkbox") return false;
  if (fieldType === "switch") return false;
  return "";
};

export default function QuickCreatePopup({
  open,
  onClose,
  moduleLabel,
  moduleForApi,
  createDoctype,
  role,
  onCreated,
}: QuickCreatePopupProps) {
  const session = useCrmSession();
  const currentUser = session?.userId || "";

  const [fieldsLoading, setFieldsLoading] = useState(false);
  const [qcLayoutId, setQcLayoutId] = useState<string>("");
  const [qcFields, setQcFields] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchFields = async () => {
      if (!open) return;

      if (!session) {
        showToast("Your CRM session has ended. Please launch CRM again.", "warning");
        return;
      }
      if (!moduleForApi || !createDoctype) {
        showToast("Quick create is not configured for this module.", "warning");
        return;
      }

      setFieldsLoading(true);
      try {
        const res = await getQuickCreateFormFields(
          moduleForApi,
          role || "",
          ""
        );
        const message = res?.message ?? res;

        const fieldsFromApi: QuickCreateFieldResponse[] = Array.isArray(message?.fields)
          ? (message.fields as any)
          : [];

        setQcLayoutId(message?.name || "");

        const mappedFields = fieldsFromApi.map((f: any) => {
          // Preserve lookup/address metadata from the API response
          // so LookupField can execute `/api/search-link` correctly.
          const sectionColumnCount =
            f.section_column_count === 1 || f.section_column_count === 2
              ? f.section_column_count
              : 2;

          const fieldType = f.frontend_fieldtype || f.type;

          return {
            ...f,
            name: f.name,
            label: f.label || f.name,
            type: fieldType,
            placeholder: f.placeholder || "",
            validate: !!f.validate,
            disable: !!f.disable,
            hide: !!f.hide,
            // Quick Create design: no section headings; single-column per field row.
            section: "",
            section_column_count: 1,
            max_length: f.max_length,

            // Normalize possible snake_case keys
            referenceDoctype: f.referenceDoctype || f.reference_doctype,
            doctype: f.doctype || f.referenceDoctype || f.reference_doctype,
            filters: f.filters,
            searchFields: f.searchFields || f.search_fields,
            displayFields: f.displayFields || f.display_fields,
          };
        });

        setQcFields(mappedFields);
      } catch (e: any) {
        console.error("QuickCreatePopup fetchFields error:", e);
        showToast("Failed to load quick create form fields.", "error");
      } finally {
        setFieldsLoading(false);
      }
    };

    fetchFields();
  }, [open, moduleForApi, createDoctype, role, session]);

  const initialValues = useMemo(() => {
    const base: Record<string, any> = {};
    for (const f of qcFields) {
      if (f.name === "owner" && currentUser) {
        base[f.name] = currentUser;
      } else {
        base[f.name] = initialValueForType(String(f.type));
      }
    }
    // Custom create flows in this app pass layout_id; Quick Create response includes the layout `name`.
    if (qcLayoutId) base.layout_id = qcLayoutId;
    return base;
  }, [qcFields, qcLayoutId, currentUser]);

  const handleSubmit = async (values: any, action: any) => {
    if (!session) {
      showToast("Your CRM session has ended. Please launch CRM again.", "warning");
      action.setSubmitting(false);
      return;
    }
    setSubmitting(true);
    try {
      const payload: Record<string, any> = { ...values };

      // If the quick-create includes Address fields, create Address docs first
      // and replace the field value with the created Address `name`.
      const addressFieldNames = (qcFields || [])
        .filter((f: any) => f.type === "address")
        .map((f: any) => f.name);

      const docKey = `quickcreate_${uuidv4().split("-")[0]}`;

      for (const fieldName of addressFieldNames) {
        const addrVal = payload[fieldName];
        if (!addrVal || typeof addrVal !== "object") continue;

        let address_title: string =
          addrVal.address_title ||
          addrVal.flat ||
          addrVal.address_line1 ||
          addrVal.city ||
          "Address";

        // Match `createCustomMultipleDocuments` behavior:
        // force address_title to `${docKey}-${fieldName}` when docKey exists.
        address_title = `${docKey}-${fieldName}`;

        const addressPayload: any = {
          address_title,
          address_type: addrVal.address_type || "Billing",
          address_line1: addrVal.address_line1 || "",
          address_line2: addrVal.flat || addrVal.address_line2 || "",
          city: addrVal.city || "",
          state: addrVal.state || "",
          country: addrVal.country || "",
          pincode: addrVal.pincode || "",
        };

        if (addrVal.latitude) addressPayload.latitude = addrVal.latitude;
        if (addrVal.longitude) addressPayload.longitude = addrVal.longitude;

        const addressRes: any = await createResource(
          "Address",
          addressPayload,
          ""
        );

        if (!addressRes?.success || !addressRes?.data?.name) {
          throw new Error(
            addressRes?.error?.message ||
              addressRes?.error ||
              `Failed to create Address for ${fieldName}`
          );
        }

        payload[fieldName] = addressRes.data.name;
      }

      // Contact quick-create requires ERPNext Contact child-table shaping,
      // mirroring `src/components/Contact/Createcontact.tsx`.
      const res: any = await (() => {
        if (createDoctype === "Contact") {
          const emailFields = (qcFields || []).filter((f: any) => f.type === "email");
          const emailIds = emailFields
            .filter((f: any) => payload[f.name])
            .map((f: any, index: number) => ({
              doctype: "Contact Email",
              parentfield: "contact_emails",
              parenttype: "Contact",
              email_id: payload[f.name],
              is_primary: index === 0 ? 1 : 0,
            }));

          const phoneFields = (qcFields || []).filter(
            (f: any) => f.type === "phone" || f.type === "mobile_no"
          );
          const phoneNos = phoneFields
            .filter((f: any) => payload[f.name])
            .map((f: any, index: number) => ({
              doctype: "Contact Phone",
              parentfield: "phone_nos",
              parenttype: "Contact",
              phone: payload[f.name],
              is_primary_phone: f.type === "phone" && index === 0 ? 1 : 0,
              is_primary_mobile_no: f.type === "mobile_no" && index === 0 ? 1 : 0,
            }));

          const accountPicklistFields = (qcFields || []).filter(
            (f: any) =>
              f.type === "lookup" &&
              (f.name === "account_name" ||
                f.doctype === "Accounts" ||
                f.referenceDoctype === "Accounts" ||
                f.doctype === "CRM Organization" ||
                f.referenceDoctype === "CRM Organization")
          );
          const dynamicLinks = accountPicklistFields
            .filter((f: any) => payload[f.name])
            .map((f: any) => ({
              doctype: "Dynamic Link",
              parentfield: "links",
              parenttype: "Contact",
              link_doctype: f.doctype,
              link_name: payload[f.name],
            }));

          const dataWithLayout: Record<string, any> = {
            ...payload,
            layout_id: payload.layout_id ?? qcLayoutId,
          };

          if (emailIds.length > 0) dataWithLayout.email_ids = emailIds;
          if (phoneNos.length > 0) dataWithLayout.phone_nos = phoneNos;
          if (dynamicLinks.length > 0) dataWithLayout.links = dynamicLinks;

          // Some create flows provide `link_name` to set `company_name`.
          if (dataWithLayout.link_name) {
            dataWithLayout.company_name = dataWithLayout.link_name;
          }

          // API expects `salutation` not `<first_name>_salutation`.
          if (dataWithLayout.first_name_salutation) {
            dataWithLayout.salutation = dataWithLayout.first_name_salutation;
            delete dataWithLayout.first_name_salutation;
          }

          return createResource(createDoctype, dataWithLayout, "");
        }

        return createResource(createDoctype, payload, "");
      })();

      if (!res?.success) {
        showToast(res?.error || "Failed to create record.", "warning");
        return;
      }

      const createdName = res?.data?.name || res?.data?.docname;

      if (!createdName) {
        showToast("Record created, but could not read the new name.", "warning");
        return;
      }

      showToast(`${moduleLabel} created successfully`, "success");
      onCreated(createdName);
      onClose();
    } catch (e: any) {
      console.error("QuickCreatePopup submit error:", e);
      showToast(e?.message || "Failed to create record.", "error");
    } finally {
      setSubmitting(false);
      action.setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          maxHeight: "900px",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography variant="h6">{`Quick Create: ${moduleLabel}`}</Typography>
        <IconButton onClick={onClose} aria-label="Close quick create">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          {fieldsLoading ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                p: 3,
              }}
            >
              <CircularProgress />
            </Box>
          ) : (
            <CustomForm
              fields={qcFields}
              initialValues={initialValues}
              onClose={onClose}
              onSubmit={handleSubmit}
              mode="New"
              moduleName={moduleForApi}
              layoutId={qcLayoutId}
              loading={submitting}
              cancelLabel="Cancel"
              submitLabel="Save and Associate"
              variant="quickCreate"
            />
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}

