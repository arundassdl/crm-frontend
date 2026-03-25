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
import CircleIcon from '@mui/icons-material/Circle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import DonutLargeIcon from '@mui/icons-material/DonutLarge'; //Backlog
import { HourglassBottom, CheckCircle, Cancel } from '@mui/icons-material';


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
      title: slug?.record?.title,
      description: slug?.record?.description,
      assigned_to: slug?.record?.assigned_to,
      priority: slug?.record?.priority,
      status: slug?.record?.status,
      due_date: slug?.record?.due_date,
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
  

  const [assignedto, setAssignedto] = useState<any>([]);


  const priorityOptions = [
    { value: 'Low', label: 'Low', icon: <CircleIcon fontSize="small" sx={{ color: 'gray' }} /> },
    { value: 'Medium', label: 'Medium', icon: <CircleIcon fontSize="small" sx={{ color: 'orange' }} /> },
    { value: 'High', label: 'High', icon: <CircleIcon fontSize="small" sx={{ color: 'red' }} /> },
  ];
  const taskStatusOptions = [
    { value: 'Backlog', label: 'Backlog', index: 0, icon: <DonutLargeIcon fontSize="small" /> },
    { value: 'Todo', label: 'Todo', index: 1, icon: <RadioButtonUncheckedIcon fontSize="small" sx={{ color: 'orange' }} /> },
    { value: 'In Progress', label: 'In Progress', index: 2, icon: <HourglassBottom fontSize="small" sx={{ color: '#f6c4bc' }} /> },
    { value: 'Done', label: 'Done', index: 3, icon: <CheckCircle fontSize="small" sx={{ color: 'green' }} /> },
    { value: 'Canceled', label: 'Canceled', index: 4, icon: <Cancel fontSize="small" sx={{ color: 'red' }} /> },
  ];

  useEffect(() => {
     const getuserData = async () => {
        const data = await getIndustry("", "User");
        setAssignedto(data);
      }; 
    getuserData();
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
          {/* First & Last Name */}

          <>
            <Grid container spacing={2}>
              {/* ===== Section 1: Details ===== */}
            
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 4 }}>
                  Task information
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
                    Task Owner :
                  </Typography>
                  <Typography color={"var(--mui-palette-secondary-dark)"} sx={{ pl: 8 }}>{customerData?.owner}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={12}>
                <EditableField
                  label="Title"
                  field="title"
                  value={profile?.title}
                  onSave={handleSave}
                />
              </Grid>

              <Grid item xs={12} sm={12}>
                <EditableField
                  label="Assigned to"
                  field="assigned_to"
                  type="select"
                   options={assignedto}
                  value={profile?.assigned_to}
                  onSave={handleSave}
                />
              </Grid>
              <Grid item xs={12} sm={12}>
                <EditableField
                  label="Priority"
                  field="priority"
                  type="select"
                  options={priorityOptions}
                  value={profile?.priority}
                  onSave={handleSave}
                />
              </Grid>
              <Grid item xs={12} sm={12}>
                <EditableField
                  label="Status"
                  field="status"
                  type="select"
                  options={taskStatusOptions}
                  value={profile?.status}
                  onSave={handleSave}
                />
              </Grid>
              <Grid item xs={12} sm={12}>
                <EditableField
                  label="Due Date"
                  field="due_date"
                  type="datetime"
                  value={profile?.due_date}
                  onSave={handleSave}
                />
              </Grid>
              <Grid item xs={12} sm={12}>
                <EditableField
                  label="Description"
                  field="description"
                  type="textarea"
                  value={profile?.description}
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
