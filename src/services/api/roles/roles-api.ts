/** Signed-session Role administration client. Browser credentials are never accepted. */

async function request(view: string, init?: RequestInit, query: Record<string, unknown> = {}) {
  const params = new URLSearchParams({ view });
  for (const [key, value] of Object.entries(query))
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  const response = await fetch(`/api/roles?${params}`, {
    credentials: "same-origin",
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.message || "Role operation failed");
  return data;
}

function formBody(input: any): Record<string, unknown> {
  const raw = input instanceof FormData
    ? Object.fromEntries(input.entries())
    : input && typeof input === "object" ? { ...input } : {};
  if (raw.data_share === undefined && raw.share_data_with_peers !== undefined)
    raw.data_share = raw.share_data_with_peers;
  const allowed = ["name", "role_name", "role_description", "permission", "reports_to", "data_share", "disabled"];
  return Object.fromEntries(allowed.filter(key => raw[key] !== undefined).map(key => [key, raw[key]]));
}

export const getRolesListDatagrid = async (query: any, _token?: unknown) => {
  const page = Math.max(0, Number(query?.page ?? 0));
  const pageSize = Math.min(100, Math.max(1, Number(query?.rowsPerPage ?? query?.limit ?? 20)));
  const result = await request("list", undefined, {
    search: query?.q || query?.search || "",
    start: page * pageSize,
    page_length: pageSize,
  });
  return {
    data: result.records || [], totalCount: result.total_count || 0,
    list: result.records || [], count: result.total_count || 0,
  };
};

export const fetchpermissionmodule = async (_token?: unknown) => request("modules");
export const get_roleby_name = async (input: any, _token?: unknown) =>
  request("detail", undefined, { name: input?.name || input?.rolename });
export const get_full_roles_tree = async () => request("tree");
export const get_full_roles_withouttree = async (_roleName?: unknown) =>
  request("tree", undefined, { flat: 1 });
export const get_role_timeline = async (name: string) => request("timeline", undefined, { name });

export const get_rolesname_list = async (_token?: unknown) => {
  const rows = await request("tree", undefined, { flat: 1 });
  return Array.isArray(rows)
    ? rows.map((row: any) => ({ value: row.name, label: row.role_name || row.name, ...row }))
    : [];
};

export const get_array_from_roledoctype = async () => {
  const result = await request("menu");
  if (typeof window !== "undefined") {
    localStorage.setItem("menuListData", JSON.stringify(result));
    document.cookie = `menuListData=${encodeURIComponent(JSON.stringify(result))}; Path=/; SameSite=Lax`;
  }
  return result;
};

async function mutate(method: "POST" | "PUT" | "DELETE", input: any) {
  try {
    const data = await request("list", { method, body: JSON.stringify(formBody(input)) });
    return { msg: "success", data };
  } catch (error) {
    return { msg: "error", error: error instanceof Error ? error.message : "Role operation failed" };
  }
}

export const submit_addroles = async (input: any, _token?: unknown) => mutate("POST", input);
export const submit_editroles = async (input: any, _token?: unknown) => mutate("PUT", input);
export const delete_role = async (input: any, _token?: unknown) => mutate("DELETE", input);
