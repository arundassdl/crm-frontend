"use client";

import {
  Card,
  Typography,
  Grid,
  Box,
  List,
  ListItem,
  Chip,
  CardContent,
  Divider,
} from "@mui/material";
import { useEffect, useState } from "react";
import EditableField, { EditOption } from "@/components/Common/EditableField";
import { updateResource } from "@/services/api/common-erpnext-api/create-edit-api";
import { getCustomerTypes, getIndustry, getNoOfEmployees, getTerritories } from "@/components/Common/Form/fetchCommonData";
import EditableFieldTheme1 from "@/components/Common/EditableFieldTheme1";
import StageProgressBar from "@/components/Common/StageProgressBar";

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
      job_title: slug?.record?.job_title,
      probability: slug?.record?.probability,
      status: slug?.record?.status,
      close_date: slug?.record?.close_date,
      organization_name: slug?.record?.organization_name,
      lead_name: slug?.record?.lead_name,
      lead: slug?.record?.lead,
      source: slug?.record?.source,
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
    if (field == "territory") {
      location.reload();
    }
  };
  const [industryOptions, setIndustryOptions] = useState<EditOption[]>([]);
  const [territories, setTerritories] = useState<any>([]);
  const [dealStatus, setDealStatus] = useState<any>([]);
    const [leadSource, setLeadSource] = useState<any>([]);
const [leadData, setLeadData] = useState<any>([]);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getIndustry("", "CRM Industry");
      setIndustryOptions(data);
    };
    const getTerritoryData = async () => {
      setTerritories(await getTerritories());
    };
    getTerritoryData();

    const fetchStatusData = async () => {
      const status_data = await getIndustry("", "CRM Deal Status", "CRM Deal");
      console.log("status data", status_data);

      setDealStatus(status_data);
    };
    const fetchSourceData = async () => {
          const status_data = await getIndustry("", "CRM Lead Source");
          console.log("source data",status_data);
          
          setLeadSource(status_data);
        };
    const fetchLeadData = async () => {
          const status_data = await getIndustry("", "CRM Lead");
          console.log("source data",status_data);
          
          setLeadData(status_data);
        };
fetchLeadData();
fetchSourceData();
    fetchData();
    fetchStatusData();
  }, []);

  return (
    <Grid
      container
      spacing={12}
      sx={{ boxShadow: "none", pt: 8, pl: 8, pr: 8 }}
    >

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
          <Grid container spacing={3}>
              {/* ===== Section 1: Details ===== */}
              <Grid item xs={12} sx={{mb:10}}>
          <StageProgressBar doctype="CRM Deal" name={customerData?.name} fieldname="status" currentLabel={customerData?.status} />
          </Grid>
          </Grid>

          {/* First & Last Name */}

          <>
            <Grid container spacing={2}>
              {/* ===== Section 1: Details ===== */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 4 }}>
                  Deal information
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
                    Deal Owner :
                  </Typography>
                  <Typography color={"var(--mui-palette-secondary-dark)"} sx={{ pl: 8 }}>{customerData?.deal_owner}</Typography>
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
                  label="Status"
                  field="status"
                  type="select"
                  options={dealStatus}
                  value={profile?.status}
                  onSave={handleSave}
                />
              </Grid>
              <Grid item xs={12} sm={12}>
                <EditableField
                  label="Probability"
                  field="probability"
                  value={profile?.probability}
                  onSave={handleSave}
                />
              </Grid>
              <Grid item xs={12} sm={12}>
                <EditableField
                  label="Close Date"
                  field="close_date"
                  type="date"
                  value={profile?.close_date}
                  onSave={handleSave}
                />
              </Grid>

              
              <Grid item xs={12} sx={{ mt: 4 }}>
                <Typography variant="h6" sx={{ mb: 4 }}>
                  Person
                </Typography>
                <Divider sx={{borderBottomWidth:"2px", mb: 4 }} />
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

              <Grid item xs={12} sx={{ mt: 4 }}>
                
                <Typography variant="h6" sx={{ mb: 4 }}>
                  Organization Details
                </Typography>
                <Divider sx={{borderBottomWidth:"2px", mb: 4 }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <EditableField
                  label="Organization Name"
                  field="organization_name"
                  type="text"
                  value={profile?.organization_name}
                  onSave={handleSave}
                />
                </Grid>
              <Grid item xs={12} sm={6}>
                <EditableField
                  label="Website"
                  field="website"
                  type="text"
                  value={profile?.website}
                  onSave={handleSave}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <EditableField
                  label="Territory"
                  field="territory"
                  type="select"
                  options={territories}
                  value={profile?.territory}
                  onSave={handleSave}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <EditableField
                  label="Industry"
                  field="industry"
                  type="select"
                  options={industryOptions}
                  value={profile?.industry}
                  onSave={handleSave}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <EditableField
                  label="Job Title"
                  field="job_title"
                  value={profile?.job_title}
                  onSave={handleSave}
                />
              </Grid>

              <Grid item xs={12} sx={{ mt: 4 }}>
                
                <Typography variant="h6" sx={{ mb: 4 }}>
                  Lead Details
                </Typography>
                <Divider sx={{borderBottomWidth:"2px", mb: 4}} />
              </Grid>
              <Grid item xs={12} sm={12}>
                <EditableField
                  label="Lead "
                  field="lead"
                  type="select"
                  options={leadData}
                  value={profile?.lead}
                  onSave={handleSave}
                />
                </Grid>
              <Grid item xs={12} sm={12}>
                <EditableField
                  label="Lead Name"
                  field="lead_name"
                  type="text"
                  value={profile?.lead_name}
                  onSave={handleSave}
                />
              </Grid>
               <Grid item xs={12} sm={12}>
                <EditableField
                  label="Source "
                  field="source"
                  type="select"
                  options={leadSource}
                  value={profile?.source}
                  onSave={handleSave}
                />
                </Grid>
              
            </Grid>
          </>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default OverviewSection;
