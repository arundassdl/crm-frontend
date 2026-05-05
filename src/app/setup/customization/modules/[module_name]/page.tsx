import React from "react";
import ModuleDetailTabs from "./ModuleDetailTabs";

interface ModuleDetailPageProps {
  params: {
    module_name: string;
  };
}

const ModuleDetailPage = ({ params }: ModuleDetailPageProps) => {
  const { module_name } = params;

  return <ModuleDetailTabs moduleName={module_name} />;
};

export default ModuleDetailPage;
