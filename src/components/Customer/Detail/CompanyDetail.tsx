"use client";

import {
  Card,
  Typography,
  Grid,
  Box,
  List,
  ListItem,
  Chip,
} from "@mui/material";
import { useEffect, useState } from "react";
import CustomAvatar from "@/@core/components/mui/Avatar";
import { CONSTANTS } from "@/services/config/app-config";
import Link from "@/components/Link";
import EmailFields from "@/components/Contact/Detail/EmailFields";
import FormatDate from "@/libs/FormatDate";
import PhoneFields from "@/components/Contact/Detail/PhoneFields";
import EditableField, { EditOption } from "@/components/Common/EditableField";
import { updateResource } from "@/services/api/common-erpnext-api/create-edit-api";
import { getCustomerTypes, getIndustry, getNoOfEmployees } from "@/components/Common/Form/fetchCommonData";

const CompanyDetail = ({ slug, doctype }) => {
  let [customerData, setCustomerData] = useState<any>([]);
  let [linkData, setLinkData] = useState<any>([]);
  let [addressData, setAddressData] = useState<any>({});

  const [userToken, setUserToken] = useState<any>(() => {
    const initialValue = JSON.parse(
      localStorage.getItem("AccessTokenData") || "{}"
    );
    return initialValue || "";
  });

  const [profile, setProfile] = useState<any>([]);

  useEffect(() => {
    setCustomerData(slug?.record);
    let addresses = slug?.primary_address ? slug?.primary_address : [];
    console.log("slug?.record", slug?.record);

    if (slug?.record?.links?.length > 0) {
      let link_data = slug?.record?.links[0];
      setLinkData(link_data);
    }

    setAddressData(addresses);

    setProfile({
      organization_name: slug?.record?.organization_name,
      website: slug?.record?.website,
      territory: slug?.record?.territory,
      no_of_employees: slug?.record?.no_of_employees,
      industry: slug?.record?.industry,
    });
  }, [slug]);

  const handleSave = async (field, value) => {
    const updatedData = {
      [field]: value,
    };
    const updatedContact = await updateResource(
      doctype,
      customerData.name,
      updatedData,
      userToken?.access_token
    );

    if (!updatedContact || !updatedContact.success) {
      throw new Error("Failed to update contact details.");
    }
    console.log("saved succesfully");
    setProfile((prev) => ({ ...prev, [field]: value }));
    if (field == "no_of_employees") {
      location.reload();
    }
  };
  const [industryOptions, setIndustryOptions] = useState<EditOption[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getIndustry("", "CRM Industry");
      setIndustryOptions(data);
    };

    fetchData();
  }, []);

  return (
    <Grid
      container
      spacing={12}
      sx={{ boxShadow: "none", pt: 8, pl: 8, pr: 8 }}
    >
      {/* Profile Card */}
      <Grid item xs={12} sm={3} md={3}>
        <Card
          sx={{
            textAlign: "center",
            padding: "25px 10px",
            border: "2px solid var(--mui-palette-primary-main)",
            width: "100%",
          }}
        >
          <CustomAvatar
            alt={customerData?.name}
            src={`${CONSTANTS.API_BASE_URL}${customerData?.image}`}
            size={100}
            variant="circular"
            sx={{
              width: 100,
              height: 100,
              margin: "auto",
              //   backgroundColor: "#E0F2F1",
            }}
          />
          <Typography variant="h6" mt={3}>
            {customerData?.organization_name}
          </Typography>
        </Card>
        <Box
          sx={{
            padding: 3,
            borderRadius: 2,
            backgroundColor: "background.paper",
            boxShadow: 0,
            display: "flex",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          <List sx={{ mb: 4, pl: 0 }}>
            <ListItem sx={{ display: "flex", gap: 1, mb: 1, pl: 0 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                Joined on:
              </Typography>
              <Typography>
                {" "}
                <FormatDate date={customerData?.creation} />
              </Typography>
            </ListItem>

            <ListItem sx={{ display: "flex", gap: 1, mb: 1, pl: 0 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                Status:
              </Typography>
              <Chip
                label="Active"
                color="success"
                variant="outlined"
                size="small"
              />
            </ListItem>
          </List>
        </Box>
      </Grid>
      {/* Details Section */}
      <Grid item xs={12} sm={6} md={9}>
        <Grid
          container
          spacing={2}
          direction="row"
          rowSpacing={2}
          sx={{
            borderLeft: "1px solid #e5e5e5",
            borderRadius: 0,
            // height: "100%",
            paddingLeft: 10,
          }}
        >
          {/* First & Last Name */}

          <>
            <Grid item xs={12} sm={12}>
              <EditableField
                label="Organization Name"
                field="organization_name"
                value={profile?.organization_name}
                onSave={handleSave}
              />
            </Grid>
            <Grid item xs={12} sm={12}>
              <EditableField
                label="Website"
                field="website"
                type="text"
                value={profile?.website}
                onSave={handleSave}
              />
            </Grid>
            <Grid item xs={12} sm={12}>
              <EditableField
                label="Territory"
                field="territory"
                value={profile?.territory}
                onSave={handleSave}
              />
            </Grid>             
            <Grid item xs={12} sm={12}>
              <EditableField
                label="Industry"
                field="industry"
                type="select"
                options={industryOptions}
                value={profile?.industry}
                onSave={handleSave}
              />
            </Grid>      
            <Grid item xs={12} sm={12}>
              <EditableField
                label="No. of Employees"
                field="no_of_employees"
                type="select"
                options={getNoOfEmployees()}
                value={profile?.no_of_employees}
                onSave={handleSave}
              />
            </Grid>
          </>

          {/* Type of Contact */}

          {Object.entries(linkData)?.length > 0 && (
            <Grid item xs={12} sm={5}>
              <Box
                display="flex"
                alignItems="flex-start"
                gap={1}
                flexDirection="row"
              >
                <Typography className="font-medium text-1xl">
                  Account Name :
                </Typography>
                <Link
                  href={`/accounts/detail/${linkData?.link_name}`}
                  className="text-primary"
                >
                  {" "}
                  {linkData?.link_name}
                </Link>
              </Box>
            </Grid>
          )}
          <Grid item xs={12} sm={5}>
            <Box
              display="flex"
              alignItems="flex-start"
              gap={1}
              flexDirection="row"
            >
              <Typography
                className="font-medium text-1xl"
                sx={{ minWidth: 140 }}
              >
                Owner :
              </Typography>
              <Typography>{customerData?.owner}</Typography>
            </Box>
          </Grid>

          {customerData?.["email_ids"] && (
            <Grid item xs={12} sm={12} mt={10} mb={5}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={12}>
                  <EmailFields
                    contactname={customerData?.name}
                    emailids={customerData?.["email_ids"]}
                  />
                </Grid>
              </Grid>
            </Grid>
          )}
          {customerData?.["phone_nos"] && (
            <Grid item xs={12} sm={12} mt={5} mb={5}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={12}>
                  <PhoneFields
                    contactname={customerData?.name}
                    phonenos={customerData?.["phone_nos"]}
                  />
                </Grid>
              </Grid>
            </Grid>
          )}
          {/* Favorite Toggle */}
          {/* <Grid
                item
                xs={12}
                sm={6}
                display="flex"
                justifyContent="flex-end"
                alignItems="center"
              >
                <Typography variant="body2">Last 2 years</Typography>
                <Switch color="primary" />
              </Grid> */}
        </Grid>
      </Grid>
    </Grid>
  );
};

export default CompanyDetail;
