"use client";

import React from "react";
import AccountDetailDashboard from "@/components/Customer/Detail/AccountDetailDashboard";

const CustomerDetails: any = (slug: any) => {
  const customer_name = slug?.name;

  if (!customer_name) return null;

  return (
    <div className="w-full">
      <AccountDetailDashboard name={customer_name} />
    </div>
  );
};

export default CustomerDetails;
