import { readAccessTokenDataRaw } from '@/utils/accessTokenDataStorage'
import React, { useState, useEffect } from "react";
import { Button, Tooltip, CircularProgress } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  Square,
  Plus,
  Eye,
  PencilSimple,
  Trash,
  Printer,
  UploadSimple,
  DownloadSimple,
  Envelope,
  Globe,
  Lock,
} from "@phosphor-icons/react";
import { getPermissionsMatrix, savePermissionsMatrix, getAllRoles, getAllModules } from "@/services/api/permissions/permissions-api";
import { showToast } from "@/components/ToastNotificationNew";

// ─────────────────────────────────────────────
//  Types (backend data model — preserved)
// ─────────────────────────────────────────────
interface Permission {
  fullAccess: boolean;
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
  print: boolean;
  import: boolean;
  export: boolean;
  email: boolean;
  dataSharing: 'Private' | 'Public';
}

interface ModulePermissions {
  [roleName: string]: Permission;
}

interface Modules {
  [moduleName: string]: ModulePermissions;
}

// ─────────────────────────────────────────────
//  Presentation metadata (matches reference UI)
// ─────────────────────────────────────────────
type PermKey = "fullAccess" | "create" | "read" | "update" | "delete" | "print" | "import" | "export" | "email" | "dataSharingPublic";

const PERM_PAIRS: [PermKey, PermKey][] = [
  ["fullAccess", "create"],
  ["read", "update"],
  ["delete", "print"],
  ["import", "export"],
  ["email", "dataSharingPublic"],
];

const PERM_META: Record<PermKey, { label: string; icon: React.ElementType; color: string }> = {
  fullAccess:        { label: "Full Access",           icon: Square,         color: "#10B981" },
  create:            { label: "Create",                icon: Plus,           color: "#1D4ED8" },
  read:              { label: "Read",                  icon: Eye,            color: "#06B6D4" },
  update:            { label: "Update",                icon: PencilSimple,   color: "#F59E0B" },
  delete:            { label: "Delete",                icon: Trash,          color: "#EF4444" },
  print:             { label: "Print",                 icon: Printer,        color: "#64748B" },
  import:            { label: "Import",                icon: UploadSimple,   color: "#8B5CF6" },
  export:            { label: "Export",                icon: DownloadSimple, color: "#8B5CF6" },
  email:             { label: "Email",                 icon: Envelope,       color: "#64748B" },
  dataSharingPublic: { label: "Data Sharing (Public)", icon: Globe,          color: "#10B981" },
};

// Dynamic roles get colours cycled from this palette (reference uses fixed colours).
const ROLE_COLORS = ["#3B82F6", "#8B5CF6", "#10B981", "#06B6D4", "#F59E0B", "#EF4444", "#EC4899", "#14B8A6"];
const roleColor = (i: number) => ROLE_COLORS[i % ROLE_COLORS.length];

const heavyWeight = (k: PermKey): "fill" | "duotone" => (k === "fullAccess" || k === "delete" ? "fill" : "duotone");

const PermissionMatrix: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [roles, setRoles] = useState<{ name: string }[]>([]);
  const [modules, setModules] = useState<{ name: string }[]>([]);
  const [permissions, setPermissions] = useState<Modules>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"matrix" | "summary">("matrix");

  const [userToken] = useState<any>(() => {
    try {
      return JSON.parse(readAccessTokenDataRaw()) || "";
    } catch {
      return "";
    }
  });

  // ── Core permission update logic (preserved from original) ──
  const updatePermission = (module: string, role: string, action: keyof Permission, value: boolean) => {
    setPermissions(prev => {
      const currentRolePerms = prev[module]?.[role] as Permission;

      if (action === 'fullAccess') {
        const updated: Permission = {
          fullAccess: value, create: value, read: value, update: value,
          delete: value, print: value, import: value, export: value, email: value,
          // Do not change Data Sharing when toggling Full Access
          dataSharing: currentRolePerms?.dataSharing || 'Private',
        };
        return { ...prev, [module]: { ...prev[module], [role]: updated } };
      }

      if (action === 'dataSharing') {
        const updated: Permission = {
          ...currentRolePerms,
          dataSharing: value ? 'Public' : 'Private',
          fullAccess: currentRolePerms.fullAccess,
        };
        return { ...prev, [module]: { ...prev[module], [role]: updated } };
      }

      const updated: Permission = {
        ...currentRolePerms,
        [action]: value,
        fullAccess: value ? currentRolePerms.fullAccess : false,
      };
      return { ...prev, [module]: { ...prev[module], [role]: updated } };
    });
    setSaved(false);
  };

  // Boolean view of a permission key (maps dataSharingPublic ⇄ dataSharing === 'Public').
  const getBool = (module: string, role: string, key: PermKey): boolean => {
    const p = permissions[module]?.[role];
    if (!p) return false;
    if (key === "dataSharingPublic") return p.dataSharing === "Public";
    return !!p[key];
  };

  const buildRoleState = (module: string, role: string): Record<PermKey, boolean> => ({
    fullAccess: getBool(module, role, "fullAccess"),
    create: getBool(module, role, "create"),
    read: getBool(module, role, "read"),
    update: getBool(module, role, "update"),
    delete: getBool(module, role, "delete"),
    print: getBool(module, role, "print"),
    import: getBool(module, role, "import"),
    export: getBool(module, role, "export"),
    email: getBool(module, role, "email"),
    dataSharingPublic: getBool(module, role, "dataSharingPublic"),
  });

  const onToggle = (module: string, role: string, key: PermKey) => {
    const next = !getBool(module, role, key);
    if (key === "dataSharingPublic") updatePermission(module, role, "dataSharing" as keyof Permission, next);
    else updatePermission(module, role, key as keyof Permission, next);
  };

  // ── Data loading (preserved) ──
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [rolesResponse, modulesResponse, permissionsResponse] = await Promise.all([
          getAllRoles(userToken?.access_token).catch((err: any) => {
            console.error('Error loading roles:', err);
            throw new Error(`Failed to load roles: ${err.message || 'Unknown error'}`);
          }),
          getAllModules(userToken?.access_token).catch((err: any) => {
            console.error('Error loading modules:', err);
            throw new Error(`Failed to load modules: ${err.message || 'Unknown error'}`);
          }),
          getPermissionsMatrix(userToken?.access_token).catch((err: any) => {
            console.error('Error loading permissions:', err);
            throw new Error(`Failed to load permissions: ${err.message || 'Unknown error'}`);
          }),
        ]);

        const rolesData = rolesResponse.map(role =>
          typeof role === 'string' ? { name: role } : { name: role.role_name || role.name }
        );
        const modulesData = modulesResponse.map(module =>
          typeof module === 'string' ? { name: module } : { name: module.module_name || module.name }
        );

        setRoles(rolesData);
        setModules(modulesData);
        setPermissions(permissionsResponse.matrix || {});
      } catch (err: any) {
        console.error('Error loading data:', err);
        setError(`Failed to load data: ${err.message || 'Unknown error'}`);
        showToast(`Failed to load data: ${err.message || 'Unknown error'}`, 'error');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // ── Save (preserved) ──
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const response = await savePermissionsMatrix(userToken?.access_token, permissions);
      if (response && response.message && response.message.msg === 'success') {
        showToast('Permissions saved successfully', 'success');
        setSaved(true);
      } else {
        const errorMessage = response?.message?.error || 'Unknown error occurred';
        setError(errorMessage);
        showToast(`Failed to save permissions: ${errorMessage}`, 'error');
      }
    } catch (err: any) {
      console.error('Error saving permissions:', err);
      const errorMessage = err.message || 'Failed to save permissions. Please try again.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────
  //  Sub-components (match reference)
  // ─────────────────────────────────────────────
  const MiniToggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button onClick={onChange}
      className={`relative inline-flex w-[28px] h-[15px] rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0 ${checked ? "bg-[#10B981]" : isDark ? "bg-[#3F3F46]" : "bg-slate-200"}`}>
      <span className={`inline-block w-[11px] h-[11px] rounded-full bg-white shadow-sm transform transition-transform duration-200 absolute top-[2px] ${checked ? "translate-x-[15px]" : "translate-x-[2px]"}`} />
    </button>
  );

  const PermCell = ({ module, role }: { module: string; role: string }) => {
    const state = buildRoleState(module, role);
    return (
      <div className="px-3 py-2 space-y-1.5 min-w-[120px]">
        {PERM_PAIRS.map(([p1, p2]) => {
          const M1 = PERM_META[p1], M2 = PERM_META[p2];
          const off = isDark ? "#3F3F46" : "#E2E8F0";
          return (
            <div key={p1} className="flex items-center gap-2.5">
              <Tooltip title={M1.label}>
                <div className="flex items-center gap-0.5">
                  <MiniToggle checked={state[p1]} onChange={() => onToggle(module, role, p1)} />
                  <M1.icon size={10} color={state[p1] ? M1.color : off} weight={heavyWeight(p1)} />
                </div>
              </Tooltip>
              <Tooltip title={M2.label}>
                <div className="flex items-center gap-0.5">
                  <MiniToggle checked={state[p2]} onChange={() => onToggle(module, role, p2)} />
                  <M2.icon size={10} color={state[p2] ? M2.color : off} weight={heavyWeight(p2)} />
                </div>
              </Tooltip>
            </div>
          );
        })}
      </div>
    );
  };

  // ─────────────────────────────────────────────
  //  Render
  // ─────────────────────────────────────────────
  return (
    <div className={`flex-1 flex flex-col overflow-hidden ${isDark ? "bg-[#0A0A0A]" : "bg-white"}`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? "bg-[#111113] border-[#27272A]" : "bg-[#f9fbff] border-[#E3ECFC]"}`}>
        <div className={`text-[18px] font-extrabold tracking-tight ${isDark ? "text-[#D4D4D8]" : "text-slate-900"}`}>Permissions</div>
        <Button variant="contained" size="small"
          onClick={handleSave}
          disabled={saving || loading}
          startIcon={saving ? <CircularProgress size={14} sx={{ color: "inherit" }} /> : undefined}
          sx={{ bgcolor: saved ? "#10B981" : (isDark ? "#27272A" : "#1D4ED8"), color: saved ? "#fff" : (isDark ? "#D4D4D8" : "white"), borderRadius: "9px", textTransform: "none", fontWeight: 700, fontSize: "0.75rem", px: 2, py: 0.8, boxShadow: isDark ? "none" : "0 1px 6px #1D4ED833", "&:hover": { bgcolor: saved ? "#059669" : (isDark ? "#3F3F46" : "#2563EB") }, "&.Mui-disabled": { color: isDark ? "#71717A" : "#fff", opacity: 0.7 } }}>
          {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
        </Button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-6 mt-4 flex items-start justify-between gap-3 rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-2.5 text-[13px] text-[#B91C1C]">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="font-bold text-[#B91C1C] hover:opacity-70">×</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 px-6 pt-4 pb-0">
        {(["matrix", "summary"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-t-xl text-[14px] font-semibold transition-all border border-b-0 ${
              tab === t
                ? isDark ? "bg-[#1C1C1E] border-[#27272A] text-[#D4D4D8]" : "bg-white border-[#E3ECFC] text-slate-900"
                : isDark ? "bg-transparent border-transparent text-[#9CA3AF] hover:text-[#A1A1AA]" : "bg-transparent border-transparent text-slate-400 hover:text-slate-600"
            }`}>
            {t === "matrix" ? "Permission Matrix" : "Summary View"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <CircularProgress size={44} />
        </div>
      ) : (
        <>
          {/* Matrix */}
          {tab === "matrix" && (
            <div className={`flex-1 overflow-auto mx-6 mb-4 rounded-b-2xl rounded-tr-2xl border shadow-sm ${isDark ? "bg-[#1C1C1E] border-[#27272A]" : "bg-white border-[#E3ECFC]"}`}>
              <table className="w-full border-collapse text-left" style={{ minWidth: 900 }}>
                <thead>
                  <tr className={`border-b ${isDark ? "bg-[#111113] border-[#27272A]" : "bg-[#f9fbff] border-[#E3ECFC]"}`}>
                    <th className={`sticky left-0 z-10 px-5 py-3 text-[11px] font-bold uppercase tracking-wider w-[160px] border-r ${isDark ? "bg-[#111113] text-[#9CA3AF] border-[#27272A]" : "bg-[#f9fbff] text-slate-600 border-[#E3ECFC]"}`}>
                      Module
                    </th>
                    {roles.map((role, ri) => (
                      <th key={role.name} className="px-3 py-3 text-center min-w-[140px]">
                        <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold text-white" style={{ backgroundColor: roleColor(ri) }}>
                          {role.name}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {modules.map((mod, i) => (
                    <tr key={mod.name} className={`border-b ${isDark ? `border-[#27272A] ${i % 2 === 0 ? "bg-[#1C1C1E]" : "bg-[#18181B]"}` : `border-[#E3ECFC] ${i % 2 === 0 ? "bg-white" : "bg-[#f9fbff]"}`}`}>
                      <td className={`sticky left-0 z-10 px-5 py-2 border-r font-semibold text-[14px] bg-inherit align-middle whitespace-nowrap ${isDark ? "text-[#A1A1AA] border-[#27272A]" : "text-slate-700 border-[#E3ECFC]"}`}>
                        {mod.name}
                      </td>
                      {roles.map(role => (
                        <td key={role.name} className={`border-r last:border-r-0 align-top ${isDark ? "border-[#27272A]" : "border-[#E3ECFC]"}`}>
                          <PermCell module={mod.name} role={role.name} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Summary */}
          {tab === "summary" && (
            <div className="flex-1 overflow-auto px-6 py-5 space-y-5">
              <div className="grid grid-cols-3 gap-4">
                {roles.map((role, ri) => (
                  <div key={role.name} className={`rounded-2xl border shadow-sm overflow-hidden ${isDark ? "bg-[#1C1C1E] border-[#27272A]" : "bg-white border-[#E3ECFC]"}`}>
                    <div className={`px-4 py-3 border-b ${isDark ? "border-[#27272A]" : "border-[#EFF6FF]"}`}>
                      <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold text-white" style={{ backgroundColor: roleColor(ri) }}>
                        {role.name}
                      </span>
                    </div>
                    <div className={`divide-y ${isDark ? "divide-[#27272A]" : "divide-[#F8FAFF]"}`}>
                      {modules.map(mod => {
                        const state = buildRoleState(mod.name, role.name);
                        const activePerms = (Object.entries(state) as [PermKey, boolean][]).filter(([, v]) => v).map(([k]) => k);
                        const hasAny = activePerms.length > 0;
                        return (
                          <div key={mod.name} className={`flex items-center justify-between px-4 py-2 transition-colors ${isDark ? "hover:bg-[#27272A]" : "hover:bg-[#fafcff]"}`}>
                            <span className={`text-[14px] font-medium ${isDark ? "text-[#A1A1AA]" : "text-slate-600"}`}>{mod.name}</span>
                            {hasAny ? (
                              <div className="flex items-center gap-0.5">
                                {activePerms.map(perm => {
                                  const meta = PERM_META[perm];
                                  const Icon = meta.icon;
                                  return (
                                    <Tooltip key={perm} title={meta.label}>
                                      <span className="flex items-center justify-center w-5 h-5">
                                        <Icon size={12} color={meta.color} weight={heavyWeight(perm)} />
                                      </span>
                                    </Tooltip>
                                  );
                                })}
                              </div>
                            ) : (
                              <Lock size={12} color={isDark ? "#3F3F46" : "#E2E8F0"} weight="duotone" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className={`rounded-2xl border px-5 py-4 ${isDark ? "bg-[#1C1C1E] border-[#27272A]" : "bg-white border-[#E3ECFC]"}`}>
                <div className={`text-[11px] font-bold uppercase tracking-wider mb-3 ${isDark ? "text-[#9CA3AF]" : "text-slate-500"}`}>Permission Legend</div>
                <div className="grid grid-cols-4 gap-x-8 gap-y-2">
                  {(Object.entries(PERM_META) as [PermKey, typeof PERM_META[PermKey]][]).map(([key, meta]) => {
                    const Icon = meta.icon;
                    return (
                      <div key={key} className="flex items-center gap-2">
                        <Icon size={13} color={meta.color} weight={heavyWeight(key)} />
                        <span className={`text-[12px] ${isDark ? "text-[#A1A1AA]" : "text-slate-600"}`}>{meta.label}</span>
                      </div>
                    );
                  })}
                  <div className="flex items-center gap-2">
                    <Lock size={13} color={isDark ? "#3F3F46" : "#E2E8F0"} weight="duotone" />
                    <span className={`text-[12px] ${isDark ? "text-[#A1A1AA]" : "text-slate-600"}`}>Data Sharing (Private)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Matrix legend */}
          {tab === "matrix" && (
            <div className={`mx-6 mb-5 rounded-2xl border px-5 py-3 ${isDark ? "bg-[#1C1C1E] border-[#27272A]" : "bg-white border-[#E3ECFC]"}`}>
              <div className={`text-[11px] font-bold uppercase tracking-wider mb-2 ${isDark ? "text-[#9CA3AF]" : "text-slate-500"}`}>Permission Legend</div>
              <div className="grid grid-cols-4 gap-x-6 gap-y-1.5">
                {(Object.entries(PERM_META) as [PermKey, typeof PERM_META[PermKey]][]).map(([key, meta]) => {
                  const Icon = meta.icon;
                  return (
                    <div key={key} className="flex items-center gap-1.5">
                      <Icon size={12} color={meta.color} weight={heavyWeight(key)} />
                      <span className={`text-[11.5px] ${isDark ? "text-[#71717A]" : "text-slate-600"}`}>{meta.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PermissionMatrix;
