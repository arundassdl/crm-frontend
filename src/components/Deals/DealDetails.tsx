"use client";

import React from "react";
import { Grid } from "@mui/material";
import ViewDetailsForm from "@/components/Common/Form/ViewDetailsForm";

const DealDetails: any = (slug) => {
  const deal_name = slug?.name;

  return (
    <Grid container spacing={5} style={{ padding: "0px" }}>
      <ViewDetailsForm
        moduleName="Deals"
        record_name={deal_name}
        doctype="CRM Deal"
        isEditPermission={true}
      />
    </Grid>
  );
};

export default DealDetails;
