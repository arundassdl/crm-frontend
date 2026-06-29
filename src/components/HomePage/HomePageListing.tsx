"use client";

import { readAccessTokenDataParsed, readAccessTokenString } from "@/utils/accessTokenDataStorage";

import { useCallback, useEffect, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { useRouter } from "next/navigation";

import Link from "@/components/Link";
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

function formatSharedWith(row: any): string {
  const text = getRowVal(row, "shared_to_text");
  if (text != null && String(text).trim() !== "") return String(text);

  const users = getRowVal(row, "user_count");
  const roles = getRowVal(row, "role_count");
  const parts: string[] = [];
  if (users != null && users !== "") {
    const n = Number(users);
    if (!Number.isNaN(n) && n > 0) {
      parts.push(`${n} User${n === 1 ? "" : "s"}`);
    }
  }
  if (roles != null && roles !== "") {
    const n = Number(roles);
    if (!Number.isNaN(n) && n > 0) {
      parts.push(`${n} Role${n === 1 ? "" : "s"}`);
    }
  }
  return parts.length ? parts.join(" , ") : "—";
}

function displayName(row: any): string {
  return (
    getRowVal(row, "dashboard_name") ??
    getRowVal(row, "title") ??
    getRowVal(row, "name") ??
    "—"
  );
}

function ownerInitial(row: any): string {
  const owner = String(getRowVal(row, "owner") ?? "").trim();
  if (!owner) return "?";
  const local = owner.includes("@") ? owner.split("@")[0] : owner;
  return (local.charAt(0) || "?").toUpperCase();
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
    async (_: React.ChangeEvent<HTMLInputElement>, newChecked: boolean) => {
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
    <Switch
      checked={localChecked}
      disabled={loading}
      onChange={handleChange}
      size="small"
      color="success"
    />
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

  const headerSx = embedInSettings
    ? {
        pb: "1.224rem",
        borderBottom: "5px solid",
        borderColor: "divider",
      }
    : { pb: 2, mb: 2 };

  return (
    <Box
      sx={{
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        ...(embedInSettings
          ? {
              p: 0,
              px: { xs: 2, sm: 3, md: 4 },
              pb: 4,
              flex: 1,
              minHeight: 0,
              height: "100%",
            }
          : {
              p: 3,
              height: "100%",
            }),
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 2,
          pt: embedInSettings ? 0 : undefined,
          ...headerSx,
        }}
      >
        <Box sx={{ minWidth: 0, flex: "1 1 280px" }}>
          <Typography variant="h5" fontWeight={600} sx={{ color: "text.primary" }}>
            Customize Home page
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.75, maxWidth: 520, lineHeight: 1.5 }}
          >
            You can create custom homepages, making it easier for employees to complete their
            daily task efficiently.
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 1.5,
            flexShrink: 0,
          }}
        >
          <Box
            component="button"
            type="button"
            onClick={() => showToast("Help documentation coming soon", "default")}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              border: "none",
              bgcolor: "transparent",
              cursor: "pointer",
              p: 0,
              color: "text.secondary",
              typography: "body2",
              "&:hover": { color: "text.primary" },
            }}
          >
            <HelpOutlineIcon sx={{ fontSize: 18 }} />
            Help
          </Box>
          <Button variant="contained" onClick={handleCreate}>
            Create Home Page
          </Button>
        </Box>
      </Box>

      <TableContainer
        component={Paper}
        sx={{
          mt: embedInSettings ? 2 : 3,
          pt: 2,
          border: 1,
          borderColor: "divider",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          ...(embedInSettings && { minHeight: 0 }),
        }}
      >
        <Table
          sx={{
            minWidth: 900,
            "& thead th": {
              fontWeight: 600,
              py: 1,
              color: "text.secondary",
            },
            "& thead tr": {
              borderBottomWidth: 2,
              borderBottomStyle: "solid",
              borderBottomColor: "divider",
            },
          }}
          aria-label="home pages table"
        >
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Shared With</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Last Modified</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No records found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row: any) => {
                const docName = getRowVal(row, "name");
                const nameLabel = displayName(row);
                const createdDate = formatDate(getRowVal(row, "creation"));
                const modifiedDate = formatDate(getRowVal(row, "modified"));

                return (
                  <TableRow
                    key={docName ?? nameLabel}
                    hover
                    sx={{
                      "&:last-child td, &:last-child th": { border: 0 },
                      "&:hover .row-more-icon": { opacity: 1 },
                    }}
                  >
                    <TableCell>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <Link
                          href={
                            docName
                              ? dashboardEditPath(String(docName))
                              : dashboardCreatePath()
                          }
                          style={{
                            color: "var(--mui-palette-primary-main)",
                            fontWeight: 500,
                            textDecoration: "none",
                          }}
                        >
                          {nameLabel}
                        </Link>
                        <IconButton
                          size="small"
                          className="row-more-icon"
                          sx={{
                            p: 0,
                            ml: 2,
                            opacity: 0,
                            transition: "opacity 0.2s ease-in-out",
                            "&:hover": {
                              bgcolor: "action.hover",
                              "& svg": { color: "text.primary" },
                            },
                          }}
                          onClick={(e) => handleMenuOpen(e, row)}
                        >
                          <MoreHorizIcon
                            sx={{ fontSize: 22, color: "action.disabled" }}
                          />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.primary">
                        {getRowVal(row, "description") ?? "—"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{formatSharedWith(row)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                        <Avatar
                          sx={{
                            width: 24,
                            height: 24,
                            fontSize: 12,
                            bgcolor: "action.selected",
                            color: "text.secondary",
                          }}
                        >
                          {ownerInitial(row)}
                        </Avatar>
                        <Typography variant="body2" color="text.secondary">
                          {createdDate}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {modifiedDate}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <StatusSwitchCell
                        row={row}
                        token={userToken?.access_token}
                        onSuccess={() => setRefreshKey((k) => k + 1)}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuEdit}>Edit Dashboard</MenuItem>
        <MenuItem onClick={handleMenuRename}>Rename Dashboard</MenuItem>
        <MenuItem onClick={handleMenuClone}>Clone Dashboard</MenuItem>
        <MenuItem onClick={handleMenuPermission}>Dashboard Permission</MenuItem>
      </Menu>

      <Dialog open={renameOpen} onClose={handleRenameClose} fullWidth maxWidth="sm">
        <DialogTitle>Rename Dashboard</DialogTitle>
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
        <DialogActions>
          <Button onClick={handleRenameClose} color="inherit" disabled={renameSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleRenameSubmit}
            variant="contained"
            color="primary"
            disabled={renameSubmitting}
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
    </Box>
  );
}
