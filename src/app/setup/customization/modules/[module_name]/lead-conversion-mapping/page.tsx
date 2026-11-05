import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ module_name: string }>;
}

/** Kept for bookmarked URLs; opens Lead Conversion Mapping on the Layouts tab. */
const LeadConversionMappingPage = async ({ params: paramsPromise }: PageProps) => {
  const params = await paramsPromise;
  const { module_name } = params;
  redirect(
    `/setup/customization/modules/${encodeURIComponent(module_name)}?tab=layouts&leadConversion=1`
  );
};

export default LeadConversionMappingPage;
