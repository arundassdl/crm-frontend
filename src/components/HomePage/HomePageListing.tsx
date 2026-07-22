"use client";

import { readAccessTokenDataParsed, readAccessTokenString } from "@/utils/accessTokenDataStorage";

import { useCallback, useEffect, useState } from "react";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  Tooltip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { House, DotsThreeVertical, Plus } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";

import { showToast } from "@/components/ToastNotificationNew";
import LayoutPermissionDialog from "@/components/layout-builder/LayoutPermissionDialog";
import {
  dashboardCreatePath,
  dashboardEditPath,
} from "@/app/settings/utils/moduleSettingsRoutes";
import { fetchRawDataGridListing } from "@/services/api/common-erpnext-api/listing-api-get";
import { updateResource } from "@/services/api/common-erpnext-api/create-edit-api";
import { saveDashboardLayout } from "@/modules/dashboard-builder/api/dashboardApi";

const DOCTYPE = "Insights Dashboard";

/** Soft-pastel card fills, cycled per card (mirrors the reference HOMEPAGE_CARD_PALETTE). */
const CARD_PALETTE = ["#D6E4F9", "#D0E5E0", "#FAE3D0", "#F5D9E1", "#E2E4EA"];

function getRowVal(row: any, field: string): any {
  if (!row) return undefined;
  return row[field] ?? row[`${DOCTYPE}.${field}`];
}

function formatDate(value: unknown): string {
  if (value == null || value === "") return "—";
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function displayName(row: any): string {
  return (
    getRowVal(row, "dashboard_name") ??
    getRowVal(row, "title") ??
    getRowVal(row, "name") ??
    "—"
  );
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
  const checked =
    rawStatus === 1 ||
    rawStatus === "1" ||
    rawStatus === true ||
    rawStatus === "Active";
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

  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => handleChange(!localChecked)}
      aria-label="Toggle dashboard status"
      className={`relative inline-flex w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0 ${
        localChecked ? "bg-[#10B981]" : isDark ? "bg-[#3F3F46]" : "bg-slate-200"
      } ${loading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`inline-block w-[14px] h-[14px] rounded-full bg-white shadow transform transition-transform duration-200 absolute top-[3px] ${
          localChecked ? "translate-x-[19px]" : "translate-x-[3px]"
        }`}
      />
    </button>
  );
}

type HomePageListingProps = {
  /** Settings `/settings?tab=customization&subtab=home-page` */
  embedInSettings?: boolean;
};

const COL_FIELDS = [
  { doctype: DOCTYPE, field: "name", hidden: "True" },
  { doctype: DOCTYPE, field: "title", headerName: "Name", hidden: "False" },
  { doctype: DOCTYPE, field: "description", headerName: "Description", hidden: "False" },
  { doctype: DOCTYPE, field: "shared_to_text", headerName: "Shared With", hidden: "False" },
  { doctype: DOCTYPE, field: "creation", headerName: "Created", hidden: "False" },
  { doctype: DOCTYPE, field: "modified", headerName: "Last Modified", hidden: "False" },
  { doctype: DOCTYPE, field: "status", headerName: "Status", hidden: "False" },
];

export default function HomePageListing({ embedInSettings = false }: HomePageListingProps) {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [userToken] = useState<any>(() => readAccessTokenDataParsed() || "");
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const token = userToken?.access_token;
    if (!token) return;

    const load = async () => {
      setLoading(true);
      try {
        const result = await fetchRawDataGridListing(
          {
            page: 0,
            pageSize: 1000,
            filters: { items: [], quickFilterValues: [] },
            sort: [],
          },
          token,
          COL_FIELDS,
          DOCTYPE,
          [],
          "False",
          "",
          [],
          "",
          "",
          userToken?.role_profile ?? "",
          userToken?.username ?? "",
          `${DOCTYPE}.modified desc`
        );
        setRows(result?.data ?? []);
      } catch (e) {
        console.error("Failed to load home pages", e);
        showToast("Failed to load home pages", "error");
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [userToken?.access_token, userToken?.role_profile, userToken?.username, refreshKey]);

  // --- More Actions menu state ---
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuRow, setMenuRow] = useState<any>(null);

  // --- Rename dialog state ---
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameRow, setRenameRow] = useState<any>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameSubmitting, setRenameSubmitting] = useState(false);

  // --- Permission dialog state ---
  const [permissionOpen, setPermissionOpen] = useState(false);
  const [permissionRow, setPermissionRow] = useState<any>(null);
  const [permissionSharedTo, setPermissionSharedTo] = useState<string[]>([]);

  const handleCreate = () => {
    router.push(dashboardCreatePath());
  };

  // --- Menu handlers ---
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, row: any) => {
    setMenuAnchor(event.currentTarget);
    setMenuRow(row);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuRow(null);
  };

  const handleMenuEdit = () => {
    const docName = getRowVal(menuRow, "name");
    if (docName) router.push(dashboardEditPath(String(docName)));
    handleMenuClose();
  };

  const handleMenuRename = () => {
    const currentTitle = displayName(menuRow);
    setRenameRow(menuRow);
    setRenameValue(currentTitle === "—" ? "" : currentTitle);
    setRenameOpen(true);
    handleMenuClose();
  };

  const handleMenuClone = () => {
    const docName = getRowVal(menuRow, "name");
    if (docName) router.push(dashboardCreatePath(String(docName)));
    handleMenuClose();
  };

  const handleMenuPermission = useCallback(async () => {
    const row = menuRow;
    const docName = getRowVal(row, "name");
    if (!docName) {
      handleMenuClose();
      return;
    }
    try {
      const token = readAccessTokenString();
      const res = await fetch(`/api/dashboard/${encodeURIComponent(docName)}`, {
        credentials: "same-origin",
        headers: token ? { Authorization: token } : undefined,
      });
      if (!res.ok) {
        showToast("Failed to load dashboard permissions", "error");
        handleMenuClose();
        return;
      }
      const data = await res.json();
      const sharedTo = Array.isArray(data.shared_to) ? data.shared_to : [];
      setPermissionRow(row);
      setPermissionSharedTo(sharedTo);
      setPermissionOpen(true);
    } catch {
      showToast("Failed to load dashboard permissions", "error");
    }
    handleMenuClose();
  }, [menuRow]);

  // --- Rename handlers ---
  const handleRenameClose = useCallback(() => {
    setRenameOpen(false);
    setRenameRow(null);
    setRenameValue("");
  }, []);

  const handleRenameSubmit = useCallback(async () => {
    if (!renameRow || !userToken?.access_token) return;
    const docName = getRowVal(renameRow, "name");
    if (!docName) return;
    const newValue = renameValue.trim();
    if (!newValue) {
      showToast("Dashboard name is required", "warning");
      return;
    }
    setRenameSubmitting(true);
    try {
      const result = await updateResource(
        DOCTYPE,
        docName,
        { title: newValue },
        userToken.access_token
      );
      if ((result as any)?.success) {
        showToast("Dashboard renamed successfully", "success");
        setRefreshKey((k) => k + 1);
        handleRenameClose();
      } else {
        showToast((result as any)?.message || "Failed to rename dashboard", "error");
      }
    } catch {
      showToast("Failed to rename dashboard", "error");
    } finally {
      setRenameSubmitting(false);
    }
  }, [renameRow, renameValue, userToken?.access_token, handleRenameClose]);

  // --- Permission handlers ---
  const handlePermissionClose = useCallback(() => {
    setPermissionOpen(false);
    setPermissionRow(null);
    setPermissionSharedTo([]);
  }, []);

  const handlePermissionSave = useCallback(
    async (sharedToIds: string[]) => {
      const docName = getRowVal(permissionRow, "name");
      if (!docName) return;
      const token = readAccessTokenString();
      try {
        const res = await fetch(`/api/dashboard/${encodeURIComponent(docName)}`, {
          credentials: "same-origin",
          headers: token ? { Authorization: token } : undefined,
        });
        if (!res.ok) {
          showToast("Failed to load dashboard for permission update", "error");
          return;
        }
        const dashboardData = await res.json();
        await saveDashboardLayout(
          {
            dashboardId: docName,
            title: dashboardData.title ?? "",
            description: dashboardData.description ?? "",
            layouts: dashboardData.layouts ?? { lg: [] },
            widgets: dashboardData.widgets,
            shared_to: sharedToIds,
          },
          { token: token || undefined }
        );
        showToast("Dashboard permissions updated", "success");
        setRefreshKey((k) => k + 1);
        handlePermissionClose();
      } catch {
        showToast("Failed to update dashboard permissions", "error");
      }
    },
    [permissionRow, handlePermissionClose]
  );

  return (
    <div className={`flex h-full min-h-0 flex-col overflow-hidden ${isDark ? "bg-[#0A0A0A]" : "bg-white"}`}>
      {/* Header */}
      <div className={`px-4 sm:px-8 py-5 border-b flex items-start justify-between gap-4 sm:gap-6 flex-wrap ${isDark ? "border-[#27272A]" : "border-[#E3ECFC]"}`}>
        <div className="min-w-0">
          <div className={`text-[18px] sm:text-[20px] font-bold tracking-tight ${isDark ? "text-[#F4F4F5]" : "text-slate-900"}`}>
            Dashboard Customization
          </div>
          <div className={`text-[13px] mt-1 max-w-lg leading-relaxed ${isDark ? "text-[#9CA3AF]" : "text-slate-500"}`}>
            You can create custom dashboards, making it easier for employees to complete their daily task efficiently.
          </div>
        </div>
        <Button
          variant="contained"
          onClick={handleCreate}
          sx={{ bgcolor: "#1D4ED8", color: "white", borderRadius: "9px", textTransform: "none", fontWeight: 600, fontSize: "14px", px: 2.5, py: 1, boxShadow: "0 1px 8px #1D4ED833", "&:hover": { bgcolor: "#2563EB" }, "&:active": { bgcolor: "#0C2472" }, whiteSpace: "nowrap", flexShrink: 0 }}
        >
          Create Dashboard
        </Button>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-auto p-4 sm:p-8">
        {loading ? (
          <div className="flex justify-center py-16">
            <CircularProgress size={28} />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {rows.map((row: any, i: number) => {
              const docName = getRowVal(row, "name");
              const nameLabel = displayName(row);
              const description = getRowVal(row, "description");
              const createdDate = formatDate(getRowVal(row, "creation"));
              const modifiedDate = formatDate(getRowVal(row, "modified"));
              const fill = CARD_PALETTE[i % CARD_PALETTE.length];

              return (
                <div
                  key={docName ?? nameLabel ?? i}
                  className="rounded-2xl p-6 relative overflow-hidden border hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                  style={{
                    backgroundColor: isDark ? "#18181B" : fill,
                    borderColor: isDark ? "#27272A" : "rgba(255,255,255,0.5)",
                    boxShadow: "0 6px 24px rgba(15,23,42,0.06)",
                  }}
                  onClick={() => docName && router.push(dashboardEditPath(String(docName)))}
                >
                  {/* Header: icon + status + menu */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? "bg-black/30 text-[#A1A1AA]" : "bg-[#f9fbff]/70 text-[#0C2472]"}`}>
                      <House size={18} weight="duotone" />
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <StatusSwitchCell
                        row={row}
                        token={userToken?.access_token}
                        onSuccess={() => setRefreshKey((k) => k + 1)}
                      />
                      <Tooltip title="Options">
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, row)}
                          sx={{ p: 0.4, color: isDark ? "#71717A" : "#4A5675", "&:hover": { color: isDark ? "#D4D4D8" : "#0C2472", bgcolor: isDark ? "#27272A" : "rgba(255,255,255,0.5)" }, borderRadius: "6px" }}
                        >
                          <DotsThreeVertical size={15} weight="bold" />
                        </IconButton>
                      </Tooltip>
                    </div>
                  </div>

                  {/* Name */}
                  <p className={`text-[16px] font-extrabold tracking-tight leading-none mb-2 truncate ${isDark ? "text-[#FFFFFF]" : "text-[#0C2472]"}`}>
                    {nameLabel}
                  </p>

                  {/* Description */}
                  <p className={`text-[12.5px] leading-relaxed mb-4 line-clamp-2 ${description ? (isDark ? "text-[#D4D4D8]" : "text-[#4A5675]") : (isDark ? "text-[#52525B]" : "text-slate-400")}`}>
                    {description || "No description"}
                  </p>

                  {/* Footer: created / modified */}
                  <div className={`flex items-center justify-between text-[11px] font-semibold pt-3 border-t ${isDark ? "border-white/10 text-[#71717A]" : "border-black/5 text-[#4A5675]"}`}>
                    <span>Created {createdDate}</span>
                    <span>Modified {modifiedDate}</span>
                  </div>
                </div>
              );
            })}

            {/* Add new dashboard tile */}
            <button
              type="button"
              onClick={handleCreate}
              className={`rounded-2xl p-6 border-2 border-dashed flex flex-col items-center justify-center gap-2 min-h-[220px] transition-all duration-200 hover:shadow-lg ${isDark ? "border-[#27272A] hover:border-[#3F3F46] hover:bg-[#111113] text-[#71717A]" : "border-[#E3ECFC] hover:border-[#93C5FD] hover:bg-[#f9fbff] text-[#4A5675]"}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? "bg-[#18181B]" : "bg-[#EFF6FF]"}`}>
                <Plus size={18} weight="bold" />
              </div>
              <span className="text-[13px] font-bold">Create Dashboard</span>
            </button>
          </div>
        )}
      </div>

      {/* Context menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: "left", vertical: "top" }}
        anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
        PaperProps={{
          elevation: 4,
          sx: {
            mt: 0.5,
            borderRadius: "12px",
            minWidth: 190,
            border: isDark ? "1px solid #27272A" : "1px solid #E3ECFC",
            bgcolor: isDark ? "#1C1C1E" : "#fff",
            boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.5)" : "0 8px 32px rgba(12,36,114,0.10)",
            "& .MuiMenuItem-root": {
              fontSize: "14px",
              py: 1.2,
              px: 2.5,
              color: isDark ? "#D4D4D8" : "#334155",
              "&:hover": { bgcolor: isDark ? "#27272A" : "#EFF6FF", color: isDark ? "#F4F4F5" : "#1D4ED8" },
            },
          },
        }}
      >
        <MenuItem onClick={handleMenuEdit}>Edit Dashboard</MenuItem>
        <MenuItem onClick={handleMenuRename}>Rename Dashboard</MenuItem>
        <MenuItem onClick={handleMenuClone}>Clone Dashboard</MenuItem>
        <MenuItem onClick={handleMenuPermission}>Dashboard Permission</MenuItem>
      </Menu>

      <Dialog
        open={renameOpen}
        onClose={handleRenameClose}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: "16px", bgcolor: isDark ? "#1C1C1E" : "#fff" } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Rename Dashboard</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Dashboard Name"
            fullWidth
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            error={!renameValue.trim()}
            helperText={!renameValue.trim() ? "Dashboard Name is required" : " "}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleRenameClose} color="inherit" disabled={renameSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleRenameSubmit}
            variant="contained"
            disabled={renameSubmitting}
            sx={{ bgcolor: "#1D4ED8", textTransform: "none", fontWeight: 600, borderRadius: "9px", "&:hover": { bgcolor: "#2563EB" } }}
          >
            Done
          </Button>
        </DialogActions>
      </Dialog>

      <LayoutPermissionDialog
        open={permissionOpen}
        onClose={handlePermissionClose}
        layoutName={displayName(permissionRow)}
        initialSharedTo={permissionSharedTo}
        onSave={handlePermissionSave}
        title="Dashboard Permission"
      />
    </div>
  );
}
