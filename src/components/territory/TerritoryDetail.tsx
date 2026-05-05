"use client";

import React from "react";
import { Grid } from "@mui/material";

import ViewDetailsForm from "@/components/Common/Form/ViewDetailsForm";

const TerritoryDetail: any = (slug) => {
  const territory_name = slug?.territory_name;

  return (
    <Grid container spacing={5} style={{ padding: "0px" }}>
      <ViewDetailsForm
        moduleName="Territories"
        record_name={territory_name}
        doctype="CRM Territory" 
        isEditPermission={true}
      />
    </Grid>
  );
};

export default TerritoryDetail;
