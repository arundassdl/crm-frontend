import { readAccessTokenDataParsed } from '@/utils/accessTokenDataStorage'
import React, { useEffect, useState } from "react";
import { Box } from "@mui/material";
import { v4 as uuidv4 } from "uuid";
import DrawerComponent from "@/components/Common/Form/Drawer/DrawerComponent";
import CustomForm from "@/components/Common/Form/Drawer/CustomForm";
import { FieldConfigNew } from "@/components/Common/Form/validationSchema";
import { showToast } from "@/components/ToastNotificationNew";
import { createCustomMultipleDocuments } from "@/services/api/common-erpnext-api/create-edit-api";
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
  const [isFieldsFetched, setIsFieldsFetched] = useState(false);
  const [userToken, setUserToken] = useState<any>(() => {
    const initialValue = readAccessTokenDataParsed();
    return initialValue || "";
  });
  const [formFields, setFormFields] = useState<FieldConfigNew[]>([]);
  const [selectedLayoutId, setSelectedLayoutId] = useState<string>("");
  const [layoutCount, setLayoutCount] = useState<number>(0);

  useEffect(() => {
    const fetchLayouts = async () => {
      if (!userToken?.access_token) return;
      const roleProfile = userToken?.role_profile || "";
      const layouts = await getLayoutList(moduleName, userToken.access_token, roleProfile);
      const count = Array.isArray(layouts) ? layouts.length : 0;
      setLayoutCount(count);

      if (count === 1 && layouts[0]?.value) {
        setSelectedLayoutId(layouts[0].value);
      } else if (count === 0) {
        setIsFieldsFetched(true);
      }
    };

    fetchLayouts();
  }, [userToken?.access_token, userToken?.role_profile]);

  useEffect(() => {
    const fetchFormFields = async () => {
      if (!userToken?.access_token || !selectedLayoutId) {
        if (!selectedLayoutId) setIsFieldsFetched(false);
        return;
      }

      setIsFieldsFetched(false);
      const roleProfile = userToken?.role_profile || "";

      const [res, layoutData]: any[] = await Promise.all([
        getFormFields(moduleName, userToken?.access_token, roleProfile, selectedLayoutId),
        getLayout(moduleName, selectedLayoutId, userToken?.access_token),
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
          return f;
        });

        setFormFields(nextFields);
        setIsFieldsFetched(true);
      }
    };

    fetchFormFields();
  }, [userToken, selectedLayoutId, operation]);

  const handleSubmit = async (values: any, action: any) => {
    const taskKey = `task_${uuidv4().split("-")[0]}`;

    const addressFieldNames = formFields
      .filter((field: any) => String(field.type) === "address")
      .map((field: any) => field.name);

    // Identify dynamic field names
    const contactLeadField = formFields.find((f) => String(f.type).toLowerCase() === "contactlead");
    const relatedToField = formFields.find((f) => String(f.type).toLowerCase() === "relatedto");

    const contactLeadValue = contactLeadField ? values[contactLeadField.name] : null;
    const contactLeadType = values._contactLeadType;

    let updatedReferenceDoctype = reference_doctype || "CRM Lead";
    let updatedReferenceDocname = reference_docname || "";
    let updatedRelatedTo = (relatedToField && values[relatedToField.name]) || "";
    let updatedContactName = values.contact_name;

    if (contactLeadType === "Contact") {
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

    // Process dates
    for (const f of formFields) {
      if (String(f?.type) !== "date") continue;
      const fieldName = f?.name;
      if (!fieldName) continue;
      const v = dataWithLayout?.[fieldName];
      if (!v) continue;
      dataWithLayout[fieldName] = formatCalDate(v);
    }

    if (operation === "Edit" && initialValues?.name) {
      dataWithLayout.name = initialValues.name;
    }

    const documents = [
      {
        doctype: module,
        key: taskKey,
        data: dataWithLayout,
        addressFields: addressFieldNames,
      },
    ];

    const apiRes: any = await createCustomMultipleDocuments(documents, userToken?.access_token);

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

  const currentUser = userToken?.username || userToken?.email || "";
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
