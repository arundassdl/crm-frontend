"use client";

import React from "react";
import DealDetailDashboard from "@/components/Deals/Detail/DealDetailDashboard";

const DealDetails = (slug: any) => {
  const deal_name = slug?.name;

  if (!deal_name) return null;

  return (
    <div className="w-full">
      <DealDetailDashboard name={deal_name} />
    </div>
  );
};

export default DealDetails;
