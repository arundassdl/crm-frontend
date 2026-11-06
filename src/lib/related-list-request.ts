const IDENTIFIER = /^[A-Za-z0-9_]+$/;

export function buildRelatedFilters(input: {
  mainDoctype: string;
  kind: string;
  parentModule: string;
  linkName: string;
  linkFieldName?: string;
}): unknown[] {
  const { mainDoctype, kind, parentModule, linkName, linkFieldName } = input;
  if (!mainDoctype || !linkName) return [];
  if (kind === "task") {
    if (parentModule === "Contacts")
      return [[mainDoctype, "contact_name", "=", linkName]];
    const referenceDoctype: Record<string, string> = {
      Accounts: "CRM Organization",
      Deals: "CRM Deal",
      Leads: "CRM Lead",
    };
    if (referenceDoctype[parentModule])
      return [
        [mainDoctype, "reference_docname", "=", linkName],
        [mainDoctype, "reference_doctype", "=", referenceDoctype[parentModule]],
      ];
  }
  if (!linkFieldName || !IDENTIFIER.test(linkFieldName)) return [];
  return [[mainDoctype, linkFieldName, "=", linkName]];
}
