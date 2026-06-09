"use client";

import { readAccessTokenDataParsed } from "@/utils/accessTokenDataStorage";

import { useCallback, useEffect, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { useRouter } from "next/navigation";

import Link from "@/components/Link";
import { showToast } from "@/components/ToastNotificationNew";
import {
  dashboardCreatePath,
  dashboardEditPath,
} from "@/app/settings/utils/moduleSettingsRoutes";
import { fetchRawDataGridListing } from "@/services/api/common-erpnext-api/listing-api-get";
import { updateResource } from "@/services/api/common-erpnext-api/create-edit-api";

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

  const handleCreate = () => {
    router.push(dashboardCreatePath());
  };

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
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell>
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
    </Box>
  );
}
