import { SecurityError } from "./security";
const READ = new Set([
  "frappe.client.get_list",
  "frappe.desk.reportview.get_count",
  "frappe.client.get",
  "frappe.desk.form.load.getdoc",
  "frappe.desk.form.load.getdoctype",
  "frappe.desk.search.search_link",
  "frappe.desk.form.linked_with.get",
  "frappe.auth.get_logged_user",
]);
const WRITE = new Set([
  "frappe.client.insert",
  "frappe.client.save",
  "frappe.client.set_value",
  "frappe.client.delete",
  "frappe.desk.form.save.savedocs",
  "frappe.desk.form.utils.add_comment",
  "frappe.desk.form.utils.add_note",
  "upload_file",
]);
const METADATA_READ = new Set([
  "sdl_metadata.api.component_picklist.get_component_picklist",
  "sdl_metadata.api.component_picklist.unused_picklist_option",
  "sdl_metadata.api.conversionmap.get_conversion_map",
  "sdl_metadata.api.custom_field.list_custom_fields",
  "sdl_metadata.api.custom_field.get_custom_fields",
  "sdl_metadata.api.custom_field.get_customize_field",
  "sdl_metadata.api.deal.get_stagehistory",
  "sdl_metadata.api.layout.get_layout",
  "sdl_metadata.api.layout.get_layout_list",
  "sdl_metadata.api.layout.list_layouts",
  "sdl_metadata.api.layout.get_module_layout_list",
  "sdl_metadata.api.layout.get_relatedlist",
  "sdl_metadata.api.layout.get_formFields",
  "sdl_metadata.api.layout.get_quickcreate_form_fields",
  "sdl_metadata.api.lookup.search",
  "sdl_metadata.api.modules.get_modulelisting",
  "sdl_metadata.api.permission.get_field_permissions",
  "sdl_metadata.api.stage_probability.get_component_stage_probability",
  "sdl_metadata.api.stage_probability.get_component_stageprobability",
  "sdl_metadata.api.stage_probability.unused_stage_probability_option",
]);
const METADATA_WRITE = new Set([
  "sdl_metadata.api.component_picklist.add_component_picklist",
  "sdl_metadata.api.component_picklist.update_component_picklist",
  "sdl_metadata.api.conversionmap.save_conversion_map",
  "sdl_metadata.api.custom_field.create_custom_field",
  "sdl_metadata.api.custom_field.update_custom_field",
  "sdl_metadata.api.custom_field.delete_custom_field",
  "sdl_metadata.api.layout.save_layout",
  "sdl_metadata.api.layout.set_default",
  "sdl_metadata.api.layout.set_default_layout",
  "sdl_metadata.api.lead_conversion.convert_lead",
  "sdl_metadata.api.permission.save_field_permission",
  "sdl_metadata.api.stage_probability.add_component_stage_probability",
  "sdl_metadata.api.stage_probability.update_component_stage_probability",
]);
export const CRM_DOCTYPES = new Set([
  "CRM Lead",
  "CRM Deal",
  "Contact",
  "CRM Organization",
  "CRM Task",
  "ToDo",
  "Note",
  "Comment",
  "File",
  "Address",
  "CRM Lead Status",
  "CRM Deal Status",
  "CRM Contacts",
  "Dynamic Link",
  "Contact Email",
  "Contact Phone",
  "Country",
  "Currency",
  "CRM Industry",
  "CRM Territory",
  "CRM Note",
  "CRM Communication Status",
  "CRM Lost Reason",
]);
export function allowedDoctype(value: unknown): void {
  if (typeof value !== "string" || !CRM_DOCTYPES.has(value))
    throw new SecurityError(403, "DOCTYPE_FORBIDDEN");
}
export function allowedMethod(
  method: string,
  verb: string,
  args: Record<string, any> = {},
): void {
  if (method.startsWith("sdl_user_management.um.")) {
    if (
      !new Set([
        "me",
        "update_me",
        "list_users",
        "get_user",
        "list_role_profiles",
        "set_role_profile",
        "set_status",
      ]).has(method.slice("sdl_user_management.um.".length))
    )
      throw new SecurityError(403, "METHOD_FORBIDDEN");
    if (
      ["update_me", "set_role_profile", "set_status"].some((s) =>
        method.endsWith("." + s),
      ) &&
      verb !== "POST"
    )
      throw new SecurityError(405, "METHOD_NOT_ALLOWED");
    return;
  }
  if (METADATA_READ.has(method)) return;
  if (METADATA_WRITE.has(method)) {
    if (verb !== "POST")
      throw new SecurityError(405, "METHOD_NOT_ALLOWED");
    return;
  }
  if (method.startsWith("sdl_metadata.") || method.startsWith("report_addon."))
    throw new SecurityError(501, "FEATURE_BACKEND_NOT_VERIFIED");
  if (!READ.has(method) && !WRITE.has(method))
    throw new SecurityError(403, "METHOD_FORBIDDEN");
  if (WRITE.has(method) && verb !== "POST")
    throw new SecurityError(405, "METHOD_NOT_ALLOWED");
  if (args.doctype) allowedDoctype(args.doctype);
  if (args.doc) {
    let doc: any;
    try {
      doc = typeof args.doc === "string" ? JSON.parse(args.doc) : args.doc;
    } catch {
      throw new SecurityError(400, "BAD_DOCUMENT");
    }
    allowedDoctype(doc?.doctype);
  }
  const owned = new Set([
    "owner",
    "creation",
    "modified_by",
    "doctype",
    "docstatus",
    "ignore_permissions",
    "ignore_version",
    "evoq_user_key",
    "evoq_is_org_owner",
  ]);
  if (method === "frappe.client.set_value") {
    const fields =
      typeof args.fieldname === "string"
        ? [args.fieldname]
        : Object.keys(args.fieldname || {});
    if (fields.some((field) => owned.has(field) || field.startsWith("__")))
      throw new SecurityError(403, "FIELD_FORBIDDEN");
  }
  if (args.doc) {
    const doc = typeof args.doc === "string" ? JSON.parse(args.doc) : args.doc;
    if (
      Object.keys(doc).some(
        (field) =>
          field !== "doctype" && (owned.has(field) || field.startsWith("__")),
      )
    )
      throw new SecurityError(403, "FIELD_FORBIDDEN");
  }
  if (args.reference_doctype) allowedDoctype(args.reference_doctype);
  if (args.attached_to_doctype) allowedDoctype(args.attached_to_doctype);
}
