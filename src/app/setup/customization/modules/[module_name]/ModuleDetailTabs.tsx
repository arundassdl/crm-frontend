"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import LayoutListing from "@/components/layout-builder/LayoutListing";

interface ModuleDetailTabsProps {
  moduleName: string;
  /** `/settings?tab=…&subtab=…` — module sub-tab uses `moduleTab`, not `tab` (reserved for settings). */
  embedInSettings?: boolean;
}

const ModuleDetailTabs: React.FC<ModuleDetailTabsProps> = ({
  moduleName,
  embedInSettings = false,
}) => {
  const searchParams = useSearchParams();
  const initialTab = embedInSettings
    ? searchParams?.get("moduleTab") === "fields"
      ? "fields"
      : "layouts"
    : searchParams?.get("tab") === "fields"
      ? "fields"
      : "layouts";

  return (
    <LayoutListing
      moduleFilterName={moduleName}
      hideHeading
      initialTab={initialTab}
      embedInSettings={embedInSettings}
    />
  );
};

export default ModuleDetailTabs;
