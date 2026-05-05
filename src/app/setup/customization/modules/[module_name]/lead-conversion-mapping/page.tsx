import { redirect } from "next/navigation";

interface PageProps {
  params: { module_name: string };
}

/** Kept for bookmarked URLs; opens Lead Conversion Mapping on the Layouts tab. */
const LeadConversionMappingPage = ({ params }: PageProps) => {
  const { module_name } = params;
  redirect(
    `/setup/customization/modules/${encodeURIComponent(module_name)}?tab=layouts&leadConversion=1`
  );
};

export default LeadConversionMappingPage;
