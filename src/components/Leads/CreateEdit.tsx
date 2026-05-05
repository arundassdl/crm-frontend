import { readAccessTokenDataParsed } from '@/utils/accessTokenDataStorage'
import React, { useEffect, useState } from "react";
import { Box } from "@mui/material";
import DrawerComponent from "@/components/Common/Form/Drawer/DrawerComponent";
import CustomForm from "@/components/Common/Form/Drawer/CustomForm";
import { FieldConfigNew } from "@/components/Common/Form/validationSchema";
import { showToast } from "@/components/ToastNotificationNew";
import { createCustomMultipleDocuments } from "@/services/api/common-erpnext-api/create-edit-api";
import { v4 as uuidv4 } from "uuid";
import { getFormFields, getLayoutList } from "@/services/api/general_apis/layout-api";
import { getLayout } from "@/services/api/crm/crm-api";
import LayoutSelection from "@/components/Common/Form/LayoutSelection";

interface AddEditLeadDrawerProps {
  initialValues: any;
  open: boolean;
  onClose: () => void;
  operation: string;
  onSubmit?: () => void;
}

export default function AddEditLeadDrawer({
  initialValues,
  open,
  onClose,
  operation,
  onSubmit,
}: AddEditLeadDrawerProps) {
  const module = "CRM Lead";
  const moduleName = "Leads";

  const [isFieldsFetched, setIsFieldsFetched] = useState(false);
  const [userToken] = useState<any>(() => {
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
        if (!selectedLayoutId) {
          setIsFieldsFetched(false);
        }
        return;
      }

      const [res, layoutData]: any[] = await Promise.all([
        getFormFields(moduleName, userToken?.access_token, userToken?.role_profile, selectedLayoutId),
        getLayout(moduleName, selectedLayoutId, userToken?.access_token),
      ]);

      let fieldsData: any[] = [];
      if (Array.isArray(res?.fields)) {
        fieldsData = res.fields;
      } else if (Array.isArray(res)) {
        fieldsData = res;
      } else if (res?.data && Array.isArray(res.data)) {
        fieldsData = res.data;
      }

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
        // fallback to defaults
      }

      const EXCLUDED_FIELDS = ["created_by", "modified_by", "creation", "modified"];

      if (fieldsData.length > 0) {
        const processedFields = fieldsData
          .filter((field: any) => !EXCLUDED_FIELDS.includes(field.name))
          .map((field: any) => {
            const base = { ...field, section_column_count: sectionColMap[field.section] ?? 2 };
            if (field.name === "lead_name") {
              return { ...base, disable: operation === "Edit" };
            }
            return base;
          });
        setFormFields(processedFields);
        setIsFieldsFetched(true);
      } else {
        console.warn("getFormFields: No fields found or invalid response format", res);
      }
    };

    fetchFormFields();
  }, [userToken, selectedLayoutId, operation]);

  const handleSubmit = async (values: any, action: any) => {
    const leadKey = `lead_${uuidv4().split("-")[0]}`;

    const addressFieldNames =
      formFields
        .filter((field: any) => (field as any).type === "address")
        .map((field) => field.name) || [];

    const dataWithLayout: any = {
      ...values,
      layout_id: selectedLayoutId,
    };
    if (operation === "Edit" && initialValues?.name) {
      dataWithLayout.name = initialValues.name;
    }

    const documents = [
      {
        doctype: module,
        key: leadKey,
        data: dataWithLayout,
        addressFields: addressFieldNames,
      },
    ];

    const apiRes: any = await createCustomMultipleDocuments(
      documents,
      userToken?.access_token
    );

    if (apiRes?.success) {
      showToast(apiRes?.message, "success");
      onSubmit ? onSubmit() : location.reload();
      onClose();
    } else {
      showToast(apiRes?.message || "Failed to save lead", "warning");
    }
    if (apiRes?.error) {
      showToast(apiRes?.error, "error");
    }

    action.setSubmitting(false);
  };

  const currentUser = userToken?.username || userToken?.email || "";
  const mergedInitialValues = {
    ...formFields.reduce((acc: any, f) => {
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
    <DrawerComponent
      open={open}
      onClose={onClose}
      title={`${operation} Lead`}
    >
      {layoutCount > 1 && (
        <LayoutSelection
          module={moduleName}
          onLayoutChange={(layoutId) => setSelectedLayoutId(layoutId)}
        />
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
          <Box sx={{ p: 2, textAlign: "center", color: "text.secondary" }}>
            Loading form...
          </Box>
        )
      )}
    </DrawerComponent>
  );
}
