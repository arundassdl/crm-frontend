"use client";

import React, { useMemo } from "react";
import LayoutBuilderContainer from "@/components/layout-builder/LayoutBuilderContainer";
import { useParams, usePathname, useSearchParams } from "next/navigation";

const EditLayoutPage = () => {
  const params = useParams();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // module_name from params; fallback: parse from URL path (e.g. .../modules/Territories/layouts/edit/...)
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

  const layoutId = (params?.id as string) ?? undefined;
  const isClone = searchParams?.get("clone") === "1";

  return <LayoutBuilderContainer module={moduleName} layoutId={layoutId} isClone={isClone} />;
};

export default EditLayoutPage;
