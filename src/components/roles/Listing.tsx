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
import { ListBullets, Tree } from "@phosphor-icons/react";
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
    /** Segmented Tree/List toggle + New Role, matching the settings reference toolbar. */
    const viewToggle = (
      <div className="flex items-center gap-1 rounded-xl border border-[#E3ECFC] bg-[#EFF6FF] p-1 dark:border-[#27272A] dark:bg-[#1C1C1E]">
        {(["tree", "list"] as const).map((mode) => {
          const active = settingsRolesView === mode;
          return (
            <button
              key={mode}
              type="button"
              onClick={() => setSettingsRolesView(mode)}
              className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-semibold capitalize transition-colors ${
                active
                  ? "bg-[#E3ECFC] text-[#0C2472] dark:bg-[#27272A] dark:text-[#D4D4D8]"
                  : "text-slate-400 dark:text-[#9CA3AF]"
              }`}
            >
              {mode === "tree" ? (
                <Tree size={12} weight="duotone" />
              ) : (
                <ListBullets size={12} weight="duotone" />
              )}
              {mode}
            </button>
          );
        })}
      </div>
    );

    return (
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          bgcolor: theme => (theme.palette.mode === "dark" ? "#111113" : "#f9fbff"),
        }}
      >
        <div className="flex flex-shrink-0 items-center gap-2 border-b border-[#E3ECFC] px-4 py-3 dark:border-[#27272A]">
          {viewToggle}
          <div className="flex-1" />
          <Button
            variant="contained"
            size="small"
            onClick={handleAddNew}
            sx={{
              flexShrink: 0,
              bgcolor: "#1D4ED8",
              color: "white",
              borderRadius: "9px",
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.73rem",
              px: 1.5,
              py: 0.7,
              boxShadow: "0 1px 6px #1D4ED833",
              "&:hover": { bgcolor: "#2563EB" },
            }}
          >
            New Role
          </Button>
        </div>
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
