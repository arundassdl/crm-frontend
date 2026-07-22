"use client";
import { readAccessTokenDataParsed } from '@/utils/accessTokenDataStorage'

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  InputBase,
  CircularProgress,
  Menu,
  MenuItem,
  Tooltip,
  ListItemIcon,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  MagnifyingGlass,
  Gear,
  DotsThreeVertical,
  Info,
  User,
  Rows,
  PencilSimple,
  ListBullets,
  ArrowsLeftRight,
  ShieldCheck,
  X,
} from "@phosphor-icons/react";
import FolderIcon from "@mui/icons-material/Folder";
import { getMuiIconByName } from "@/utils/muiIconByName";
import axios from "axios";
import { usePathname, useRouter } from "next/navigation";
import Link from "@/components/Link";
import { CONSTANTS } from "@/services/config/app-config";
import { updateResource } from "@/services/api/common-erpnext-api/create-edit-api";
import { get_array_from_roledoctype } from "@/services/api/roles/roles-api";
import { showToast } from "@/components/ToastNotificationNew";
import LayoutPermissionDialog from "@/components/layout-builder/LayoutPermissionDialog";
import { moduleSettingsDetailPath } from "@/app/settings/utils/moduleSettingsRoutes";
import { normalizeModuleListingRows } from "@/utils/normalizeModuleListingRows";

const DOCTYPE = "SDL Module Map";

/** Icon-chip accent colours, cycled per row (mirrors the reference MODULE_DEFS palette). */
const ICON_PALETTE = ["#3B82F6", "#F59E0B", "#10B981", "#8B5CF6", "#06B6D4"];

/** Map menu_icon string from API to a MUI icon component, using the same pattern as VerticalMenu. */
function getMenuIconComponent(iconName?: string) {
  return getMuiIconByName(iconName, FolderIcon);
}

/** Get field value from row (supports both "field" and "SDL Module Map.field" keys) */
function getRowVal(row: any, field: string): any {
  if (!row) return undefined;
  return row[field] ?? row[`${DOCTYPE}.${field}`];
}

function isLeadsModuleRow(row: any): boolean {
  const label = String(
    getRowVal(row, "frontend_module") ?? getRowVal(row, "name") ?? ""
  )
    .trim()
    .toLowerCase();
  return label === "lead" || label === "leads";
}

function StatusSwitchCell({
  row,
  token,
  onSuccess,
}: {
  row: any;
  token: string;
  onSuccess: () => void;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const rawStatus = getRowVal(row, "status");
  const checked = rawStatus === 1 || rawStatus === "1" || rawStatus === true;
  const isDependsOn =
    getRowVal(row, "depends_on") === 1 ||
    getRowVal(row, "depends_on") === "1" ||
    getRowVal(row, "depends_on") === true;
  const [loading, setLoading] = useState(false);
  const [localChecked, setLocalChecked] = useState(checked);
  useEffect(() => {
    setLocalChecked(checked);
  }, [checked]);

  const handleChange = useCallback(
    async (newChecked: boolean) => {
      const name = getRowVal(row, "name");
      if (!name || !token) return;
      setLoading(true);
      setLocalChecked(newChecked);
      try {
        const result = await updateResource(
          DOCTYPE,
          name,
          { status: newChecked ? 1 : 0 },
          token
        );
        if (result?.success) {
          showToast("Status updated successfully", "success");
          onSuccess();
          try {
            await get_array_from_roledoctype();
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("menuListData-refreshed"));
            }
          } catch (e) {
            console.error("Failed to refresh menu data", e);
          }
        } else {
          setLocalChecked(checked);
          showToast(result?.message || "Failed to update status", "error");
        }
      } catch {
        setLocalChecked(checked);
        showToast("Failed to update status", "error");
      } finally {
        setLoading(false);
      }
    },
    [row, token, checked, onSuccess]
  );

  const disabled = loading || isDependsOn;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => handleChange(!localChecked)}
      aria-label="Toggle module status"
      className={`relative inline-flex w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0 ${
        localChecked ? "bg-[#10B981]" : isDark ? "bg-[#3F3F46]" : "bg-slate-200"
      } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`inline-block w-[14px] h-[14px] rounded-full bg-white shadow transform transition-transform duration-200 absolute top-[3px] ${
          localChecked ? "translate-x-[19px]" : "translate-x-[3px]"
        }`}
      />
    </button>
  );
}

type ModuleListingProps = {
  /** Settings `/settings?tab=customization&subtab=modules`: match Users tab padding and toolbar stripe */
  embedInSettings?: boolean;
};

const ModuleListing = ({ embedInSettings = false }: ModuleListingProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [userToken] = useState<any>(() => {
    const initial = readAccessTokenDataParsed();
    return initial || "";
  });

  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [customSelected, setCustomSelected] = useState(true);
  const [teamSelected, setTeamSelected] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameRow, setRenameRow] = useState<any>(null);
  const [renamePlural, setRenamePlural] = useState("");
  const [renameSingular, setRenameSingular] = useState("");
  const [renameSubmitting, setRenameSubmitting] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [menuRow, setMenuRow] = useState<any>(null);
  const [permissionOpen, setPermissionOpen] = useState(false);
  const [permissionModuleName, setPermissionModuleName] = useState("");
  const [permissionSharedTo, setPermissionSharedTo] = useState<string[]>([]);

  // Load all module rows once (no pagination) using get_modulelisting API
  useEffect(() => {
    const token = userToken?.access_token;
    if (!token) return;

    const load = async () => {
      setLoading(true);
      try {
        const method =
          "/api/method/sdl_metadata.api.modules.get_modulelisting";
        const url = `${CONSTANTS.API_BASE_URL}${method}`;
        const config = {
          headers: {
            Authorization: token,
          },
          timeout: 5000,
        };
        const res = await axios.get(url, config);
        const message = res?.data?.message ?? [];
        setRows(normalizeModuleListingRows(message));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [userToken?.access_token, refreshKey]);

  const handleCreateNew = () => {
    const base =
      pathname === "/settings" ? "/setup/customization/modules" : pathname;
    router.push(`${base}/add`);
  };

  const handleRenameClick = useCallback((row: any) => {
    const current = getRowVal(row, "frontend_module");
    const existingSingular = getRowVal(row, "singular_module");
    setRenameRow(row);
    setRenamePlural(current ?? "");
    setRenameSingular(
      typeof existingSingular === "string" ? existingSingular : ""
    );
    setRenameOpen(true);
  }, []);

  const handleRenameClose = useCallback(() => {
    setRenameOpen(false);
    setRenameRow(null);
    setRenamePlural("");
    setRenameSingular("");
  }, []);

  const handleRenameSubmit = useCallback(async () => {
    if (!renameRow || !userToken?.access_token) return;
    const name = getRowVal(renameRow, "name");
    if (!name) return;

    const plural = renamePlural.trim();
    const singular = renameSingular.trim();
    if (!plural || !singular) {
      showToast("Plural Name and Singular Name are required", "warning");
      return;
    }

    setRenameSubmitting(true);
    try {
      const result = await updateResource(
        DOCTYPE,
        name,
        { frontend_module: plural, singular_module_name: singular },
        userToken.access_token
      );
      if (result?.success) {
        showToast("Frontend module updated successfully", "success");
        setRefreshKey((k) => k + 1);
        handleRenameClose();
        try {
          await get_array_from_roledoctype();
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("menuListData-refreshed"));
          }
        } catch (e) {
          console.error("Failed to refresh menu data", e);
        }
      } else {
        showToast(result?.message || "Failed to update", "error");
      }
    } catch {
      showToast("Failed to update frontend module", "error");
    } finally {
      setRenameSubmitting(false);
    }
  }, [renameRow, renamePlural, renameSingular, userToken?.access_token, handleRenameClose]);

  const handleMoreClick = (
    event: React.MouseEvent<HTMLElement>,
    row: any
  ) => {
    setMenuAnchorEl(event.currentTarget);
    setMenuRow(row);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setMenuRow(null);
  };

  const handleMenuLayout = () => {
    if (menuRow?.name) {
      if (embedInSettings) {
        router.push(
          moduleSettingsDetailPath({
            moduleName: menuRow.name,
            moduleTab: "layouts",
          })
        );
      } else {
        router.push(
          `/setup/customization/modules/${encodeURIComponent(
            menuRow.name
          )}?tab=layouts`
        );
      }
    }
    handleMenuClose();
  };

  const handleMenuFields = () => {
    if (menuRow?.name) {
      if (embedInSettings) {
        router.push(
          moduleSettingsDetailPath({
            moduleName: menuRow.name,
            moduleTab: "fields",
          })
        );
      } else {
        router.push(
          `/setup/customization/modules/${encodeURIComponent(
            menuRow.name
          )}?tab=fields`
        );
      }
    }
    handleMenuClose();
  };

  const handleMenuLeadConversionMapping = () => {
    if (menuRow?.name) {
      if (embedInSettings) {
        router.push(
          moduleSettingsDetailPath({
            moduleName: menuRow.name,
            moduleTab: "layouts",
            leadConversion: true,
            leadConversionPicker: true,
          })
        );
      } else {
        router.push(
          `/setup/customization/modules/${encodeURIComponent(
            menuRow.name
          )}?tab=layouts&leadConversion=1&leadConversionPicker=1`
        );
      }
    }
    handleMenuClose();
  };

  const handleMenuRename = () => {
    if (menuRow) {
      handleRenameClick(menuRow);
    }
    handleMenuClose();
  };

  const handleMenuModulePermission = () => {
    if (menuRow?.name) {
      const moduleName = getRowVal(menuRow, "name") ?? "";
      const rawRoles = (getRowVal(menuRow, "role_names") || "") as string;
      const initial = rawRoles
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean);
      setPermissionModuleName(moduleName);
      setPermissionSharedTo(initial);
      setPermissionOpen(true);
    }
    handleMenuClose();
  };

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    let data = rows;

    if (term) {
      data = data.filter((row: any) => {
        const displayName = (row.frontend_module || "").toLowerCase();
        const moduleName = (row.name || "").toLowerCase();
        return (
          displayName.includes(term) ||
          moduleName.includes(term)
        );
      });
    }

    // Module type filters can be wired here if backend exposes such fields.
    // Currently they only affect UI state.
    return data;
  }, [rows, search, customSelected, teamSelected]);

  const handlePermissionClose = () => {
    setPermissionOpen(false);
    setPermissionModuleName("");
    setPermissionSharedTo([]);
  };

  const handlePermissionSave = async (sharedTo: string[]) => {
    if (!userToken?.access_token || !permissionModuleName) return;
    try {
      const url = `${CONSTANTS.API_BASE_URL}/api/method/sdl_user_management.sdk.api`;
      const payload = {
        version: "v1",
        entity: "roles",
        method: "update_module_permission",
        app_code: "CRM",
        module: permissionModuleName,
        shared_to: sharedTo.reduce<Record<string, number>>((acc, roleId) => {
          acc[roleId] = 1;
          return acc;
        }, {}),
      };
      const config = {
        headers: {
          Authorization: userToken.access_token,
        },
        timeout: 5000,
      };
      await axios.post(url, payload, config);
      showToast("Module permission updated", "success");
      setRefreshKey((k) => k + 1);
      handlePermissionClose();
    } catch (e) {
      console.error("Failed to update module permission", e);
      showToast("Failed to update module permission", "error");
      throw e;
    }
  };

  const headTh = `px-6 py-3 text-[12.5px] font-bold uppercase tracking-wider ${
    isDark ? "text-[#71717A]" : "text-slate-500"
  }`;

  return (
    <div className={`flex h-full min-h-0 flex-col overflow-hidden ${isDark ? "bg-[#0A0A0A]" : "bg-white"}`}>
      {/* Toolbar */}
      <div className={`flex items-center gap-3 px-6 py-4 border-b ${isDark ? "border-[#27272A]" : "border-[#E3ECFC]"}`}>
        <div className={`flex items-center gap-1.5 border rounded-xl px-3 py-1.5 w-56 focus-within:border-[#1D4ED8] focus-within:shadow-[0_0_0_2px_#4A7AE8] transition-all ${isDark ? "bg-[#18181B] border-[#3F3F46]" : "bg-[#f9fbff] border-[#E3ECFC]"}`}>
          <MagnifyingGlass size={13} color="#94A3B8" weight="duotone" />
          <InputBase
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: 1, fontSize: "0.75rem", color: isDark ? "#D4D4D8" : "#334155", "& input::placeholder": { color: "#94A3B8", opacity: 1 } }}
          />
        </div>
        <button
          type="button"
          onClick={() => setCustomSelected((prev) => !prev)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-[14px] font-semibold rounded-xl hover:border-[#1D4ED8] transition-colors ${isDark ? "text-[#D4D4D8] bg-[#18181B] border border-[#3F3F46]" : "text-slate-600 bg-[#f9fbff] border border-[#E3ECFC]"}`}
        >
          <Gear size={13} weight="duotone" />
          Custom Module
        </button>
        <div className="flex-1" />
        <Button
          variant="contained"
          size="small"
          onClick={handleCreateNew}
          sx={{ bgcolor: isDark ? "#27272A" : "#1D4ED8", color: isDark ? "#F4F4F5" : "white", borderRadius: "9px", textTransform: "none", fontWeight: 700, fontSize: "0.75rem", px: 2, py: 0.8, boxShadow: isDark ? "none" : "0 1px 6px #1D4ED833", whiteSpace: "nowrap", "&:hover": { bgcolor: isDark ? "#3F3F46" : "#2563EB" } }}
        >
          Create New Module
        </Button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className={isDark ? "bg-[#111113] border-b border-[#27272A]" : "bg-[#f9fbff] border-b border-[#E3ECFC]"}>
              <th className={headTh}>Displayed In Tabs As</th>
              <th className={headTh}>Module Name</th>
              <th className={headTh}>Shared To</th>
              <th className={headTh}>Last Modified</th>
              <th className={`${headTh} text-center`}>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center">
                  <CircularProgress size={24} />
                </td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan={5} className={`px-6 py-10 text-center text-[14px] ${isDark ? "text-[#71717A]" : "text-slate-400"}`}>
                  No records found.
                </td>
              </tr>
            ) : (
              filteredRows.map((row: any, idx: number) => {
                const modified = row.modified;
                const dateStr = modified
                  ? new Date(modified).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "—";
                const color = ICON_PALETTE[idx % ICON_PALETTE.length];
                const DisplayIcon = getMenuIconComponent(getRowVal(row, "menu_icon"));
                const sharedTo =
                  row.role_count != null &&
                  row.total_roles != null &&
                  row.role_count === row.total_roles
                    ? "All Roles"
                    : row.role_names ?? "—";

                return (
                  <tr
                    key={row.name}
                    className={`border-b transition-colors ${isDark ? "border-[#18181B] hover:bg-[#111113]" : "border-[#EFF6FF] hover:bg-[#fafcff]"}`}
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={
                          embedInSettings
                            ? moduleSettingsDetailPath({ moduleName: row.name })
                            : `/setup/customization/modules/${row.name}`
                        }
                        rel="noopener noreferrer"
                        style={{ textDecoration: "none" }}
                      >
                        <span className={`inline-flex items-center gap-2 text-[15px] font-semibold hover:underline ${isDark ? "text-[#60A5FA]" : "text-[#1D4ED8]"}`}>
                          <span className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "18" }}>
                            <DisplayIcon sx={{ fontSize: 13, color }} />
                          </span>
                          {row.frontend_module ?? row.name}
                        </span>
                      </Link>
                    </td>
                    <td className={`px-6 py-4 text-[15px] ${isDark ? "text-[#D4D4D8]" : "text-slate-600"}`}>
                      {row.name}
                    </td>
                    <td className={`px-6 py-4 text-[13px] ${isDark ? "text-[#71717A]" : "text-slate-500"}`}>
                      {sharedTo}
                    </td>
                    <td className="px-6 py-4">
                      <div className={`flex items-center gap-1.5 text-[13px] ${isDark ? "text-[#71717A]" : "text-slate-500"}`}>
                        <User size={12} weight="duotone" />
                        {dateStr}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Tooltip title="More actions">
                          <IconButton
                            size="small"
                            onClick={(e) => handleMoreClick(e, row)}
                            sx={{ p: 0.3, color: isDark ? "#9CA3AF" : "#94A3B8", "&:hover": { color: "#1D4ED8", bgcolor: isDark ? "#27272A" : "#EFF6FF" }, borderRadius: "6px" }}
                          >
                            <DotsThreeVertical size={15} weight="bold" />
                          </IconButton>
                        </Tooltip>
                        <StatusSwitchCell
                          row={row}
                          token={userToken?.access_token}
                          onSuccess={() => setRefreshKey((k) => k + 1)}
                        />
                        <Tooltip title="View dependencies">
                          <IconButton
                            size="small"
                            sx={{ p: 0.3, color: isDark ? "#9CA3AF" : "#94A3B8", "&:hover": { color: "#1D4ED8", bgcolor: isDark ? "#27272A" : "#EFF6FF" }, borderRadius: "6px" }}
                          >
                            <Info size={13} weight="duotone" />
                          </IconButton>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Row actions menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        PaperProps={{
          elevation: 4,
          sx: {
            mt: 0.5,
            borderRadius: "12px",
            minWidth: 210,
            border: isDark ? "1px solid #27272A" : "1px solid #E3ECFC",
            bgcolor: isDark ? "#1C1C1E" : "#fff",
            boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.5)" : "0 8px 32px rgba(12,36,114,0.10)",
            "& .MuiMenuItem-root": {
              fontSize: "14px",
              py: 1.2,
              px: 2.5,
              gap: 1.25,
              color: isDark ? "#D4D4D8" : "#334155",
              "&:hover": { bgcolor: isDark ? "#27272A" : "#EFF6FF", color: isDark ? "#F4F4F5" : "#1D4ED8" },
            },
            "& .MuiListItemIcon-root": { minWidth: 0, color: "inherit" },
          },
        }}
      >
        <MenuItem onClick={handleMenuLayout}>
          <ListItemIcon><Rows size={15} weight="duotone" /></ListItemIcon>
          Layout
        </MenuItem>
        <MenuItem onClick={handleMenuRename}>
          <ListItemIcon><PencilSimple size={15} weight="duotone" /></ListItemIcon>
          Rename
        </MenuItem>
        <MenuItem onClick={handleMenuFields}>
          <ListItemIcon><ListBullets size={15} weight="duotone" /></ListItemIcon>
          Fields
        </MenuItem>
        {menuRow && isLeadsModuleRow(menuRow) && (
          <MenuItem onClick={handleMenuLeadConversionMapping}>
            <ListItemIcon><ArrowsLeftRight size={15} weight="duotone" /></ListItemIcon>
            Lead Conversion Mapping
          </MenuItem>
        )}
        <MenuItem onClick={handleMenuModulePermission}>
          <ListItemIcon><ShieldCheck size={15} weight="duotone" /></ListItemIcon>
          Module Permission
        </MenuItem>
      </Menu>

      <LayoutPermissionDialog
        open={permissionOpen}
        onClose={handlePermissionClose}
        layoutName={permissionModuleName}
        initialSharedTo={permissionSharedTo}
        onSave={handlePermissionSave}
        title="Module Permission"
      />

      {/* Rename dialog */}
      <Dialog
        open={renameOpen}
        onClose={handleRenameClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px", bgcolor: isDark ? "#1C1C1E" : "#fff" } }}
      >
        <div className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? "border-[#27272A]" : "border-[#E3ECFC]"}`}>
          <span className={`text-[15px] font-bold ${isDark ? "text-[#F4F4F5]" : "text-slate-900"}`}>Module Name</span>
          <IconButton size="small" onClick={handleRenameClose}>
            <X size={16} color={isDark ? "#71717A" : "#64748B"} weight="duotone" />
          </IconButton>
        </div>
        <DialogContent sx={{ p: 3 }}>
          <TextField
            fullWidth
            required
            label="Plural Name"
            value={renamePlural}
            onChange={(e) => setRenamePlural(e.target.value)}
            variant="outlined"
            margin="normal"
            autoFocus
          />
          <TextField
            fullWidth
            required
            label="Singular Name"
            value={renameSingular}
            onChange={(e) => setRenameSingular(e.target.value)}
            variant="outlined"
            margin="normal"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={handleRenameClose}
            variant="outlined"
            sx={{ color: isDark ? "#D4D4D8" : "#4A5675", borderColor: isDark ? "#3F3F46" : "#E3ECFC", textTransform: "none", fontWeight: 600, borderRadius: "9px" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleRenameSubmit}
            disabled={
              renameSubmitting ||
              !renamePlural.trim() ||
              !renameSingular.trim()
            }
            sx={{ bgcolor: "#1D4ED8", color: "white", textTransform: "none", fontWeight: 600, borderRadius: "9px", "&:hover": { bgcolor: "#2563EB" } }}
          >
            {renameSubmitting ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ModuleListing;
