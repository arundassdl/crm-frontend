import { readAccessTokenDataRaw } from '@/utils/accessTokenDataStorage'
import React, { useEffect, useState } from "react";
import { Box } from "@mui/material";
import DrawerComponent from "@/components/Common/Form/Drawer/DrawerComponent";
import CustomForm from "@/components/Common/Form/Drawer/CustomForm";
import { FieldConfigNew } from "@/components/Common/Form/validationSchema";
import { showToast } from "@/components/ToastNotificationNew";
import {
    //     submit_addterritory,
    //     submit_editterritory,
    get_territory_details,
    get_full_territory_tree
} from "@/services/api/territory/territory-api";
import { createCustomMultipleDocuments } from "@/services/api/common-erpnext-api/create-edit-api";
import { v4 as uuidv4 } from 'uuid';
import { getUsers } from "@/components/Common/Form/fetchCommonData";
import { getFormFields, getLayoutList } from "@/services/api/general_apis/layout-api";
import LayoutSelection from "@/components/Common/Form/LayoutSelection";

interface FormValueType {
    territory_name: string;
    parent_territory: string;
    territory_manager: string;
    is_group: number;
}

const formInitialValues: FormValueType = {
    territory_name: "",
    parent_territory: "",
    territory_manager: "",
    is_group: 0,
};

interface AddTerritoryDrawerProps {
    initialValues: any;
    open: boolean;
    onClose: () => void;
    operation: string;
    onSubmit?: () => void;
}

export default function AddTerritoryDrawer({
    initialValues,
    open,
    onClose,
    operation,
    onSubmit,
}: AddTerritoryDrawerProps) {
    const module = "CRM Territory"; // Backend doctype
    const [territories, setTerritories] = useState<any>([]);
    const [isFieldsFetched, setIsFieldsFetched] = useState(false);
    const [userToken, setUserToken] = useState<any>(() => {
        const initialValue = JSON.parse(
            readAccessTokenDataRaw()
        );
        return initialValue || "";
    });

    useEffect(() => {
        const getTerritoryData = async () => {
            const treeData: any = await get_full_territory_tree(userToken?.access_token);
            if (Array.isArray(treeData) && treeData?.length > 0) {
                const formattedTerritories = treeData.map((t: any) => ({
                    label: t.territory_name,
                    value: t.name,
                }));
                setTerritories(formattedTerritories);
            }
        };

        getTerritoryData();
    }, [userToken]);


    const handleSubmit = async (values, action) => {
        console.log(values, "values addterritory");
        const territoryKey = `territory_${uuidv4().split("-")[0]}`;

        
        // Discover address fields from layout metadata
        const addressFieldNames =
            formFields
                .filter((field: any) => (field as any).type === "address")
                .map((field) => field.name) || [];

        const dataWithLayout = {
            ...values,
            layout_id: selectedLayoutId,
        };

        const documents = [
            {
                "doctype": "CRM Territory",
                "key": territoryKey,
                "data": dataWithLayout,
                "addressFields": addressFieldNames,
            }
        ]

        let apiRes: any = await createCustomMultipleDocuments(
            documents,
            userToken?.access_token
        );


        if (apiRes?.success) {
            showToast(apiRes?.message, "success");
            onSubmit ? onSubmit() : location.reload();
            onClose();
        } else {
            showToast(apiRes?.message || "Failed to save territory", "warning");
        }
        if (apiRes?.error) {
            showToast(apiRes?.error, "error");
        }

        action.setSubmitting(false);
    };

    const [formFields, setFormFields] = useState<FieldConfigNew[]>([]);
    const [selectedLayoutId, setSelectedLayoutId] = useState<string>("");
    const [layoutCount, setLayoutCount] = useState<number>(0);

    useEffect(() => {
        const fetchLayouts = async () => {
            if (!userToken?.access_token) return;
            const roleProfile = userToken?.role_profile || "";
            const layouts = await getLayoutList("Territories", userToken.access_token, roleProfile);
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

            const res: any = await getFormFields(
                "Territories",
                userToken?.access_token,
                userToken?.role_profile,
                selectedLayoutId
            );
            console.log(res, "res addterritory");
            let fieldsData: any[] = [];

            // Current expected shape: { fields: [...], layout_name, name }
            if (Array.isArray(res?.fields)) {
                fieldsData = res.fields;
            } else if (Array.isArray(res)) {
                // Backward compatibility if API ever returned a raw array
                fieldsData = res;
            } else if (res?.data && Array.isArray(res.data)) {
                // Another legacy shape: { data: [...] }
                fieldsData = res.data;
            }

            if (fieldsData.length > 0) {
                const processedFields = fieldsData.map((field: any) => {
                    if (field.name === "territory_name") {
                        return { ...field, disable: operation === "Edit" };
                    }
                    return field;
                });
                setFormFields(processedFields);
                setIsFieldsFetched(true);
            } else {
                console.warn(
                    "getFormFields: No fields found or invalid response format",
                    res
                );
            }
        };

        fetchFormFields();
    }, [userToken, selectedLayoutId]);

    type FormValueType = {
        [K in (typeof formFields)[number]["name"]]: any;
    };

    // Merge initial values properly
    const mergedInitialValues = {
        ...formInitialValues,
        ...initialValues,
        is_group: initialValues?.is_group === 1 || initialValues?.is_group === true ? true : false
    };

    return (
        <DrawerComponent
            open={open}
            onClose={onClose}
            title={`${operation} Territory`}
        >
            {layoutCount > 1 && (
                <LayoutSelection
                    module="Territories"
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
                    moduleName="Territories"
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
