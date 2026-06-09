"use client";
import { readAccessTokenDataParsed } from '@/utils/accessTokenDataStorage'

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Switch,
  Box,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  InputAdornment,
  Menu,
  MenuItem,
  Tooltip,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import FolderIcon from "@mui/icons-material/Folder";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import SearchIcon from "@mui/icons-material/Search";
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

  return (
    <Switch
      checked={localChecked}
      disabled={loading || isDependsOn}
      onChange={handleChange}
      size="small"
      color="success"
    />
  );
}

type ModuleListingProps = {
  /** Settings `/settings?tab=customization&subtab=modules`: match Users tab padding and toolbar stripe */
  embedInSettings?: boolean;
};

const ModuleListing = ({ embedInSettings = false }: ModuleListingProps) => {
  const pathname = usePathname();
  const router = useRouter();

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
      {/* Top toolbar: Search + filters + primary action */}
      <Box
        sx={{
          mb: embedInSettings ? 0 : 2,
          pb: embedInSettings ? "1.224rem" : 2,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 2,
          ...(embedInSettings && {
            borderBottom: "5px solid",
            borderColor: "divider",
          }),
        }}
      >
        <TextField
          size="small"
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: 280 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            "& .filter-chip": {
              px: 1.5,
              py: 0.75,
              borderRadius: 1,
              bgcolor: "transparent",
              cursor: "pointer",
              border: "0px solid",
              borderColor: "divider",
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              typography: "body2",
              "&.selected": {
                bgcolor: "transparent",
                color: "inherit",
                borderColor: "primary.main",
              },
            },
          }}
        >
          <Box
            className={`filter-chip ${customSelected ? "selected" : ""}`}
            onClick={() => setCustomSelected((prev) => !prev)}
          >
            <SettingsIcon sx={{ fontSize: 18 }} />
            <span>Custom Module</span>
          </Box>
          {/* <Box
            className={`filter-chip ${teamSelected ? "selected" : ""}`}
            onClick={() => setTeamSelected((prev) => !prev)}
          >
            <ViewModuleIcon sx={{ fontSize: 20 }} />
            <span>Team Module</span>
          </Box> */}
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        <Button variant="contained" onClick={handleCreateNew}>
          Create New Module
        </Button>
      </Box>

      {/* Table container without pagination */}
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
            minWidth: 650,
            "& thead th": {
              fontWeight: 600,
              py: 1,
            },
            "& thead tr": {
              borderBottomWidth: 2,
              borderBottomStyle: "solid",
              borderBottomColor: "divider",
            },
          }}
          aria-label="modules table"
        >
          <TableHead>
            <TableRow>
              <TableCell>Displayed In Tabs As</TableCell>
              <TableCell>Module Name</TableCell>
              <TableCell>Shared To</TableCell>
              <TableCell>Last Modified</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : filteredRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No records found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.map((row: any) => {
                const modified = row.modified;
                const dateStr = modified
                  ? new Date(modified).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "—";

                return (
                  <TableRow
                    key={row.name}
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
                          pl: 2,
                        }}
                      >
                        {(() => {
                          const menuIconName = getRowVal(row, "menu_icon");
                          const DisplayIcon = getMenuIconComponent(menuIconName);
                          return (
                            <DisplayIcon
                              sx={{
                                fontSize: 22,
                                color: "action.active",
                              }}
                            />
                          );
                        })()}
                        <Link
                          href={
                            embedInSettings
                              ? moduleSettingsDetailPath({
                                  moduleName: row.name,
                                })
                              : `/setup/customization/modules/${row.name}`
                          }
                          rel="noopener noreferrer"
                          style={{
                            color: "var(--mui-palette-primary-main)",
                            fontWeight: 500,
                          }}
                        >
                          <Box component="span" sx={{ px: 1 }}>
                            {row.frontend_module ?? row.name}
                          </Box>
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
                              bgcolor: "common.white",
                              "& svg": {
                                color: "text.primary",
                              },
                            },
                          }}
                          onClick={(e) => handleMoreClick(e, row)}
                        >
                          <MoreHorizIcon
                            sx={{ fontSize: 22, color: "action.disabled" }}
                          />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{row.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {row.role_count != null &&
                        row.total_roles != null &&
                        row.role_count === row.total_roles
                          ? "All Roles"
                          : row.role_names ?? "—"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
                      >
                        <PersonOutlineIcon
                          sx={{ fontSize: 18, color: "action.disabled" }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          {dateStr}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <StatusSwitchCell
                          row={row}
                          token={userToken?.access_token}
                          onSuccess={() => setRefreshKey((k) => k + 1)}
                        />
                        <Tooltip title="View dependencies">
                          <IconButton size="small" sx={{ p: 0.25 }}>
                            <InfoOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuLayout}>Layout</MenuItem>
        <MenuItem onClick={handleMenuRename}>Rename</MenuItem>
        <MenuItem onClick={handleMenuFields}>Fields</MenuItem>
        {menuRow && isLeadsModuleRow(menuRow) && (
          <MenuItem onClick={handleMenuLeadConversionMapping}>
            Lead Conversion Mapping
          </MenuItem>
        )}
        <MenuItem onClick={handleMenuModulePermission}>Module Permission</MenuItem>
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
      >
        <DialogTitle>Module Name</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
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
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRenameClose}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleRenameSubmit}
            disabled={
              renameSubmitting ||
              !renamePlural.trim() ||
              !renameSingular.trim()
            }
          >
            {renameSubmitting ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ModuleListing;
