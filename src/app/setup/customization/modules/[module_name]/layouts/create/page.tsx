"use client";

import React, { useMemo } from "react";
import LayoutBuilderContainer from "@/components/layout-builder/LayoutBuilderContainer";
import { useParams, usePathname, useSearchParams } from "next/navigation";

const CloneLayoutPage = () => {
  const params = useParams();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // module_name from params; fallback: parse from URL path (e.g. .../modules/Territories/layouts/create)
  const moduleName = useMemo(() => {
    if (params?.module_name && typeof params.module_name === "string") {
      return params.module_name;
    }
    const segments = pathname?.split("/") ?? [];
    const modulesIdx = segments.indexOf("modules");
    if (modulesIdx !== -1 && segments[modulesIdx + 1] && segments[modulesIdx + 1] !== "layouts") {
      return segments[modulesIdx + 1];
    }
    return undefined;
  }, [params?.module_name, pathname]);

  // Source layout id to clone from, passed via query string
  const sourceLayoutId =
    (searchParams?.get("clone_from") as string | null) ??
    (searchParams?.get("layout_id") as string | null) ??
    undefined;

  return (
    <LayoutBuilderContainer
      module={moduleName}
      layoutId={sourceLayoutId}
      isClone={true}
    />
  );
};

export default CloneLayoutPage;

