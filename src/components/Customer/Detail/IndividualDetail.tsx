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
import EmailFields from "@/components/Contact/Detail/EmailFields";
import FormatDate from "@/libs/FormatDate";
import PhoneFields from "@/components/Contact/Detail/PhoneFields";
import EditableField from "@/components/Common/EditableField";
import { updateResource } from "@/services/api/common-erpnext-api/create-edit-api";
import { getCustomerTypes } from "@/components/Common/Form/fetchCommonData";

const IndividualDetail = ({ slug, doctype }) => {
  let [customerData, setCustomerData] = useState<any>([]);
  let [contactData, setContactData] = useState<any>([]);
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
    console.log("slug?.recordslug?.record", slug);

    setCustomerData(slug?.record);
    setContactData(slug?.primary_contact);
    let addresses = slug?.primary_address ? slug?.primary_address : [];
    console.log("slug?.record", slug?.record);

    if (slug?.record?.links?.length > 0) {
      let link_data = slug?.record?.links[0];
      setLinkData(link_data);
    }

    setAddressData(addresses);
    console.log("customerData", customerData);

    setProfile({
      customer_name: slug?.record?.customer_name,
      customer_type: slug?.record?.customer_type,
      first_name: slug?.primary_contact?.first_name,
      last_name: slug?.primary_contact?.last_name,
    });
  }, [slug]);

  const handleSave = async (field, value) => {
    const updatedData = {
      [field]: value,
    };
    const updatedContact = await updateResource(
      doctype?doctype:"CRM Organization",
      customerData.name,
      updatedData,
      userToken?.access_token
    );
    if (!updatedContact || !updatedContact.success) {
      throw new Error("Failed to update contact details.");
    }
    console.log("saved succesfully");
    setProfile((prev) => ({ ...prev, [field]: value }));
    if (field == "customer_type") {
      location.reload();
    }
  };
  const handleSaveContact = async (field, value) => {
    const updatedData = {
      [field]: value,
    };
    const updatedContact = await updateResource(
      "Contact",
      contactData.name,
      updatedData,
      userToken?.access_token
    );

    if (!updatedContact || !updatedContact.success) {
      throw new Error("Failed to update contact details.");
    }
    console.log("saved succesfully");
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Box sx={{}}>
      <Card sx={{ boxShadow: "none", p: 8 }}>
        <Grid container spacing={12}>
          {/* Profile Card */}
          <Grid item xs={12} sm={3} md={3}>
            <Card
              sx={{
                textAlign: "center",
                padding: "50px 10px",
                border: "2px solid var(--mui-palette-primary-main)",
                width: "100%",
              }}
            >
              <CustomAvatar
                alt={customerData?.name}
                src={`${CONSTANTS.API_BASE_URL}${customerData?.image}`}
                size={120}
                variant="circular"
                sx={{
                  width: 120,
                  height: 120,
                  margin: "auto",
                  //   backgroundColor: "#E0F2F1",
                }}
              />
              <Typography variant="h6" mt={3}>
                {customerData?.customer_name}
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
              {/* <Typography
                variant="h5"
                sx={{
                  borderBottom: 1,
                  borderColor: "divider",
                  pb: 2,
                  mt: 4,
                  mb: 2,
                  textTransform: "capitalize",
                }}
              >
                Details
              </Typography> */}

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

                {/* <ListItem sx={{ display: "flex", gap: 1, mb: 1, pl: 0 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Owner:
                    </Typography>
                    <Typography>{customerData?.owner}</Typography>
                  </ListItem> */}

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
                paddingLeft: 5,
              }}
            >
              {/* First & Last Name */}

              <>
                <Grid item xs={12} sm={6}>
                  <EditableField
                    label="Organization Name"
                    field="organization_name"
                    value={profile?.customer_name}
                    onSave={handleSave}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <EditableField
                    label="Customer Type"
                    field="customer_type"
                    type="select"
                    options={getCustomerTypes()}
                    value={profile?.customer_type}
                    onSave={handleSave}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <EditableField
                    label="First Name"
                    field="first_name"
                    value={profile?.first_name}
                    onSave={handleSaveContact}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <EditableField
                    label="Last Name"
                    field="last_name"
                    value={profile?.last_name}
                    onSave={handleSaveContact}
                  />
                </Grid>

                <Grid item xs={12} sm={12}>
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
                {/* <Grid item xs={12} sm={6}>
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
                        First Name :
                      </Typography>
                      <Typography>{contactData?.first_name}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
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
                        Last Name :
                      </Typography>
                      <Typography>{contactData?.last_name}</Typography>
                    </Box>
                  </Grid> */}
              </>

              {contactData?.["email_ids"] && (
                // <Grid item xs={12} sm={12} mt={10} mb={5}>
                //   <Grid container spacing={2}>
                <Grid item xs={12} sm={12}>
                  <EmailFields
                    contactname={contactData?.name}
                    emailids={contactData?.["email_ids"]}
                  />
                  {/* </Grid>
                  </Grid> */}
                </Grid>
              )}
              {contactData?.["phone_nos"] && (
                // <Grid item xs={12} sm={12} mt={5} mb={5}>
                //   <Grid container spacing={2}>
                <Grid item xs={12} sm={12}>
                  <PhoneFields
                    contactname={contactData?.name}
                    phonenos={contactData?.["phone_nos"]}
                  />
                </Grid>
                //   </Grid>
                // </Grid>
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
      </Card>
    </Box>
  );
};

export default IndividualDetail;
