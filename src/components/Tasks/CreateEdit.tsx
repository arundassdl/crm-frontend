import React, { useEffect, useState } from "react";
import { useCrmSession } from "@/components/CrmSessionContext";
import { Box } from "@mui/material";
import DrawerComponent from "@/components/Common/Form/Drawer/DrawerComponent";
import CustomForm from "@/components/Common/Form/Drawer/CustomForm";
import { FieldConfigNew } from "@/components/Common/Form/validationSchema";
import { showToast } from "@/components/ToastNotificationNew";
import { createCustomDocument, updateFieldCustomDocument } from "@/services/api/common-erpnext-api/create-edit-api";
import { getFormFields, getLayoutList } from "@/services/api/general_apis/layout-api";
import { getLayout } from "@/services/api/crm/crm-api";
import LayoutSelection from "@/components/Common/Form/LayoutSelection";
import { formatCalDate } from "@/services/api/common-erpnext-api/libs/utils";

interface AddEditTaskDrawerProps {
  initialValues: any;
  open: boolean;
  onClose: () => void;
  operation: string;
  onSubmit?: () => void;
  reference_doctype?: string;
  reference_docname?: string;
}

export default function AddEditTaskDrawer({
  initialValues,
  open,
  onClose,
  operation,
  onSubmit,
  reference_doctype = "",
  reference_docname = "",
}: AddEditTaskDrawerProps) {
  const module = "CRM Task";
  const moduleName = "Tasks";

  // Opened as "New" from a specific record's detail page → prefill + lock the reference.
  const hasReferenceContext = operation === "New" && !!reference_doctype && !!reference_docname;
  const referenceTypeLower = String(reference_doctype || "").trim().toLowerCase();
  const isLeadReferenceContext = hasReferenceContext && (referenceTypeLower === "crm lead" || referenceTypeLower === "lead");

  const [isFieldsFetched, setIsFieldsFetched] = useState(false);
  const session = useCrmSession();
  const [formFields, setFormFields] = useState<FieldConfigNew[]>([]);
  const [selectedLayoutId, setSelectedLayoutId] = useState<string>("");
  const [layoutCount, setLayoutCount] = useState<number>(0);

  useEffect(() => {
    const fetchLayouts = async () => {
      if (!session) return;
      const layouts = await getLayoutList(moduleName, "", "");
      const count = Array.isArray(layouts) ? layouts.length : 0;
      setLayoutCount(count);

      if (count === 1 && layouts[0]?.value) {
        setSelectedLayoutId(layouts[0].value);
      } else if (count === 0) {
        setIsFieldsFetched(true);
      }
    };

    fetchLayouts();
  }, [session]);

  useEffect(() => {
    const fetchFormFields = async () => {
      if (!session || !selectedLayoutId) {
        if (!selectedLayoutId) setIsFieldsFetched(false);
        return;
      }

      setIsFieldsFetched(false);
      const [res, layoutData]: any[] = await Promise.all([
        getFormFields(moduleName, "", "", selectedLayoutId),
        getLayout(moduleName, selectedLayoutId, ""),
      ]);

      let fieldsData: any[] = [];
      if (Array.isArray(res?.fields)) fieldsData = res.fields;
      else if (Array.isArray(res)) fieldsData = res;
      else if (res?.data && Array.isArray(res.data)) fieldsData = res.data;

      const sectionColMap: Record<string, 1 | 2> = {};
      try {
        const doc = layoutData?.doc ?? layoutData;
        const rawJson = doc?.layout_json ?? doc?.layout;
        const layoutContent = typeof rawJson === "string" ? JSON.parse(rawJson) : rawJson;
        const sections: any[] = layoutContent?.sections ?? (Array.isArray(layoutContent) ? layoutContent : []);
        sections.forEach((sec: any) => {
          if (sec?.title != null && sec?.column_count != null) {
            sectionColMap[sec.title] = Number(sec.column_count) === 1 ? 1 : 2;
          }
        });
      } catch {
        // Defaults apply when layout JSON parsing fails.
      }

      const EXCLUDED_FIELDS = ["created_by", "modified_by", "creation", "modified"];

      if (fieldsData.length > 0) {
        const processedFields = fieldsData
          .filter((field: any) => !EXCLUDED_FIELDS.includes(field.name))
          .map((field: any) => ({
            ...field,
            section_column_count: sectionColMap[field.section] ?? 2,
          }));

        const nextFields = processedFields.map((f: any) => {
          if (f.name === "title") {
            return { ...f, disable: operation === "Edit" };
          }
          // When creating a task from a Lead, make the Contact/Lead field default to the
          // "Lead" type so the current lead can be prefilled and shown.
          if (isLeadReferenceContext && String(f.type).toLowerCase() === "contactlead") {
            return { ...f, referenceDoctype: "CRM Lead", doctype: "CRM Lead" };
          }
          return f;
        });

        setFormFields(nextFields);
        setIsFieldsFetched(true);
      }
    };

    fetchFormFields();
  }, [session, selectedLayoutId, operation]);

  const handleSubmit = async (values: any, action: any) => {
    // Identify dynamic field names
    const contactLeadField = formFields.find((f) => String(f.type).toLowerCase() === "contactlead");
    const relatedToField = formFields.find((f) => String(f.type).toLowerCase() === "relatedto");

    const contactLeadValue = contactLeadField ? values[contactLeadField.name] : null;
    const contactLeadType = values._contactLeadType;

    let updatedReferenceDoctype = reference_doctype || "CRM Lead";
    let updatedReferenceDocname = reference_docname || "";
    let updatedRelatedTo = (relatedToField && values[relatedToField.name]) || "";
    let updatedContactName = values.contact_name;
    // Name of a (non-`contact_name`) Contact/Lead field whose prefilled value must be
    // cleared from the outgoing payload; empty means nothing to clear.
    let clearContactLeadKey = "";

    // When opened from a record's detail page, both reference props are supplied and
    // the task must link to THAT record — the form's (defaulted) Related-To / Contact-Lead
    // fields must not override it.
    const hasExplicitReference = !!(reference_doctype && reference_docname);

    if (hasExplicitReference) {
      updatedReferenceDoctype = reference_doctype;
      updatedReferenceDocname = reference_docname;

      const refTypeLower = String(reference_doctype).trim().toLowerCase();
      const isLeadReference = refTypeLower === "crm lead" || refTypeLower === "lead";

      // A Lead-referenced task links through the reference, not a Contact. The Contact/Lead
      // field is prefilled with the Lead's name, so it must not be sent as `contact_name`
      // (the backend would try to resolve it as a Contact and fail).
      if (isLeadReference) {
        updatedContactName = "";
        clearContactLeadKey =
          contactLeadField && contactLeadField.name !== "contact_name"
            ? contactLeadField.name
            : "";
      }

      if (relatedToField && updatedReferenceDocname) {
        const label =
          updatedReferenceDoctype === "CRM Deal" ? "Deal" :
          updatedReferenceDoctype === "CRM Lead" ? "Lead" : "Account";
        updatedRelatedTo = `${updatedReferenceDocname} - ${label}`;
      }
    } else if (contactLeadType === "Contact") {
      // If ContactLead = Contact:
      // Assign the selected value to contact_name
      updatedContactName = contactLeadValue;

      // Set reference_doctype = RelatedTo selected module
      // Set reference_docname = RelatedTo selected value
      if (relatedToField) {
        const relatedToType = values._relatedToTypes?.[relatedToField.name];
        updatedReferenceDoctype = relatedToType || updatedReferenceDoctype;
        updatedReferenceDocname = values[relatedToField.name] || "";

        // Set RelatedTo field as: relatedto lookup value - relatedto dropdown label
        if (updatedReferenceDocname) {
          const label = relatedToType === "CRM Deal" ? "Deal" : "Account";
          updatedRelatedTo = `${updatedReferenceDocname} - ${label}`;
        }
      }
    } else if (contactLeadType === "CRM Lead") {
      // If ContactLead = Lead:
      // Skip contact_name
      updatedContactName = "";

      // Set reference_doctype = "Lead"
      updatedReferenceDoctype = "Lead";
      // Set reference_docname = selected Lead name
      updatedReferenceDocname = contactLeadValue || "";

      // Set RelatedTo field as: Lead Name - Lead
      if (updatedReferenceDocname) {
        updatedRelatedTo = `${updatedReferenceDocname} - Lead`;
      }
    }

    const dataWithLayout: any = {
      ...values,
      layout_id: selectedLayoutId,
      reference_doctype: updatedReferenceDoctype,
      reference_docname: updatedReferenceDocname,
      contact_name: updatedContactName,
    };

    if (relatedToField) {
      dataWithLayout[relatedToField.name] = updatedRelatedTo;
    }

    if (clearContactLeadKey) {
      dataWithLayout[clearContactLeadKey] = "";
    }

    // Process dates
    for (const f of formFields) {
      if (String(f?.type) !== "date") continue;
      const fieldName = f?.name;
      if (!fieldName) continue;
      const v = dataWithLayout?.[fieldName];
      if (!v) continue;
      dataWithLayout[fieldName] = formatCalDate(v);
    }

    // Strip UI-only helper keys (prefixed with `_`, e.g. _contactLeadType /
    // _relatedToTypes) so only real CRM Task fields are sent to the backend.
    const taskPayload: Record<string, any> = {};
    for (const [key, value] of Object.entries(dataWithLayout)) {
      if (key.startsWith("_")) continue;
      taskPayload[key] = value;
    }

    const isEdit = operation === "Edit" && !!initialValues?.name;

    // A single CRM Task is created/updated through the dedicated single-document API,
    // not the multi-document flow (which never confirmed real persistence).
    const apiRes: any = isEdit
      ? await updateFieldCustomDocument(module, initialValues.name, taskPayload, "")
      : await createCustomDocument(module, taskPayload, "");

    if (apiRes?.success) {
      showToast(apiRes?.message, "success");
      onSubmit ? onSubmit() : location.reload();
      onClose();
    } else {
      showToast(apiRes?.message || "Failed to save task", "warning");
      onClose();
    }

    if (apiRes?.error) {
      showToast(apiRes?.error, "error");
    }

    action.setSubmitting(false);
  };

  const currentUser = session?.userId || "";

  // Prefill the Contact/Lead + reference fields with the current record when opened
  // from a detail page, so the task is visibly linked before saving.
  const referencePrefill: Record<string, any> = {};
  if (hasReferenceContext) {
    referencePrefill.reference_doctype = reference_doctype;
    referencePrefill.reference_docname = reference_docname;
    if (isLeadReferenceContext) {
      const contactLeadField = formFields.find((f: any) => String(f.type).toLowerCase() === "contactlead");
      if (contactLeadField) {
        referencePrefill[contactLeadField.name] = reference_docname;
        referencePrefill._contactLeadType = "CRM Lead";
      }
    }
  }

  const mergedInitialValues = {
    ...formFields.reduce((acc: any, f: any) => {
      acc[f.name] =
        f.name === "owner"
          ? initialValues?.[f.name] || currentUser
          : initialValues?.[f.name] ?? "";
      return acc;
    }, {}),
    ...initialValues,
    ...(operation === "New" ? { owner: currentUser } : {}),
    ...referencePrefill,
  };

  return (
    <DrawerComponent open={open} onClose={onClose} title={`${operation} Task`}>
      {layoutCount > 1 && (
        <LayoutSelection module={moduleName} onLayoutChange={(layoutId) => setSelectedLayoutId(layoutId)} />
      )}

      {isFieldsFetched ? (
        <CustomForm
          fields={formFields}
          initialValues={mergedInitialValues}
          onSubmit={handleSubmit}
          onClose={onClose}
          editValues={initialValues}
          mode={operation}
          moduleName={moduleName}
          layoutId={selectedLayoutId}
        />
      ) : (
        selectedLayoutId && (
          <Box sx={{ p: 2, textAlign: "center", color: "text.secondary" }}>Loading form...</Box>
        )
      )}
    </DrawerComponent>
  );
}
