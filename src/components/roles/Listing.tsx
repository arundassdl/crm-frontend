import { readAccessTokenDataRaw } from '@/utils/accessTokenDataStorage'
import { Suspense, useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
} from "@mui/material";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import Check from "@mui/icons-material/Check";
import KeyboardArrowDown from "@mui/icons-material/KeyboardArrowDown";
import ViewListOutlined from "@mui/icons-material/ViewListOutlined";
import { useRouter } from "next/navigation";
import {
  fetchRawDataGridListing,
} from "@/services/api/common-erpnext-api/listing-api-get";
import AddEditRoleDrawer from "@/components/roles/createrole";
import {
  deleteClient,
} from "@/services/api/common-erpnext-api/create-edit-api";
import { showToast } from "@/components/ToastNotificationNew";
import { columnsConfig } from "../Common/DataGrid/columnsConfig";
import RawDynamicDataGrid from "../Common/DataGrid/RawDynamicDataGrid";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import TreeviewBoard from "@/components/Common/TreeViewBoard";
import RoleTreeView from "@/components/roles/Treeview";
import RolesSettingsListView from "@/components/roles/RolesSettingsListView";
import { delete_role } from "@/services/api/roles/roles-api";

interface RoleListingProps {
  link_name?: string
  /** `/settings?tab=security&subtab=roles` — grid fills panel */
  embedInSettings?: boolean
  /** Selected role from `detail` query (settings two-column layout). */
  settingsDetailKey?: string
}
const RoleListing: React.FC<RoleListingProps> = ({
  link_name,
  embedInSettings = false,
  settingsDetailKey = "",
}) => {
  const module = "SDL Role";
  const module_name = "Roles";
  const router = useRouter();
  const [userToken, setUserToken] = useState<any>(() => {
    const initialValue = JSON.parse(
      readAccessTokenDataRaw()
    );
    return initialValue || "";
  });
  const [operation, setOperation] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);


  // Open dialog only when selectedRow is updated
  useEffect(() => {
    if (Object.keys(selectedRow).length > 0) {
      OpenDialog();
    }
  }, [selectedRow]);

  const handleRowEdit = async (rowData: any) => {

    // rowData.due_date = formatCalDate(rowData.due_date);
    console.log('Row Data--->', rowData)
    setSelectedRow(rowData);
    // OpenDialog();
    setOperation("Edit");
    return false;
  };

  const OpenDialog = () => {
    setOpen(true);
  };

  const CloseDialog = () => {
    setSelectedRow([]);
    setOpen(false);
  };
  const handleAddNew = () => {
    setSelectedRow([]);
    setOperation("New");
    setOpen(true);
  };
  const handleFormSubmit = () => {
    setRefreshKey((prevKey) => prevKey + 1); // Increment refreshKey to force DataGrid reload
    CloseDialog();
  };

  const handleDelete = async (id: any) => {
    try {
      const request = {
        name: id, // or role name depending on your data structure
      };

      const deleteResponse = await delete_role(request, userToken?.access_token);

      if (deleteResponse?.msg === "success") {
        showToast("Role deleted successfully", "success");
        setRefreshKey(prev => prev + 1); // Refresh the grid
      } else {
        showToast(deleteResponse?.error || "Failed to delete role", "error");
      }
    } catch (error) {
      console.error("Error deleting role:", error);
      showToast("An error occurred while deleting the role", "error");
    }
  };
  const handleRowDetail: any = async (rowData: any) => {
    const key = String(rowData?.name ?? rowData?.role_name ?? "").trim();
    if (!key) return;
    router.push(
      `/settings?tab=security&subtab=roles&detail=${encodeURIComponent(key)}`,
      { scroll: false }
    );
  };

  const handleSelectRoleFromSettings = useCallback(
    (key: string) => {
      const k = String(key ?? "").trim();
      if (!k) return;
      router.push(
        `/settings?tab=security&subtab=roles&detail=${encodeURIComponent(k)}`,
        { scroll: false }
      );
    },
    [router]
  );

  /** Settings embed: local tree vs list — default tree (matches product spec). */
  const [settingsRolesView, setSettingsRolesView] = useState<"tree" | "list">(
    "tree"
  );
  const [rolesViewMenuAnchor, setRolesViewMenuAnchor] =
    useState<null | HTMLElement>(null);
  const rolesViewMenuOpen = Boolean(rolesViewMenuAnchor);
  const colFields = [
    { doctype: module, field: "name", hidden: "True" },
    { doctype: module, field: "role_name", hidden: "False" },
    { doctype: module, field: "role_description", hidden: "True" },
    { doctype: module, field: "disabled", hidden: "False" },
    { doctype: module, field: "is_admin", hidden: "False" },
    { doctype: module, field: "creation", hidden: "False" },
    { doctype: module, field: "modified", hidden: "False" },
  ];
  // const relatedDocs = ["Dynamic Link", "Contact", "Address"];
  // const include_contact = "True";
  // const include_address = "True";
  const wherecondition =
    " AND `tabSDL Role`.role_name != 'Super Admin' ";
  const fetchDataWrapper = (fetchFunction, params, token) => {
    /* fetchRawDataGridListing: … relatedDocs, include_contact, include_address,
       linkedDoctypes, Joinquery, wherecondition, role_profile, username */
    return fetchFunction(
      params,
      token,
      colFields,
      module,
      [],
      "",
      "",
      [],
      "",
      wherecondition,
      userToken?.role_profile,
      userToken?.username
    );
  };

  const listfields = [];

  const view_mode = useSelector((state: RootState) => state.viewMode.viewMode);

  if (embedInSettings) {
    return (
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            px: 1.5,
            py: 1.25,
            flexShrink: 0,
            borderBottom: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          <Box>
            <Button
              id="roles-settings-view-button"
              variant="outlined"
              size="small"
              aria-controls={rolesViewMenuOpen ? "roles-settings-view-menu" : undefined}
              aria-expanded={rolesViewMenuOpen ? "true" : undefined}
              aria-haspopup="true"
              onClick={(e) => setRolesViewMenuAnchor(e.currentTarget)}
              startIcon={
                settingsRolesView === "tree" ? (
                  <AccountTreeOutlinedIcon sx={{ fontSize: 20 }} />
                ) : (
                  <ViewListOutlined sx={{ fontSize: 20 }} />
                )
              }
              endIcon={
                <KeyboardArrowDown
                  sx={{
                    fontSize: 18,
                    color: "text.secondary",
                    transition: (t) =>
                      t.transitions.create("transform", { duration: 150 }),
                    transform: rolesViewMenuOpen ? "rotate(-180deg)" : "none",
                  }}
                />
              }
              sx={{
                textTransform: "none",
                px: 1.25,
                py: 0.5,
                borderColor: "divider",
                bgcolor: "background.paper",
                color: "text.primary",
                fontWeight: 500,
                "&:hover": {
                  borderColor: "action.active",
                  bgcolor: "action.hover",
                },
              }}
            >
              {settingsRolesView === "tree" ? "Tree" : "List"}
            </Button>
            <Menu
              id="roles-settings-view-menu"
              anchorEl={rolesViewMenuAnchor}
              open={rolesViewMenuOpen}
              onClose={() => setRolesViewMenuAnchor(null)}
              anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
              transformOrigin={{ vertical: "top", horizontal: "left" }}
              slotProps={{
                paper: {
                  elevation: 8,
                  sx: {
                    mt: 0.75,
                    minWidth: 200,
                    borderRadius: 1,
                    boxShadow: (t) => t.shadows[8],
                  },
                },
              }}
              MenuListProps={{ dense: true, "aria-labelledby": "roles-settings-view-button" }}
            >
              <MenuItem
                onClick={() => {
                  setSettingsRolesView("list");
                  setRolesViewMenuAnchor(null);
                }}
                selected={settingsRolesView === "list"}
                sx={{
                  py: 1,
                  gap: 1,
                  "&.Mui-selected": {
                    bgcolor: "rgba(25, 118, 210, 0.08)",
                  },
                  "&.Mui-selected:hover": {
                    bgcolor: "rgba(25, 118, 210, 0.12)",
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <ViewListOutlined
                    sx={{
                      fontSize: 22,
                      color:
                        settingsRolesView === "list" ? "primary.main" : "action.active",
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary="List"
                  primaryTypographyProps={{
                    variant: "body2",
                    fontWeight: settingsRolesView === "list" ? 600 : 500,
                    color: "text.primary",
                  }}
                />
                {settingsRolesView === "list" ? (
                  <Check sx={{ fontSize: 20, color: "primary.main", ml: 0.5 }} />
                ) : (
                  <Box sx={{ width: 24, flexShrink: 0 }} aria-hidden />
                )}
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setSettingsRolesView("tree");
                  setRolesViewMenuAnchor(null);
                }}
                selected={settingsRolesView === "tree"}
                sx={{
                  py: 1,
                  gap: 1,
                  "&.Mui-selected": {
                    bgcolor: "rgba(25, 118, 210, 0.08)",
                  },
                  "&.Mui-selected:hover": {
                    bgcolor: "rgba(25, 118, 210, 0.12)",
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <AccountTreeOutlinedIcon
                    sx={{
                      fontSize: 22,
                      color:
                        settingsRolesView === "tree" ? "primary.main" : "action.active",
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary="Tree"
                  primaryTypographyProps={{
                    variant: "body2",
                    fontWeight: settingsRolesView === "tree" ? 600 : 500,
                    color: "text.primary",
                  }}
                />
                {settingsRolesView === "tree" ? (
                  <Check sx={{ fontSize: 20, color: "primary.main", ml: 0.5 }} />
                ) : (
                  <Box sx={{ width: 24, flexShrink: 0 }} aria-hidden />
                )}
              </MenuItem>
            </Menu>
          </Box>
          <Tooltip title="New role">
            <Button
              variant="contained"
              size="small"
              onClick={handleAddNew}
              sx={{ flexShrink: 0 }}
            >
              New Role
            </Button>
          </Tooltip>
        </Box>
        <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", position: "relative" }}>
          {settingsRolesView === "tree" ? (
            <RoleTreeView
              settingsDetailKey={settingsDetailKey}
              variant="settings"
            />
          ) : (
            <Suspense
              fallback={
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    flex: 1,
                    py: 6,
                  }}
                >
                  <CircularProgress size={28} />
                </Box>
              }
            >
              <RolesSettingsListView
                refreshKey={refreshKey}
                onSelectRole={handleSelectRoleFromSettings}
                userToken={userToken}
                settingsDetailKey={settingsDetailKey}
              />
            </Suspense>
          )}
        </Box>
        {open && (
          <AddEditRoleDrawer
            initialValues={selectedRow}
            open={open}
            onClose={CloseDialog}
            operation={operation}
            onSubmit={handleFormSubmit}
          />
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ p: 0, m: 0, borderRadius: 0 }}>
      {view_mode === "list" ? (
        <RawDynamicDataGrid
          module={module}
          heading={"Roles"}
          onAddNew={handleAddNew}
          // handleRowEdit={handleRowEdit}
          // handleRowDetail={handleRowDetail}
          handleRowDelete={handleDelete}
          colFields={colFields}
          columnDefinitions={columnsConfig.roles}
          fetchDataFunction={(p, t, q) =>
            fetchDataWrapper(fetchRawDataGridListing, p, t)
          }
          refreshKey={refreshKey}
          multipleViews={true}
          multiviewList={"Tree"}
          module_name={module_name}
        />
      ) : (
        <TreeviewBoard
          listfields={listfields}
          module={module}
          title={"Roles"}
          fieldname={"status"}
          onAddNew={handleAddNew}
          refreshKey={refreshKey}
          module_name={module_name}
          multiviewList={"Tree"}
        />
      )}

      {open && (
        <AddEditRoleDrawer
          initialValues={selectedRow}
          open={open}
          onClose={CloseDialog}
          operation={operation}
          onSubmit={handleFormSubmit}
        />
      )}
    </Box>
  );
};

export default RoleListing;
