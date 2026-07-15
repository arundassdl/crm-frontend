"use client"; // Required for Next.js App Router

import React, { useRef, useState } from "react";
import { Box, Tab, Tabs } from "@mui/material";

import StyledContainer from "@/@core/theme/overrides/container";
import RoleOverview, { ChildRefType } from "./Overview";
import RoleDetailTimeline from "./RoleDetailTimeline";

const RoleDetailTabs = ({ customerData }) => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const roleoverview = useRef<ChildRefType>(null);

  /** Frappe `Comment.reference_name` for SDL Role */
  const sdlRoleDocName = customerData?.name ?? customerData?.role_name;

  const tabsData = [
    {
      label: "Overview",
      Component: (
        <RoleOverview slug={customerData?.role_name} ref={roleoverview} />
      ),
    },
    {
      label: "Timeline",
      Component: (
        <RoleDetailTimeline recordName={sdlRoleDocName} active={activeTab === 1} />
      ),
    },
  ];

  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-[#EFF6FF] px-6 py-6 dark:bg-[#0A0A0A]">
      <div className="mb-5 flex items-center gap-2">
        {tabsData.map((tab, index) => {
          const selected = activeTab === index;
          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => setActiveTab(index)}
              className={`rounded-full px-4 py-1.5 text-[14px] font-semibold transition-all ${
                selected
                  ? "bg-[#1D4ED8] text-white shadow-sm dark:bg-[#27272A] dark:text-[#D4D4D8]"
                  : "bg-white text-slate-500 hover:bg-[#E3ECFC] hover:text-[#0C2472] dark:bg-[#1C1C1E] dark:text-[#9CA3AF] dark:hover:bg-[#27272A]"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1">{tabsData[activeTab]?.Component}</div>
    </div>
  );
};

export default RoleDetailTabs;
