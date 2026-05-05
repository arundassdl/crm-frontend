"use client";

import React from "react";
import { Grid } from "@mui/material";
import ViewDetailsForm from "@/components/Common/Form/ViewDetailsForm";

const CustomerDetails: any = (slug) => {
  const customer_name = slug?.name;

  return (
    <Grid container spacing={5} style={{ padding: "0px" }}>
      <ViewDetailsForm
        moduleName="Accounts"
        record_name={customer_name}
        doctype="CRM Organization"
        isEditPermission={true}
      />
    </Grid>
  );
};

export default CustomerDetails;
