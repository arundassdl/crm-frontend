import { readAccessTokenDataRaw } from '@/utils/accessTokenDataStorage'
import React, { useEffect, useState } from 'react';
import { showToast } from '@/components/ToastNotificationNew';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { FieldConfigNew } from '@/components/Common/Form/validationSchema';
import DrawerComponent from '@/components/Common/Form/Drawer/DrawerComponent';
import CustomForm from '@/components/Common/Form/Drawer/CustomForm';
import { fetchpermissionmodule } from '@/services/api/roles/roles-api';
import { createCustomMultipleDocuments } from '@/services/api/common-erpnext-api/create-edit-api';
import { layoutSelector, addSection, saveLayoutData } from '@/store/slices/general_slices/layout-slice';
import { v4 as uuidv4 } from 'uuid';

interface CreateLayoutDrawerProps {
    open: boolean;
    onClose: () => void;
    onSubmitSuccess: () => void;
}

const CreateLayoutDrawer: React.FC<CreateLayoutDrawerProps> = ({ open, onClose, onSubmitSuccess }) => {
    const dispatch = useDispatch();
    const [modules, setModules] = useState<any[]>([]);
    const [userToken, setUserToken] = useState<any>(() => {
        const initialValue = JSON.parse(
            readAccessTokenDataRaw()
        );
        return initialValue || "";
    });

    const router = useRouter();
    const layoutKey = `layout_${uuidv4().split("-")[0]}`;

    useEffect(() => {
        const getModuleData = async () => {
            const res = await fetchpermissionmodule(userToken?.access_token);
            console.log('Fetched modules:', res);
            if (Array.isArray(res)) {
                // Map to the format expected by select field: { label, value }
                const mappedModules = res.map((mod: any) => ({
                    label: mod.frontend_module,
                    value: mod.name
                }));
                setModules(mappedModules);
            }
        };

        if (open && userToken?.access_token) {
            getModuleData();
        }
    }, [open, userToken?.access_token]);

    const handleSubmit = async (values: any, action: any) => {
        console.log("Layout values=>", values);

        try {
            // Create empty layout structure
            const emptyLayout = {
                sections: []
            };

            // Save layout using Redux action
            const saveResult = await dispatch(saveLayoutData({
                module: values.module,
                layoutId: values.layout_name,
                layout: emptyLayout,
                token: userToken?.access_token,
                isDefault: values.is_default
            }) as any);

            console.log("saveLayoutData result", saveResult);

            if (saveResult.type.endsWith('/fulfilled')) {
                showToast("Layout created successfully", "success");
                onSubmitSuccess();
                onClose();
            } else {
                showToast("Failed to create layout", "warning");
            }
        } catch (error) {
            console.error("Error creating layout:", error);
            showToast("Error creating layout", "error");
        }

        action.setSubmitting(false);
    };

    const formFields: FieldConfigNew[] = [
        {
            name: "layout_name",
            label: "Layout Name",
            type: "text",
            placeholder: "Enter Layout Name",
            validate: true,
            section: "Layout Details"
        },
        {
            name: "module",
            label: "Module",
            type: "lookup",
            doctype: "SDL Module Map",
            placeholder: "Select Module",
            validate: true,
            section: "Layout Details",
            displayFields: ["frontend_module"],
            searchFields: ["frontend_module"],
            filters: { main_doctype_name: ["is", "set"] }
        },
        {
            name: "is_default",
            label: "Is Default",
            type: "checkbox",
            placeholder: "",
            validate: false,
            section: "Layout Details"
        }
    ];

    type FormValueType = {
        [K in (typeof formFields)[number]["name"]]: any;
    };

    const formInitialValues: FormValueType = {
        layout_name: "",
        module: "",
        is_default: false
    };

    return (
        <DrawerComponent
            open={open}
            onClose={onClose}
            title="New Layout"
        >
            <CustomForm
                fields={formFields}
                initialValues={formInitialValues}
                onSubmit={handleSubmit}
                onClose={onClose}
                editValues={[]}
            />
        </DrawerComponent>
    );
};

export default CreateLayoutDrawer;
