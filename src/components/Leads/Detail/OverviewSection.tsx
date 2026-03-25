"use client";

import {
  Card,
  Typography,
  Grid,
  Box,
  List,
  ListItem,
  Chip,
  Divider,
} from "@mui/material";
import { useEffect, useState } from "react";
import EditableField, { EditOption } from "@/components/Common/EditableField";
import { updateFieldCustomDocument, updateResource } from "@/services/api/common-erpnext-api/create-edit-api";
import { getCustomerTypes, getIndustry, getNoOfEmployees, getTerritories } from "@/components/Common/Form/fetchCommonData";
import EditableFieldTheme1 from "@/components/Common/EditableFieldTheme1";

const OverviewSection = ({ slug, doctype }) => {
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
      first_name: slug?.record?.first_name,
      last_name: slug?.record?.last_name,
      email: slug?.record?.email,
      mobile_no: slug?.record?.mobile_no,
      organization: slug?.record?.organization,
      website: slug?.record?.website,
      territory: slug?.record?.territory,
      no_of_employees: slug?.record?.no_of_employees,
      industry: slug?.record?.industry,
      source: slug?.record?.source,
      job_title: slug?.record?.job_title,
    });
  }, [slug]);

  const handleSave = async (field, value) => {
    const updatedData = {
      [field]: value,
    };
    const updatedContact = await updateFieldCustomDocument(
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
    if (field == "territory") {
      location.reload();
    }
  };
  const [industryOptions, setIndustryOptions] = useState<EditOption[]>([]);
    const [territories, setTerritories] = useState<any>([]);
  const [sourceOptions, setSourceOptions] = useState<any>([]);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getIndustry("", "CRM Industry");
      setIndustryOptions(data);
    };
     const getTerritoryData = async () => {
        setTerritories(await getTerritories());
      }; 
    const fetchSource = async () => {
          const data = await getIndustry("", "CRM Lead Source");
          setSourceOptions(data);
        };
        fetchSource();
      getTerritoryData();

    fetchData();
  }, []);

  return (
    <Grid
      container
      spacing={12}
      sx={{ boxShadow: "none", pt: 8, pl: 8, pr: 8 }}
    >
      {/* Profile Card */}
      {/* <Grid item xs={12} sm={3} md={3}>
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
      </Grid> */}
      {/* Details Section */}
      <Grid item xs={12} sm={6} md={12}>
        <Grid
          container
          spacing={2}
          direction="row"
          rowSpacing={2}
          sx={{
            // borderLeft: "1px solid #e5e5e5",
            borderRadius: 0,
            // height: "100%",
            paddingLeft: 10,
          }}
        >
          {/* First & Last Name */}

          <>
            <Grid container spacing={2}>
              {/* ===== Section 1: Details ===== */}
            
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 4 }}>
                  Lead information
                </Typography>
                <Divider sx={{borderBottomWidth:"2px", mb: 4}} />
              </Grid>
              <Grid item xs={12} sm={12}>
                <Box
                  display="flex"
                  alignItems="flex-start"
                  gap={5}
                  flexDirection="row"
                  sx={{ mb: 4 }}
                >
                  <Typography
                    className="font-normal text-1xl"
                    color={"GrayText"}
                  >
                    Lead Owner :
                  </Typography>
                  <Typography color={"var(--mui-palette-secondary-dark)"} sx={{ pl: 8 }}>{customerData?.lead_owner}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={12}>
                <EditableField
                  label="Organization"
                  field="organization"
                  value={profile?.organization}
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
                  type="select"
                  options={territories}
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
                  label="Source"
                  field="source"
                  type="select"
                  options={sourceOptions}
                  value={profile?.source}
                  onSave={handleSave}
                />
              </Grid>
              <Grid item xs={12} sm={12}>
                <EditableField
                  label="Job Title"
                  field="job_title"
                  value={profile?.job_title}
                  onSave={handleSave}
                />
              </Grid>
             
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 4 }}>
                  Person
                </Typography>
                <Divider sx={{borderBottomWidth:"2px", mb: 4}} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <EditableField
                  label="First Name"
                  field="first_name"
                  value={profile?.first_name}
                  onSave={handleSave}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <EditableField
                  label="Last Name"
                  field="last_name"
                  value={profile?.last_name}
                  onSave={handleSave}
                />
              </Grid>
               <Grid item xs={12} sm={6}>
                <EditableField
                  label="Email"
                  field="email"
                  value={profile?.email}
                  onSave={handleSave}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <EditableField
                  label="Mobile No."
                  field="mobile_no"
                  value={profile?.mobile_no}
                  onSave={handleSave}
                />
              </Grid>              
            </Grid>
          </>

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

export default OverviewSection;
