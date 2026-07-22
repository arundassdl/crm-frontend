"use client"
import React from "react";
import PermissionMatrix from "@/components/roles/PermissionMatrix";
// import PermissionMatrix from "@/components/roles/PermissionSwitchesDemo";

const Permission = () => {
  return (
    <div className="flex h-screen min-h-0 w-full flex-col overflow-hidden">
        <PermissionMatrix />
    </div>
  );
};

export default Permission;
