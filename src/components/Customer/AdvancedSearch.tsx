import React, { useEffect, useState } from "react";
import {
  Formik,
  Form as FormikForm,
  Field,
  ErrorMessage,
  useFormik,
} from "formik";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  IconButton,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Box,
  List,
  ListItem,
  ListItemText,
  Divider,
  ListItemButton,
  ListItemIcon,
} from "@mui/material";
import { GridCloseIcon } from "@mui/x-data-grid";
import { showToast } from "../ToastNotificationNew";
import debounce from "lodash/debounce";
import { fetchCustomerSearch } from "@/services/api/contact-api/manage-customer-api";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import { Option } from "@/types/customer";

interface AdvancedSearchPopupProps {
  open: boolean;
  onClose: () => void;
  onCustomerSelect: (customer: Option | null) => void;
}

export default function AdvancedSearchPopup({
  open,
  onClose,
  onCustomerSelect,
}: AdvancedSearchPopupProps) {
  const [options, setOptions] = useState<any>([]);
  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = () => {
    const term = searchTerm.replace("%", ".*"); // Convert % to regex wildcard
    const regex = new RegExp(`^${term}`, "i");
    console.log("term", term);
    fetchSrchOptions(term);
  };
  const [userToken, setUserToken] = useState<any>(() => {
    const initialValue = JSON.parse(
      localStorage.getItem("AccessTokenData") || "{}"
    );
    return initialValue || "";
  });

  const fetchSrchOptions = debounce(async (query: string) => {
    // if (!query) return;

    setLoading(true);

    try {
      const response = await fetchCustomerSearch(
        query,
        userToken?.access_token
      );
      console.log("set options1", Object.values(response));
      //   const data = await response.json();
      // const formattedOptions = response.map((user: any) => ({
      //   name: user.name,
      //   email: user.email_id,
      // }));
      const customers = Object.keys(response).map((customerKey) => {
        const customerData = response[customerKey];
        const { customer, addresses } = customerData;
        console.log("customer=>", customer);

        return {
          name: customer.customer_name, // Display name for the autocomplete
          id: customer.id, // Unique customer ID
          customerType: customer.customer_type,
          email: customer.email,
          phone: customer.phone,
          addresses: addresses || [], // Ensure addresses is an array
        };
      });
      setOptions(customers);
    } catch (error) {
      console.error("Error fetching options:", error);
    } finally {
      setLoading(false);
    }
  }, 300); // 300ms debounce delay

  const handleCusClick = (cus, address) => {
    console.log("cuscus", cus);
    console.log("cuscus address", address);

    const appendedObject = {
      id: cus?.id,
      name: cus?.name,
      email: cus?.email,
      phone: cus?.phone,
      addresses: address,
    };
    onCustomerSelect(appendedObject);

    console.log("selectedCusValuename", appendedObject);
    onClose();
  };

  useEffect(() => {
    setTimeout(() => {
      console.log("open=====>", open);
      if (open) {
        fetchSrchOptions("");
      }
      console.log("search popup");
    }, 500);
  }, []);

  // const customers = Object.values(response);
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent default form submission behavior
      handleSearch(); // Trigger the search function
    }
  };
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h4">Search Customer</Typography>
        {/* Close button */}
        <IconButton onClick={onClose} aria-label="close">
          <GridCloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ paddingTop: "10px" }}>
        <Box mb={2} mt={2}>
          <TextField
            fullWidth
            label="Search"
            placeholder="Search"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </Box>

        <List
          sx={{ width: "100%", bgcolor: "background.paper" }}
          component="nav"
        >
          {options.length > 0 ? (
            <>
              {options.map((customer) => (
                <React.Fragment key={customer.id}>
                  {/* Customer Details */}
                  {customer.addresses.length == 0 && (
                    <ListItem disablePadding>
                      <ListItemButton>
                        <ListItemIcon>
                          <PersonOutlineIcon />
                        </ListItemIcon>
                        <ListItemText
                          onClick={() => {
                            handleCusClick(customer, "");
                          }}
                          primary={customer.name}
                          secondary={`Type: ${customer.customerType} | ID: ${customer.id}`}
                        />
                      </ListItemButton>
                    </ListItem>
                  )}

                  {/* Associated Addresses */}
                  {customer.addresses.length > 0 ? (
                    <>
                      <ListItem disablePadding>
                        <ListItemButton sx={{ cursor: "not-allowed" }}>
                          <ListItemIcon>
                            <PersonOutlineIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary={customer.name}
                            secondary={`Type: ${customer.customerType} | ID: ${customer.id}`}
                          />
                        </ListItemButton>
                      </ListItem>
                      <List component="div" disablePadding sx={{ pl: 4 }}>
                        {customer.addresses.map((address, addrIndex) => (
                          <React.Fragment key={address.address_id}>
                            <ListItem disablePadding>
                              <ListItemButton>
                                <ListItemIcon>
                                  {" "}
                                  <LocationOnOutlinedIcon />{" "}
                                </ListItemIcon>
                                <ListItemText
                                  onClick={() => {
                                    handleCusClick(customer, address);
                                  }}
                                  primary={
                                    address.address_line1 ||
                                    "Address not provided"
                                  }
                                  secondary={`City: ${address.city || "N/A"}, State: ${
                                    address.state || "N/A"
                                  }, Pincode: ${address.pincode || "N/A"}`}
                                />
                              </ListItemButton>
                            </ListItem>
                            {addrIndex < customer.addresses.length - 1 && (
                              <Divider />
                            )}
                          </React.Fragment>
                        ))}
                      </List>
                    </>
                  ) : (
                    // <Typography
                    //   variant="body2"
                    //   color="text.secondary"
                    //   sx={{ pl: 6, py: 1 }}
                    // >
                    //   No addresses available
                    // </Typography>
                    <></>
                  )}

                  <Divider variant="fullWidth" />
                </React.Fragment>
              ))}
            </>
          ) : (
            <Typography>No Records</Typography>
          )}
        </List>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={handleSearch}>
          Search
        </Button>
      </DialogActions>
    </Dialog>
  );
}
