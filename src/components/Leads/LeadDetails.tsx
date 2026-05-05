"use client";
import React from "react";
import { Grid } from "@mui/material";
import ViewDetailsForm from "@/components/Common/Form/ViewDetailsForm";

const LeadDetails: any = (slug) => {
  const lead_name = slug?.name;

  return (
    <Grid container spacing={5} style={{ padding: "0px" }}>
      <ViewDetailsForm
        moduleName="Leads"
        record_name={lead_name}
        doctype="CRM Lead"
        isEditPermission={true}
      />
    </Grid>
  );
};

export default LeadDetails;
