import React from "react";
import ModuleDetailTabs from "./ModuleDetailTabs";

interface ModuleDetailPageProps {
  params: Promise<{
    module_name: string;
  }>;
}

const ModuleDetailPage = async ({ params: paramsPromise }: ModuleDetailPageProps) => {
  const params = await paramsPromise;
  const { module_name } = params;

  return <ModuleDetailTabs moduleName={module_name} />;
};

export default ModuleDetailPage;
