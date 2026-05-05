"use client";

import React from "react";
import { Grid } from "@mui/material";
import ViewDetailsForm from "@/components/Common/Form/ViewDetailsForm";

const ContactDetails: any = (slug) => {
  const contact_name = slug?.name;

  return (
    <Grid container spacing={5} style={{ padding: "0px" }}>
      <ViewDetailsForm
        moduleName="Contacts"
        record_name={contact_name}
        doctype="Contact"
        isEditPermission={true}
      />
    </Grid>
  );
};

export default ContactDetails;
