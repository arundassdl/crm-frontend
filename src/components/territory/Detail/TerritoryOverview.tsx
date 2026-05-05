"use client";
import { readAccessTokenDataRaw } from '@/utils/accessTokenDataStorage'
import React, { useState, useEffect } from "react";
import { forwardRef, useImperativeHandle } from 'react';
import {
    Typography,
    Divider,
} from "@mui/material";

import { Grid } from "@mui/material";
import LayoutSelection from "@/components/Common/Form/LayoutSelection";
import { SelectedFilterLangDataFromStore } from "@/store/slices/general_slices/selected-multilanguage-slice";
import { useSelector } from "react-redux";
import { get_territory_details, get_full_territory_tree } from "@/services/api/territory/territory-api";
import DealSkeleton from "@/components/Common/Skeletons/DealSkeleton";
import CommonForm from "@/components/Common/Form/CommonForm";
import { getFormFields, getLayoutList } from "@/services/api/general_apis/layout-api";
import { FieldConfigNew } from "@/components/Common/Form/validationSchema";
import { getUsers } from "@/components/Common/Form/fetchCommonData";
import { updateFieldCustomDocument,getDocument } from "@/services/api/common-erpnext-api/create-edit-api";


type TerritoryDetailsProps = {
    slug: string;
};

export type ChildRefType = {
    submitEditable: () => void;
    handleCloseClick: () => void;
};

const TerritoryOverview = forwardRef<ChildRefType, TerritoryDetailsProps>(({ slug }, ref) => {
    const [userToken, setUserToken] = useState<any>(() => {
        const initialValue = JSON.parse(
            readAccessTokenDataRaw()
        );
        return initialValue || "";
    });

    const [isEditPermission, setIsEditPermission] = useState(true); // Default to true or check permissions

    const SelectedLangDataFromStore: any = useSelector(
        SelectedFilterLangDataFromStore
    );
    const [selectedMultiLangData, setSelectedMultiLangData] = useState<any>();

    const [loading, setLoading] = useState<boolean>(true);
    const [profile, setProfile] = useState<any>({});
    const [territoryList, setTerritoryList] = useState<any>([]);
    const [usersList, setUsersList] = useState<any>([]);
    const [formFields, setFormFields] = useState<FieldConfigNew[]>([]);
    const [isFieldsFetched, setIsFieldsFetched] = useState(false);
    const [selectedLayoutId, setSelectedLayoutId] = useState<string>("");
    const [layoutCount, setLayoutCount] = useState<number>(0);

    // Expose the function to parent via ref
    useImperativeHandle(ref, () => ({
        submitEditable,
        handleCloseClick
    }));


    const submitEditable = () => {
        // setEditable(true);
    };

    const handleCloseClick = () => {
        getTerritoryData();
        // setEditable(false)
    };


    useEffect(() => {
        if (
            Object.keys(SelectedLangDataFromStore?.selectedLanguageData)?.length > 0
        ) {
            setSelectedMultiLangData(SelectedLangDataFromStore?.selectedLanguageData);
        }
    }, [SelectedLangDataFromStore]);


    const getTerritoryData: any = async () => {
        if (slug == undefined)
            return
        const details: any = await getDocument("CRM Territory", slug, userToken?.access_token);
        console.log(details, 'details territory overview');
        if (details != undefined) {
            setProfile(details);
            setTimeout(() => {
                setLoading(false);
            }, 1000);

        } else {
            setLoading(false);
        }
    };

    const getTerritoryListForDropdown: any = async () => {
        // Fetching full tree/list for parent selection
        const listData: any = await get_full_territory_tree(userToken?.access_token);
        if (Array.isArray(listData) && listData?.length > 0) {
            setTerritoryList(listData);
        }
    };

    const getUserData = async () => {
        const userList = await getUsers();
        setUsersList(userList);
    }


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
                if (!selectedLayoutId) setIsFieldsFetched(false);
                return;
            }

            const roleProfile = userToken?.role_profile || "";
            const res: any = await getFormFields("Territories", userToken.access_token, roleProfile, selectedLayoutId);
            console.log(res, 'res territory overview');
            let fieldsData: any[] = [];

            if (Array.isArray(res?.fields)) {
                fieldsData = res.fields;
            } else if (Array.isArray(res)) {
                fieldsData = res;
            } else if (res?.data && Array.isArray(res.data)) {
                fieldsData = res.data;
            }

            if (fieldsData.length > 0) {
                const processedFields = await Promise.all(
                    fieldsData.map(async (field: any) => {
                        if (field.name === 'parent_territory' && territoryList.length > 0) {
                            return {
                                ...field,
                                options: territoryList.map((option: any) => ({
                                    value: option.name,
                                    label: option.territory_name,
                                })),
                            };
                        }
                        if (field.name === 'territory_manager' && usersList.length > 0) {
                            return {
                                ...field,
                                options: usersList,
                            };
                        }
                        return field;
                    })
                );
                setFormFields(processedFields);
                setIsFieldsFetched(true);
            } else {
                console.warn('getFormFields: No fields found or invalid response format', res);
                setIsFieldsFetched(true);
            }
        };

        fetchFormFields();
    }, [userToken, selectedLayoutId, territoryList, usersList]);

    useEffect(() => {
        // getTerritoryListForDropdown();
        // getUserData();
        setLoading(true);
        if (slug) {
            getTerritoryData();
        }
    }, [slug]);


    const handleSave = async (field, value) => {
        const updatedData = { [field]: value };

        setLoading(true);

        const module = "CRM Territory";
        const response = await updateFieldCustomDocument(
            module,
            slug,
            updatedData,
            userToken?.access_token
        );

        if (!response || !response.success) {
            setLoading(false);
            throw new Error(response?.message || "Failed to update territory details.");
        }

        setProfile((prev) => ({ ...prev, [field]: value }));
        await getTerritoryData();
    };

    return (
        <Grid container spacing={12} sx={{ boxShadow: "none", pt: 8, pl: 8, pr: 8 }}>
            <Grid item xs={24} sm={12}>
                {layoutCount > 1 && (
                    <Grid
                        container
                        spacing={2}
                        direction="row"
                        rowSpacing={2}
                        sx={{ borderRadius: 0, paddingLeft: 10, mb: 3 }}
                    >
                        <Grid item xs={12} sm={6} md={12}>
                            <LayoutSelection
                                module="Territories"
                                onLayoutChange={(layoutId) => setSelectedLayoutId(layoutId)}
                                compact
                            />
                        </Grid>
                    </Grid>
                )}
                {(loading || !isFieldsFetched) ? (
                    <DealSkeleton />
                ) : (
                    <Grid item xs={12} sm={6} md={12}>
                        <Grid
                            container
                            spacing={2}
                            direction="row"
                            rowSpacing={2}
                            sx={{ borderRadius: 0, paddingLeft: 10, pt: 2 }}
                        >
                            <CommonForm
                                fields={formFields}
                                data={profile}
                                onSave={handleSave}
                                isEditPermission={isEditPermission}
                                loading={loading}
                                moduleName="Territories"
                                layoutId={selectedLayoutId}
                            />
                            
                        </Grid>
                    </Grid>
                )}
            </Grid>
        </Grid>
    );
});

export default TerritoryOverview;
