"use client";
import React from "react";
import LeadDetailDashboard from "@/components/Leads/Detail/LeadDetailDashboard";

const LeadDetails = (props: { name: string }) => {
  const leadName = props?.name;

  if (!leadName) return null;

  return (
    <div className="w-full">
      <LeadDetailDashboard name={leadName} />
    </div>
  );
};

export default LeadDetails;

