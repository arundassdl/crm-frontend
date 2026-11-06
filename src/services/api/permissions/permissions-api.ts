interface Permission { fullAccess: boolean; create: boolean; read: boolean; update: boolean; delete: boolean; print: boolean; import: boolean; export: boolean; email: boolean; dataSharing: "Private" | "Public"; }
interface Modules { [moduleName: string]: { [roleName: string]: Permission } }

async function load() {
  const response = await fetch("/api/roles/permissions", { credentials: "same-origin" });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.message || "Permission matrix is unavailable");
  return data;
}

export const getPermissionsMatrix = async (_token?: unknown) => ({ matrix: (await load()).matrix || {} });
export const getPermissions = getPermissionsMatrix;
export const getAllRoles = async (_token?: unknown) => (await load()).roles || [];
export const getAllModules = async (_token?: unknown) => (await load()).modules || [];

export const savePermissionsMatrix = async (_token: unknown, matrix: Modules) => {
  const response = await fetch("/api/roles/permissions", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ matrix }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.message || "Failed to save permissions");
  return data;
};
