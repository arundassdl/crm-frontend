"use client";

import {
  Card,
  CardContent,
  Avatar,
  Typography,
  Grid,
  Button,
  Switch,
  Box,
  IconButton,
  Stack,
  List,
  ListItem,
  Chip,
} from "@mui/material";
import WorkIcon from "@mui/icons-material/Work";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import BuildIcon from "@mui/icons-material/Build";
import { useEffect, useState } from "react";
import CustomAvatar from "@/@core/components/mui/Avatar";
import { CONSTANTS } from "@/services/config/app-config";
import Link from "@/components/Link";
import EmailFields from "./EmailFields";
import FormatDate from "@/libs/FormatDate";
import PhoneFields from "./PhoneFields";
import EditableField from "@/components/Common/EditableField";
import { updateResource } from "@/services/api/common-erpnext-api/create-edit-api";
import SelectCustomerField from "@/components/Customer/SelectCustomerField";
import SelectCustomer from "@/components/Customer/SelectCustomer";

const Basicinfo = ({ slug, doctype }) => {
  let [customerData, setCustomerData] = useState<any>([]);
  let [linkData, setLinkData] = useState<any>([]);
  let [addressData, setAddressData] = useState<any>({});
  let [cusTypeOptions, setCusTypeOptions] = useState<any>([
    "Individual",
    "Company",
    "Partnership",
  ]);

  const [userToken, setUserToken] = useState<any>(() => {
    const initialValue = JSON.parse(
      localStorage.getItem("AccessTokenData") || "{}"
    );
    return initialValue || "";
  });
  const [operation, setOperation] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any>([]);
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
    console.log("customerData", customerData);
    if (doctype == "Customer") {
      setProfile({
        customer_name: slug?.record?.customer_name,
        customer_type: slug?.record?.customer_type,
      });
    } else {
      setProfile({
        first_name: slug?.record?.first_name,
        middle_name: slug?.record?.middle_name,
        last_name: slug?.record?.last_name,
      });
    }
  }, [slug]);

  const CloseDialog = () => {
    setSelectedRow([]);
    setOpen(false);
  };

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
  };

  return (
    <Box sx={{}}>
      <Card sx={{ boxShadow: "none", p: 8 }} className="border">
        <Grid container spacing={12}>
          {/* Profile Card */}
          <Grid item xs={12} sm={3} md={(doctype=="Customer")?2.5:3}>
            <Card
              sx={{
                textAlign: "center",
                padding: (doctype=="Customer")?"20px 10px":"50px 10px",
                border: "2px solid var(--mui-palette-primary-main)",
                width:"100%"
              }}
            >
               <CustomAvatar
                alt={customerData?.name}
                src={`${CONSTANTS.API_BASE_URL}${customerData?.image}`}
                size={(doctype=="Customer")?100:120}
                variant="circular"
                sx={{
                  width: (doctype=="Customer")?100:120,
                  height: (doctype=="Customer")?100:120,
                  margin: "auto",
                  //   backgroundColor: "#E0F2F1",
                }}
              />
              <Typography variant="h6" mt={3}>
                {doctype == "Customer"
                  ? customerData?.customer_name
                  : customerData?.full_name}
              </Typography>
            </Card>

            {doctype == "Contact" && (
              <Box
              sx={{
                padding: 3,
                borderRadius: 2,
                backgroundColor: "background.paper",
                boxShadow: 0,
                display:"flex",
                justifyContent:"center",
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
            )}
          </Grid>
          {/* Details Section */}
          <Grid item xs={12} sm={6} md={9}>
            <Grid container spacing={2} direction="row" rowSpacing={2}>
              {/* First & Last Name */}

              {doctype == "Customer" ? (
                <>
                  <Grid item xs={12} sm={6}>
                    <EditableField
                      label="Customer Name"
                      field="customer_name"
                      value={profile?.customer_name}
                      onSave={handleSave}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <EditableField
                      label="Customer Type"
                      field="customer_type"
                      type="select"
                      options={cusTypeOptions}
                      value={profile?.customer_type}
                      onSave={handleSave}
                    />
                  </Grid>     
                  <Grid item xs={12} sm={6}>
                <Box
                  display="flex"
                  alignItems="flex-start"
                  gap={1}
                  flexDirection="row"
                  mb={4}
                >
                  <Typography className="font-medium text-1xl" sx={{ minWidth: 125}}>
                    Joined On :
                  </Typography>
                  <Typography> <FormatDate date={customerData?.creation} /></Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box
                  display="flex"
                  alignItems="flex-start"
                  gap={1}
                  flexDirection="row"
                >
                  <Typography className="font-medium text-1xl" sx={{ minWidth: 125}}>
                    Status :
                  </Typography>
                  <Typography><Chip
                            label="Active"
                            color="success"
                            variant="outlined"
                            size="small"
                          /></Typography>
                </Box>
              </Grid>       
                </>
              ) : (
                <>
                  <Grid item xs={12} sm={6}>
                    <EditableField
                      label="First Name"
                      field="first_name"
                      value={profile?.first_name}
                      onSave={handleSave}
                    />
                  </Grid>
                  {/* <Grid item xs={12} sm={6}>
                    <EditableField
                      label="Middle Name"
                      field="middle_name"
                      value={profile?.middle_name}
                      onSave={handleSave}
                    />
                  </Grid> */}
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
                      label="Account"
                      field="company_name"
                      value={profile?.company_name}
                      type="component"
                      component={SelectCustomerField}
                      onSave={handleSave}
                    />
                  </Grid>
                </>
              )}

              {/* Type of Contact */}

              {Object.entries(linkData)?.length > 0 && (
                <Grid item xs={12} sm={6}>
                  <Box
                    display="flex"
                    alignItems="flex-start"
                    gap={1}
                    flexDirection="row"
                  >
                    <Typography className="font-medium text-1xl">
                      Customer Name :
                    </Typography>
                    <Link
                      href={`/customers/detail/${linkData?.link_name}`}
                      className="text-primary"
                    >
                      {" "}
                      {linkData?.link_name}
                    </Link>
                  </Box>
                </Grid>
              )}
              <Grid item xs={12} sm={6}>
                <Box
                  display="flex"
                  alignItems="flex-start"
                  gap={1}
                  flexDirection="row"                 
                >
                  <Typography className="font-medium text-1xl" sx={{ minWidth: 125}}>
                    Owner :
                  </Typography>
                  <Typography>{customerData?.owner}</Typography>
                </Box>
              </Grid>
              {doctype == "Customer" && (
              <Grid item xs={12} sm={12}>
                    <Box
                      sx={{
                        padding: 3,
                        borderRadius: 2,
                        backgroundColor: "background.paper",
                        boxShadow: 0,
                      }}
                    >
                      {/* <Typography
                        variant="h5"
                        sx={{
                          borderBottom: 1,
                          borderColor: "divider",
                          pb: 2, 
                           
                          textTransform: "capitalize",
                        }}
                      >
                        Details
                      </Typography> */}

                      {/* <List sx={{ mb: 4, pl: 0 }}>
                        <ListItem
                          sx={{ display: "flex", gap: 1, mb: 1, pl: 0 }}
                        >
                          <Typography variant="subtitle1" fontWeight="bold">
                            Joined on:
                          </Typography>
                          <Typography>
                            {" "}
                            <FormatDate date={customerData?.creation} />
                          </Typography>
                        </ListItem>

                        <ListItem
                          sx={{ display: "flex", gap: 1, mb: 1, pl: 0 }}
                        >
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
                      </List> */}
                    </Box>
                  </Grid>
                )}
              {customerData?.["email_ids"] && (
                <Grid item xs={12} sm={12} mt={5}>
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
                // <Grid item xs={12} sm={12} mt={5} mb={5}>
                //   <Grid container spacing={2}>
                    <Grid item xs={12} sm={12}>
                      <PhoneFields
                        contactname={customerData?.name}
                        phonenos={customerData?.["phone_nos"]}
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

export default Basicinfo;
