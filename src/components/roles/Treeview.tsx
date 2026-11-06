"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Chip,
  Collapse,
  Box,
} from "@mui/material";
import { ExpandMore, ExpandLess, Add, Edit, Delete, People } from "@mui/icons-material";
import { CaretDown, CaretRight, CheckCircle } from "@phosphor-icons/react";


import { get_full_roles_tree } from "@/services/api/roles/roles-api";

interface Role {
  id: string;
  name: string;
  parent_sdl_role: string;
  lft: number;
  rgt: number;
  role_name: string;
  children: Role[];
}

function normalizeDetailKey(s: string | undefined): string {
  if (s == null || String(s).trim() === "") return "";
  try {
    return decodeURIComponent(String(s).trim());
  } catch {
    return String(s).trim();
  }
}

export type RoleTreeViewProps = {
  /** URL `detail` query — highlights matching role row */
  settingsDetailKey?: string;
  /** Tighter layout in settings left column */
  variant?: "default" | "settings";
};

export default function RoleTreeView({
  settingsDetailKey = "",
  variant = "default",
}: RoleTreeViewProps) {
  const router = useRouter();
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set(["admin"]));
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [treeRoleData, setTreeRoleData] = useState<any>([]);
  const [err, setErr] = useState<boolean>(false);

  const [roles, setRoles] = useState<Role[]>([]);

  /** Settings two-column layout: open first role in URL when `detail` is missing (default view is tree). */
  const didAutoSelectDetailRef = useRef(false);
  const prevSettingsDetailRef = useRef<string>("");

  useEffect(() => {
    const cur = normalizeDetailKey(settingsDetailKey);
    const prev = prevSettingsDetailRef.current;
    prevSettingsDetailRef.current = cur;
    if (prev !== "" && cur === "") {
      didAutoSelectDetailRef.current = false;
    }
  }, [settingsDetailKey]);

  useEffect(() => {
    if (variant !== "settings") return;
    if (normalizeDetailKey(settingsDetailKey)) return;
    if (!Array.isArray(treeRoleData) || treeRoleData.length === 0) return;
    if (didAutoSelectDetailRef.current) return;
    const first = treeRoleData[0] as Role;
    const key = String(first?.name ?? first?.role_name ?? "").trim();
    if (!key) return;
    didAutoSelectDetailRef.current = true;
    router.push(
      `/settings?tab=security&subtab=roles&detail=${encodeURIComponent(key)}`,
      { scroll: false }
    );
  }, [variant, settingsDetailKey, treeRoleData, router]);

    useEffect(() => {

      const getroletree: any = async () => {
        const roletreeData: any = await get_full_roles_tree();
        console.log(roletreeData, 'roletreeData', roletreeData?.length);

        if (Array.isArray(roletreeData) && roletreeData?.length > 0) {
            console.log(roletreeData, 'roletreeData');
            setTreeRoleData(roletreeData);
            // Expand all roles by default
            setExpandedRoles(new Set(getAllRoleIds(roletreeData)));
        } else {
            setErr(!err);
        }
    };

    getroletree();
  },[])


  const getAllRoleIds = (roles: Role[]): string[] => {
    let ids: string[] = [];
    for (const role of roles) {
      ids.push(role.id);
      if (role.children.length > 0) {
        ids = ids.concat(getAllRoleIds(role.children));
      }
    }
    return ids;
  };



  const toggleExpanded = (roleId: string) => {
    const newExpanded = new Set(expandedRoles);
    newExpanded.has(roleId) ? newExpanded.delete(roleId) : newExpanded.add(roleId);
    console.log(newExpanded, 'newExpanded');
    setExpandedRoles(newExpanded);
  };

  const detailNorm = normalizeDetailKey(settingsDetailKey);

  const openRoleDetail = (role: Role) => {
    const key = String(role.name ?? role.role_name ?? "").trim();
    if (!key) return;
    router.push(
      `/settings?tab=security&subtab=roles&detail=${encodeURIComponent(key)}`,
      { scroll: false }
    );
  };

  const renderRole = (role: Role, depth = 0) => {
    const isExpanded = expandedRoles.has(role.id);
    const hasChildren = role.children.length > 0;
    const nodeName = String(role.name ?? role.role_name ?? "").trim();
    const selected =
      Boolean(detailNorm) &&
      (detailNorm === nodeName ||
        detailNorm === String(role.role_name ?? "").trim());

    /** Settings reference: flat rows with caret/leaf-dot, blue selected row + check. */
    if (variant === "settings") {
      return (
        <div key={role.id}>
          <div
            role="button"
            tabIndex={0}
            onClick={() => openRoleDetail(role)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openRoleDetail(role);
              }
            }}
            style={{ paddingLeft: `${12 + depth * 20}px` }}
            className={`flex cursor-pointer items-center gap-2 border-b py-2.5 pr-3 transition-colors ${
              selected
                ? "border-[#E3ECFC] bg-[#EFF6FF] dark:border-[#27272A] dark:bg-[#27272A]"
                : "border-[#E3ECFC] hover:bg-[#f9fbff] dark:border-[#27272A] dark:hover:bg-[#1C1C1E]"
            }`}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (hasChildren) toggleExpanded(role.id);
              }}
              className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md transition-colors hover:bg-[#E3ECFC] dark:hover:bg-[#3F3F46]"
            >
              {hasChildren ? (
                isExpanded ? (
                  <CaretDown size={10} color="#94A3B8" weight="bold" />
                ) : (
                  <CaretRight size={10} color="#94A3B8" weight="bold" />
                )
              ) : (
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#CBD5E1] dark:bg-[#3F3F46]" />
              )}
            </button>
            <span
              title={nodeName}
              className={`flex-1 truncate text-[14px] ${
                selected
                  ? "font-semibold text-[#0C2472] dark:text-[#D4D4D8]"
                  : "font-medium text-slate-500 dark:text-[#71717A]"
              }`}
            >
              {role.name}
            </span>
            {selected && <CheckCircle size={14} color="#1D4ED8" weight="duotone" />}
          </div>
          {hasChildren && isExpanded
            ? role.children.map((child) => renderRole(child, depth + 1))
            : null}
        </div>
      );
    }

    return (
      <Box key={role.id} sx={{ ml: depth * 3, mt: 1 }}>
        <Box
          onClick={() => openRoleDetail(role)}
          sx={{
            display: "flex",
            alignItems: "center",
            p: 1,
            border: 1,
            borderColor: selected ? "primary.main" : "divider",
            bgcolor: selected ? "rgba(25, 118, 210, 0.08)" : "transparent",
            borderRadius: 1,
            cursor: "pointer",
            "&:hover": {
              bgcolor: selected ? "rgba(25, 118, 210, 0.1)" : "action.hover",
            },
          }}
        >
          {hasChildren && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(role.id);
              }}
            >
              {isExpanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          )}
          {!hasChildren && <Box width={32} />}
           <Box display="flex" alignItems="center" sx={{ mr: 1, flex: 1, minWidth: 0 }}>
            <Typography variant="body2" color="text.primary" noWrap title={nodeName}>
              {role.name}
            </Typography>
          </Box>
          {/*<Chip label={role.name} size="small" sx={{ mr: 1 }} />*/}
          {/*<Box display="flex" alignItems="center" sx={{ mr: 1 }}>
            <People fontSize="small" sx={{ mr: 0.5 }} />
            <Typography variant="body2">{role.userCount}</Typography>
          </Box>*/}
         {/* <Typography variant="body2" sx={{ flexGrow: 1 }}>
            {role.description}
          </Typography>*/}
         {/* <IconButton size="small" onClick={() => setSelectedRole(role)}>
            <Edit fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error">
            <Delete fontSize="small" />
          </IconButton>*/}
        </Box>
        {hasChildren && (
          <Collapse in={isExpanded}>
            {role.children.map((child) => renderRole(child, depth + 1))}
          </Collapse>
        )}
      </Box>
    );
  };

  if (variant === "settings") {
    return (
      <div className="h-full min-h-0 bg-[#f9fbff] dark:bg-[#111113]">
        {treeRoleData.map((role: Role) => renderRole(role))}
      </div>
    );
  }

  return (
    <Box sx={{ p: 3, height: "100%", minHeight: 0 }}>
      <Box display="grid" gap={3}>
        <Card>
          <CardContent>
            {treeRoleData.map((role: Role) => renderRole(role))}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
