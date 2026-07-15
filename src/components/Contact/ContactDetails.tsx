"use client";

import React from "react";
import ContactDetailDashboard from "@/components/Contact/Detail/ContactDetailDashboard";

const ContactDetails: any = (slug) => {
  const contact_name = slug?.name;

  if (!contact_name) return null;

  return (
    <div className="w-full">
      <ContactDetailDashboard name={contact_name} />
    </div>
  );
};

export default ContactDetails;
