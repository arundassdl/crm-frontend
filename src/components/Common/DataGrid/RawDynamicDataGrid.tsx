"use client";

import { readAccessTokenDataRaw } from '@/utils/accessTokenDataStorage';
import React, { useEffect, useState, useMemo } from "react";
import {
  GridColDef,
  GridActionsCellItem,
  GridSortModel,
  GridFilterModel,
  GridColumnVisibilityModel,
} from "@mui/x-data-grid";
import classnames from "classnames";
import SDLDataGrid from "@/@core/components/datagrid/SDLDataGrid";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { debounce } from "@mui/material";
import ConfirmDialog from "@/components/UI/ConfirmDialog";
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { setViewMode } from '@/store/slices/viewmode/viewModeSlice';

// Drawers and Popovers
import FiltersDrawer, { FilterRow } from "./FiltersDrawer";
import ColumnsDrawer from "./ColumnsDrawer";
import SortPopover, { SortRow } from "./SortPopover";

// Styles & Icons
import { useTheme } from "@mui/material/styles";
import { Badge, InputBase, Button } from "@mui/material";
import {
  List, GridFour, GitFork, MagnifyingGlass, FunnelSimple, Columns, SortAscending, Plus,
  User, IdentificationBadge, UserCircle, CalendarBlank,
  Envelope, Phone, DeviceMobile, Pulse, Buildings, Globe, Briefcase,
  House, CaretRight, CaretDown, Kanban, TrendUp
} from "@phosphor-icons/react";

import LeadGridView from "@/components/Leads/LeadGridView";
import LeadKanbanView from "@/components/Leads/LeadKanbanView";
import { getAvatarColor as avatarColor } from "@/@core/utils/avatarColor";
import { StatusBadge, buildStatusStyleMap, type StatusOption } from "./statusBadge";
import { useHorizontalScroll } from "@/hooks/GeneralHooks/useHorizontalScroll";

// Utility function to format header names dynamically
const formatHeaderName = (field: string) => {
  if (field != undefined) {
    return field
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }
  return "";
};

// Phosphor Icon mapping for headers based on field patterns
const getHeaderIcon = (field: string) => {
  const f = field.toLowerCase();
  if (f === "lead_name" || f === "full_name" || f === "first_name" || f === "customer_name" || f === "name") return User;
  if (f === "owner" || f === "lead_owner" || f === "assigned_to") return UserCircle;
  if (f === "email" || f === "email_id") return Envelope;
  if (f === "mobile_no" || f === "mobile") return DeviceMobile;
  if (f === "phone" || f === "customer_phone" || f === "phone_no") return Phone;
  if (f === "status" || f.endsWith("_status")) return Pulse;
  if (f === "creation" || f === "modified" || f === "due_date" || f === "close_date") return CalendarBlank;
  if (f === "organization" || f === "company" || f === "organization_name") return Buildings;
  if (f === "website") return Globe;
  if (f === "industry") return Briefcase;
  if (f === "job_title" || f === "title") return Briefcase;
  if (f === "territory") return Globe;
  return null;
};

// Status badge colours/labels come from the module's Component Pick List
// configuration — see `statusBadge.tsx`. Nothing about the status set is
// hardcoded here.

/** A probability column is the field itself, or a namespaced variant (`stage_probability`). */
const isProbabilityField = (field: string) => {
  const f = field.toLowerCase();
  return f === "probability" || f.endsWith("_probability");
};

/**
 * Coerce a stored probability to a 0-100 percentage.
 *
 * Returns `null` when there is no value to show and `NaN` when the value isn't
 * numeric — callers fall back to the empty placeholder and to plain text
 * respectively, so a non-numeric value is never silently hidden. Note that 0 is
 * a real probability (an untouched "Qualification" deal), not an empty cell.
 */
const toPercent = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(String(value).replace("%", "").trim());
  if (Number.isNaN(n)) return NaN;
  return Math.min(Math.max(Math.round(n), 0), 100);
};

// Avatar color helper comes from the shared theme-aligned palette (imported at top).
const initials = (n: string) => {
  const p = n.trim().split(/\s+/);
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : n.substring(0, 2).toUpperCase();
};

interface DynamicDataGridColField {
  doctype: string;
  field: string;
  hidden: string;
  headerName?: string;
  subFieldAlias?: string;
}

interface DynamicDataGridProps {
  heading?: string;
  module: string;
  colFields: DynamicDataGridColField[];
  listfields?: string[];
  columnDefinitions: Record<string, Partial<GridColDef>>;
  pageSize?: number;
  defaultSort?: string;
  onAddNew?: () => void;
  handleRowDetail?: (customerName: string) => void;
  handleRowEdit?: (row: any) => void;
  handleRowDelete?: (rowId: string) => void;
  handleRowRename?: (row: any) => void;
  handleRowClone?: (row: any) => void;
  handleRowLayoutPermission?: (row: any) => void;
  relatedDocs?: string[];
  fetchDataFunction?: (
    ...args: any[]
  ) => Promise<{ data: any[]; totalCount: number }>;
  onSubmit?: () => void;
  refreshKey?: number;
  gridHeight?: string;
  multipleViews?: boolean;
  module_name?: string;
  multiviewList?: string;
  hideToolbarTitle?: boolean;
  customToolbar?: React.ComponentType<any>;
  checkboxSelection?: boolean;
  btnnewtitle?: string;
  stages?: { label: string; index: number; bgColor: string; color: string }[];
  statusCounts?: Record<string, number>;
  /** Field key the status pick list resolved on (e.g. "lead_status"); used for tab filtering. */
  statusField?: string;
  /**
   * Status pick list options straight from the backend (value/label/color).
   * Drives the status badge in the list so configured labels and colours are
   * reflected without any hardcoding.
   */
  statusOptions?: StatusOption[];
  /** Optional grid-view renderer; defaults to LeadGridView. Receives the fetched rows. */
  gridViewComponent?: React.ComponentType<{ rows: any[]; statusField?: string; statusOptions?: StatusOption[] }>;
  /** Optional kanban-view renderer; defaults to LeadKanbanView. Must accept the same props. */
  kanbanViewComponent?: React.ComponentType<any>;
  /** Extra props forwarded to the grid/kanban view components (e.g. a resolved field name). */
  viewProps?: Record<string, any>;
  /**
   * Optional aggregate shown next to the heading (e.g. "Pipeline: ₹32.4L").
   * Computed over the *whole filtered result set* — not just the current page —
   * so it stays correct under server-side pagination, and re-runs whenever the
   * filters / status tab / search change.
   */
  summary?: {
    label: string;
    /** Per-row value to add up (lets callers resolve aliased/qualified fields). */
    compute: (row: any) => number;
    /** Render the total (e.g. ₹32.4L). */
    format: (total: number) => string;
  };
  /** Which view buttons to show (default: all three). A globally-selected view not in
   *  this list falls back to "list" so e.g. Contacts never renders the Kanban view. */
  availableViews?: Array<"list" | "grid" | "kanban">;
}

const RawDynamicDataGrid: React.FC<DynamicDataGridProps> = ({
  heading,
  module,
  colFields,
  listfields,
  columnDefinitions,
  pageSize = 20,
  defaultSort = "creation",
  onAddNew,
  fetchDataFunction,
  handleRowDetail,
  handleRowEdit,
  handleRowDelete,
  handleRowRename,
  handleRowClone,
  handleRowLayoutPermission,
  onSubmit,
  refreshKey,
  relatedDocs,
  gridHeight,
  multipleViews,
  module_name,
  multiviewList,
  hideToolbarTitle,
  customToolbar,
  checkboxSelection,
  btnnewtitle,
  stages,
  statusCounts,
  statusField,
  statusOptions,
  gridViewComponent: GridViewComponent,
  kanbanViewComponent: KanbanViewComponent,
  viewProps,
  summary,
  availableViews,
}) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const safeSearchParams = useSearchParams() ?? new URLSearchParams();
  const pathname = usePathname();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // Redux state for viewmode
  const view_mode = useSelector((state: RootState) => state.viewMode.viewMode);
  // View mode is global (shared across listings). Clamp it to the views this listing
  // supports so a view selected elsewhere (e.g. Kanban on Leads) doesn't leak in.
  const allowedViews = availableViews ?? ["list", "grid", "kanban"];
  const effectiveView = (allowedViews.includes(view_mode as any) ? view_mode : "list") as "list" | "grid" | "kanban";

  // Pagination states
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: pageSize,
  });

  // Filters & Sorting state controllers
  const [filterModel, setFilterModel] = useState<GridFilterModel>({
    items: [],
    quickFilterValues: [],
  });
  const [sortModel, setSortModel] = useState<GridSortModel>([]);
  const [columnVisibilityModel, setColumnVisibilityModel] = useState<GridColumnVisibilityModel>({});

  // Custom interactive panel states
  const [activeFilters, setActiveFilters] = useState<FilterRow[]>([]);
  const [activeSorts, setActiveSorts] = useState<SortRow[]>([]);
  const [visibleCols, setVisibleCols] = useState<Set<string>>(new Set());

  // Dialog, loading and grid items
  const [pageSizeOptions, setPageSizeOptions] = useState<number[]>([20, 50, 100]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState<any | null>(null);

  // Anchors for popovers
  const [filterAnchor, setFiltersAnchor] = useState<HTMLElement | null>(null);
  const [sortAnchor, setSortAnchor] = useState<HTMLElement | null>(null);
  const [columnsDrawerOpen, setColumnsDrawerOpen] = useState(false);
  const [currentStatusTab, setCurrentStatusTab] = useState("All");
  const [searchVal, setSearchVal] = useState("");

  const moduleHeading = (heading && heading != "") ? heading : module;
  const [isAddPermission, setIsAddPermission] = useState(0);
  const [isEditPermission, setIsEditPermission] = useState(0);
  const [isDeletePermission, setIsDeletePermission] = useState(0);

  const [userToken, setUserToken] = useState<any>(() => {
    const initialValue = JSON.parse(readAccessTokenDataRaw());
    return initialValue || "";
  });

  const [userPermission, setUserPermission] = useState<any>(() => {
    const initialValue = JSON.parse(localStorage.getItem("userpermission") || "[]");
    const permissionArray = Array.isArray(initialValue) ? initialValue : [];
    return permissionArray.find(m => m.frontend_module === module_name) || "";
  });

  useEffect(() => {
    setPageSizeOptions((prev) =>
      Array.from(new Set([...[pageSize], ...prev])).sort((a, b) => a - b)
    );
  }, [pageSize]);

  useEffect(() => {
    if (userPermission.hasOwnProperty('create')) {
      setIsAddPermission(userPermission.create);
      setIsEditPermission(userPermission.edit);
      setIsDeletePermission(userPermission.delete);
    }
  }, [userPermission]);

  // Sync columns drawer visibility set
  useEffect(() => {
    const initialVisible = new Set<string>();
    colFields.forEach(field => {
      if (field.hidden?.toLowerCase() !== "true") {
        initialVisible.add(`${field.doctype}.${field.field}`);
      }
    });
    setVisibleCols(initialVisible);
  }, [colFields]);

  // Sync back visibility model changes
  useEffect(() => {
    const newModel: GridColumnVisibilityModel = {};
    colFields.forEach(field => {
      const fieldKey = `${field.doctype}.${field.field}`;
      if (!visibleCols.has(fieldKey)) {
        newModel[fieldKey] = false;
      } else {
        newModel[fieldKey] = true;
      }
    });
    setColumnVisibilityModel(newModel);
  }, [visibleCols, colFields]);

  // Sync filters drawer changes back to GridFilterModel
  useEffect(() => {
    const muiFilters = activeFilters.map(f => ({
      field: f.column,
      operator: f.operator,
      value: f.value
    }));

    if (currentStatusTab !== "All") {
      // Prefer the field the status pick list resolved on (e.g. "lead_status"); fall back
      // to detecting a status-like column so the tab filter targets the displayed value.
      const targetField = (statusField || "status").toLowerCase();
      const statusCol =
        colFields.find(f => f.field.toLowerCase() === targetField) ||
        colFields.find(f => ["lead_status", "status"].includes(f.field.toLowerCase()));
      const statusKey = statusCol ? `${statusCol.doctype}.${statusCol.field}` : (statusField || "status");
      muiFilters.push({
        field: statusKey,
        operator: "equals",
        value: currentStatusTab
      });
    }

    setFilterModel(prev => ({
      ...prev,
      items: muiFilters
    }));
  }, [activeFilters, currentStatusTab, colFields, statusField]);

  // Sync sorting drawer changes back to GridSortModel
  useEffect(() => {
    setSortModel(activeSorts.map(s => ({
      field: s.column,
      sort: s.dir
    })));
  }, [activeSorts]);

  /**
   * Invoke `fetchDataFunction`, adapting to its arity (callers supply wrappers
   * with different signatures). Shared by the paged fetch and the summary
   * aggregate so both hit the backend the same way.
   */
  const callFetch = async (dataParams: any) => {
    if (!fetchDataFunction) return undefined;

    if (fetchDataFunction.length === 2) {
      return await fetchDataFunction(
        dataParams,
        userToken?.access_token,
        safeSearchParams.toString()
      );
    }
    if (fetchDataFunction.length === 3) {
      return await fetchDataFunction(dataParams, userToken?.access_token, [], module);
    }
    if (fetchDataFunction.length === 4) {
      return await fetchDataFunction(
        dataParams,
        userToken?.access_token,
        [],
        module,
        [],
        relatedDocs,
      );
    }
    console.error("fetchDataFunction does not match expected parameters.");
    return undefined;
  };

  // Fetch Data
  const fetchData = async () => {
    if (!fetchDataFunction) return;

    setLoading(true);
    try {
      const result = await callFetch({
        doctype: module,
        page: paginationModel.page,
        pageSize: paginationModel.pageSize,
        filters: filterModel,
        sort: sortModel,
      });
      if (!result) return;

      setData(result.data || []);
      setRowCount(result.totalCount || 0);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (effectiveView === "grid" || effectiveView === "kanban") {
      setPaginationModel(prev => ({ ...prev, pageSize: 1000, page: 0 }));
    } else {
      setPaginationModel(prev => ({ ...prev, pageSize: pageSize, page: 0 }));
    }
  }, [view_mode, pageSize]);

  const handleUpdateLeadStatus = async (leadName: string, newStatus: string) => {
    const payload = {
      doctype: module,
      name: leadName,
      fieldname: statusField || "status",
      value: newStatus,
    };
    try {
      const res = await fetch("/api/set-value", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${userToken?.access_token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update status");
      fetchData();
    } catch (err) {
      console.error("Failed to update lead status:", err);
      throw err;
    }
  };

  useEffect(() => {
    fetchData();
  }, [paginationModel, sortModel, filterModel, onSubmit, refreshKey]);

  /**
   * Heading aggregate (e.g. "Pipeline: ₹32.4L").
   *
   * The grid is server-paginated, so the loaded `data` is only the current page —
   * summing it would under-report. Instead re-query with the *same filters* but a
   * large page size and add up every matching row. Depends on `filterModel`, so it
   * follows the status tab, the filters drawer and the search box.
   */
  const [summaryTotal, setSummaryTotal] = useState<number | null>(null);

  useEffect(() => {
    if (!summary || !fetchDataFunction) return;

    let cancelled = false;
    const loadSummary = async () => {
      try {
        const res = await callFetch({
          doctype: module,
          page: 0,
          pageSize: 1000, // cap: aggregate over the filtered set, not just a page
          filters: filterModel,
          sort: [],
        });
        if (cancelled || !res) return;
        const rows: any[] = res.data || [];
        const total = rows.reduce((acc, row) => acc + (Number(summary.compute(row)) || 0), 0);
        setSummaryTotal(total);
      } catch (err) {
        console.error("Error computing summary total:", err);
        if (!cancelled) setSummaryTotal(null);
      }
    };

    loadSummary();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterModel, refreshKey, module, userToken?.access_token, !!summary]);

  const handleSortModelChange = (newSortModel) => {
    const params = new URLSearchParams(safeSearchParams);
    if (newSortModel?.length > 0) {
      const { field, sort } = newSortModel[0];
      params.set("sort", field);
      params.set("order", sort);
    } else {
      params.delete("sort");
      params.delete("order");
    }
    router.replace(`${pathname ?? ''}?${params.toString()}`);
    setSortModel(newSortModel);
  };

  const handleFilterModelChange = debounce((newFilterModel) => {
    const params = new URLSearchParams(safeSearchParams);
    newFilterModel.items.forEach((filter) => {
      if (filter.value) {
        params.set(filter.field, filter.value);
      } else {
        params.delete(filter.field);
      }
    });
    router.replace(`${pathname ?? ''}?${params.toString()}`);
    setFilterModel(newFilterModel);
  }, 1000);

  const handlePaginationChange = (newPaginationModel) => {
    const params = new URLSearchParams(safeSearchParams);
    params.set("page", (newPaginationModel.page + 1).toString());
    params.set("limit", newPaginationModel.pageSize.toString());
    router.replace(`${pathname ?? ''}?${params.toString()}`);
    setPaginationModel(newPaginationModel);
  };

  const handleDeletePopup = (id: any) => {
    setSelectedRowId(id);
    setDialogOpen(true);
  };

  const handleDeleteClick = () => {
    if (selectedRowId) {
      handleRowDelete?.(selectedRowId);
    }
    setDialogOpen(false);
    fetchData();
    setTimeout(() => {
      fetchData();
    }, 1500);
  };

  const handleSearchChange = (val: string) => {
    setSearchVal(val);
    updateQuickFilter(val);
  };

  const updateQuickFilter = useMemo(
    () =>
      debounce((val: string) => {
        setFilterModel(prev => ({
          ...prev,
          quickFilterValues: val ? [val] : []
        }));
      }, 500),
    []
  );

  const handleStatusTabChange = (status: string) => {
    setCurrentStatusTab(status);
    setPaginationModel(prev => ({ ...prev, page: 0 }));
  };

  // ── Status filter strip: horizontal scroll arrows ──
  // The strip stays horizontally scrollable (touch/trackpad still work); the
  // arrows are an extra affordance shown only when the tabs actually overflow.
  // `stages`/`statusCounts` change the strip's content width.
  const statusScroll = useHorizontalScroll<HTMLDivElement>([stages, statusCounts]);

  // Configured status labels/colours, keyed by value. Rebuilt whenever the pick
  // list changes, so added/renamed/removed statuses show up on the next load.
  const statusStyleMap = useMemo(() => buildStatusStyleMap(statusOptions), [statusOptions]);

  /**
   * A column holds a status when it is the field the pick list resolved on
   * (e.g. "lead_status"), or a conventionally named status column. Matching on
   * the resolved field is what makes this work for modules that don't store the
   * value under a literal `status` column.
   */
  const resolvedStatusField = (statusField || "").toLowerCase();
  const isStatusColumn = (field: string) => {
    const f = field.toLowerCase();
    return f === resolvedStatusField || f === "status" || f.endsWith("_status");
  };

  // Generate columns dynamically
  const columns: GridColDef[] = colFields.map(({ doctype, field, headerName, subFieldAlias }) => {
    const fieldKey = `${doctype}.${field}`;
    const tabFieldKey = `tab${doctype}.${field}`;
    const displayHeader = headerName && headerName !== "" ? headerName : formatHeaderName(field);
    const aliasKey = subFieldAlias || field;

    const baseDef = columnDefinitions[field] || {};
    const hasCustomValueGetter = typeof baseDef.valueGetter === "function";

    // Phosphor icon header injector
    const IconComponent = getHeaderIcon(field);
    // Header typography kept in sync with the shared DataGrid theme
    // (14px / 600 / uppercase / tracking, color via --text-header) for a consistent UI.
    const renderHeader = IconComponent ? () => (
      <div className="flex items-center gap-1.5 font-heading text-[14px]/[18px] font-semibold uppercase tracking-wide select-none text-[color:var(--text-header)]">
        <IconComponent size={13} weight="duotone" />
        {displayHeader}
      </div>
    ) : undefined;

    return {
      field: fieldKey,
      fieldvalue: `${field}`,
      headerName: displayHeader,
      width: 140,
      type: "string",
      renderHeader,
      ...baseDef,
      // Generic Avatar Renderer for primary names
      ...(baseDef.renderCell ? {} : (field === "lead_name" || field === "full_name" || field === "customer_name" || field === "name") ? {
        renderCell: (params) => {
          const nameVal = params.value;
          if (!nameVal) return <span className={isDark ? "text-[#52525B]" : "text-slate-300"}>—</span>;
          return (
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                style={{ backgroundColor: avatarColor(String(nameVal)) }}
                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-extrabold text-white flex-shrink-0"
              >
                {initials(String(nameVal))}
              </div>
              <p className={`m-0 font-sans text-[15px]/[20px] font-medium truncate ${isDark ? "text-white" : "text-slate-800"}`}>
                {String(nameVal)}
              </p>
            </div>
          );
        }
      } : {}),
      // Generic Email link styling
      ...(baseDef.renderCell ? {} : field.toLowerCase().includes("email") ? {
        renderCell: (params) => {
          const val = params.value;
          if (!val) return <span className={isDark ? "text-[#52525B]" : "text-slate-300"}>—</span>;
          return (
            <span className={`underline decoration-1 underline-offset-2 cursor-pointer text-[15px]/[20px] truncate transition-colors ${isDark ? "text-[#60A5FA] hover:text-[#93C5FD]" : "text-[#1D4ED8] hover:text-[#2563EB]"}`}>
              {String(val)}
            </span>
          );
        }
      } : {}),
      // Generic Mobile Phone icon rendering
      ...(baseDef.renderCell ? {} : (field.toLowerCase().includes("mobile") || field.toLowerCase().includes("phone")) ? {
        renderCell: (params) => {
          const val = params.value;
          if (!val) return <span className={isDark ? "text-[#52525B]" : "text-slate-300"}>—</span>;
          return (
            <div className="flex items-center gap-1.5 text-[15px]/[20px] font-mono truncate">
              <Phone size={11} weight="duotone" color="#94A3B8" />
              <span className={isDark ? "text-[#D4D4D8]" : "text-slate-600"}>{String(val)}</span>
            </div>
          );
        }
      } : {}),
      // Generic Probability rendering: progress bar + percentage
      ...(baseDef.renderCell ? {} : isProbabilityField(field) ? {
        renderCell: (params) => {
          const pct = toPercent(params.value);
          if (pct === null) return <span className={isDark ? "text-[#52525B]" : "text-slate-300"}>—</span>;
          // Not a number (unexpected content): show it as-is rather than hide it.
          if (Number.isNaN(pct)) return <span className="text-[13px]/[16px] truncate">{String(params.value)}</span>;
          return (
            <div className="flex items-center gap-1.5">
              <div className={`w-14 h-1 rounded-full overflow-hidden flex-shrink-0 ${isDark ? "bg-[#27272A]" : "bg-[#E3ECFC]"}`}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: isDark ? "#60A5FA" : "#0C2472" }}
                />
              </div>
              <span className={`text-[13px]/[16px] font-medium ${isDark ? "text-[#A1A1AA]" : "text-slate-500"}`}>
                {pct}%
              </span>
            </div>
          );
        }
      } : {}),
      // Generic Pill Status Badge rendering
      ...(baseDef.renderCell ? {} : isStatusColumn(field) ? {
        renderCell: (params) => {
          const val = params.value;
          if (!val) return <span className={isDark ? "text-[#52525B]" : "text-slate-300"}>—</span>;
          return <StatusBadge value={String(val)} statusMap={statusStyleMap} isDark={isDark} />;
        }
      } : {}),
      ...(hasCustomValueGetter
        ? {}
        : {
          valueGetter: (_value, row) => {
            const r = row ?? {};
            const direct =
              r[aliasKey] ??
              r[fieldKey] ??
              r[tabFieldKey] ??
              r[field] ??
              (displayHeader ? r[displayHeader] : undefined);
            if (direct !== undefined && direct !== null && direct !== "") {
              return direct;
            }
            const nested = r[doctype]?.[field] ?? r[`tab${doctype}`]?.[field];
            return nested !== undefined && nested !== null
              ? String(nested)
              : "";
          },
        }),
    };
  });

  // Add Actions column if handlers are provided
  if (handleRowDetail || handleRowEdit || handleRowRename || handleRowDelete || handleRowClone || handleRowLayoutPermission) {
    columns.push({
      field: "action",
      headerName: "Actions",
      sortable: false,
      filterable: false,
      width: 80,
      type: "actions",
      getActions: (params) => {
        const actions: React.ReactElement[] = [];
        // JOINed listing queries qualify column names, so the primary key may be
        // "<module>.name" / "tab<module>.name" instead of a plain "name".
        const rowName =
          params?.row?.name ??
          params?.row?.[`${module}.name`] ??
          params?.row?.[`tab${module}.name`];
        if (handleRowDetail) {
          actions.push(
            <GridActionsCellItem
              key="view"
              icon={<i className={classnames("ri-eye-line", "text-[18px]")} />}
              label="View"
              onClick={() => handleRowDetail?.(rowName)}
              showInMenu
              className="gap-2"
            />
          );
        }

        if (handleRowEdit && isEditPermission) {
          actions.push(
            <GridActionsCellItem
              key="edit"
              icon={<i className={classnames("ri-edit-box-line", "text-[18px]")} />}
              label="Edit Layout"
              onClick={() => handleRowEdit(params?.row)}
              showInMenu={false}
              className="gap-2"
            />
          );
        }

        if (handleRowRename) {
          actions.push(
            <GridActionsCellItem
              key="rename"
              icon={<i className={classnames("ri-edit-2-line", "text-[18px]")} />}
              label="Rename"
              onClick={() => handleRowRename(params?.row)}
              showInMenu
              className="gap-2"
            />
          );
        }

        if (handleRowClone) {
          actions.push(
            <GridActionsCellItem
              key="clone"
              icon={<i className={classnames("ri-file-copy-line", "text-[18px]")} />}
              label="Clone Layout"
              onClick={() => handleRowClone(params?.row)}
              showInMenu
              className="gap-2"
            />
          );
        }

        if (handleRowLayoutPermission) {
          actions.push(
            <GridActionsCellItem
              key="permission"
              icon={<i className={classnames("ri-shield-user-line", "text-[18px]")} />}
              label="Layout Permission"
              onClick={() => handleRowLayoutPermission(params?.row)}
              showInMenu
              className="gap-2"
            />
          );
        }

        const isCore = params?.row?.is_core ?? params?.row?.["SDL Layout.is_core"];
        if (handleRowDelete && isDeletePermission && !isCore) {
          actions.push(
            <GridActionsCellItem
              key="delete"
              icon={<i className={classnames("ri-delete-bin-7-line", "text-[18px]")} />}
              label="Delete"
              onClick={() => handleDeletePopup?.(rowName)}
              showInMenu
              className="gap-2"
            />
          );
        }
        return actions;
      },
    });
  }

  return (
    <div className="flex flex-col gap-4 font-sans">
      {/* ── Breadcrumbs ── */}
      <div className={`flex items-center gap-1.5 text-[13px] px-2 ${isDark ? "text-[#A1A1AA]" : "text-slate-400"}`}>
        <House size={14} weight="duotone" />
        <CaretRight size={10} weight="bold" />
        <span>Home</span>
        <CaretRight size={10} weight="bold" />
        <span className={`font-medium ${isDark ? "text-white" : "text-slate-600"}`}>{moduleHeading}</span>
      </div>

      {/* ── Header Title ── */}
      <div className="flex items-center justify-between flex-wrap gap-4 px-2">
        <div className="flex flex-col gap-1">
          {/* Title Row */}
          <div className="flex items-center gap-2.5">
            <h1 className={`font-sans text-[22px]/[28px] font-semibold tracking-tight m-0 ${isDark ? "text-[#F4F4F5]" : "text-slate-900"}`}>
              {moduleHeading}
            </h1>
            <span className={`text-[13px]/[16px] font-medium border px-2.5 py-1 rounded-full flex items-center ${isDark ? "bg-[#0A0A0A] border-[#27272A] text-[#E4E4E7]" : "bg-[#f9fbff] border-[#E3ECFC] text-slate-400"}`}>
              {rowCount} total
            </span>
            {summary && summaryTotal !== null && (
              <span
                className={`flex items-center gap-1 text-[13px]/[16px] font-medium border px-2.5 py-1 rounded-full ${
                  isDark
                    ? "text-[#34D399] bg-[#064E3B] border-[#047857]"
                    : "text-[#059669] bg-emerald-50 border-emerald-100"
                }`}
              >
                <TrendUp size={12} weight="duotone" />
                {summary.label}: {summary.format(summaryTotal)}
              </span>
            )}
          </div>
        </div>

        {/* View Switcher and Action Buttons */}
        <div className="flex items-center gap-2.5">
          {/* Segmented view mode controller */}
          {multipleViews && (
            <div className={`flex items-center rounded-xl p-0.5 gap-0.5 shadow-sm border ${isDark ? "bg-[#000000] border-[#27272A]" : "bg-white border-slate-100"}`}>
              {[
                { k: "list", Icon: List, label: "List" },
                { k: "grid", Icon: GridFour, label: "Grid" },
                { k: "kanban", Icon: Kanban, label: "Kanban" },
              ].filter((v) => allowedViews.includes(v.k as any)).map(({ k, Icon, label }) => {
                const active = effectiveView === k;
                return (
                  <button
                    key={k}
                    onClick={() => dispatch(setViewMode(k as any))}
                    className={`flex items-center gap-1.5 px-2.5 py-[7px] rounded-lg text-[14px]/[18px] font-medium transition-all ${active
                      ? isDark ? "bg-[#18181B] text-[#D4D4D8]" : "bg-[#f9fbff] text-[#1D4ED8]"
                      : isDark ? "text-[#0f0f0f] hover:bg-[#27272A] hover:text-[#D4D4D8]" : "bg-[#f9fbff] text-slate-400 hover:bg-[#E3ECFC]"
                      }`}
                  >
                    <Icon size={14} weight="duotone" />
                    {label}
                  </button>
                );
              })}
            </div>
          )}

          {/* New Item Button */}
          {isAddPermission === 1 && onAddNew && (
            <Button
              variant="contained"
              startIcon={<Plus size={16} weight="bold" />}
              onClick={onAddNew}
              className='p-2 px-4 '
              sx={{
                bgcolor: isDark ? "#27272A" : "#1D4ED8",
                color: isDark ? "#F4F4F5" : "white",
                borderRadius: "9px",
                textTransform: "none",
                fontWeight: 500,
                fontSize: "15px",
                px: 2,
                py: 0.85,
                boxShadow: isDark ? "none" : "0 1px 8px 0 #1D4ED833",
                "&:hover": {
                  bgcolor: isDark ? "#3F3F46" : "#2563EB",
                  boxShadow: isDark ? "none" : "0 2px 14px 0 #60A5FA55",
                },
                "&:active": {
                  bgcolor: isDark ? "#52525B" : "#0C2472",
                },
                "& .MuiButton-startIcon": { mr: 0.5 },
              }}
            >
              New {btnnewtitle || moduleHeading}
            </Button>
          )}
        </div>
      </div>

      {/* ── Status Tabs ── */}
      {stages && stages.length > 0 && (() => {
        // Arrows are filled like the Filters/Columns/Sort buttons rather than like a
        // tab, so they read as controls against the strip. 36px keeps them a
        // comfortable target while still sitting level with the ~34px tabs.
        const arrowBase =
          "flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA]";
        const arrowTheme = isDark
          ? "bg-[#18181B] text-[#E4E4E7] border-[#3F3F46] hover:bg-[#27272A] hover:text-white"
          : "bg-[#E3ECFC] text-[#0C2472] border-[#CBDCF9] hover:bg-[#DCE6FB] hover:border-[#1D4ED8]";

        const arrow = (direction: -1 | 1, disabled: boolean) => (
          <button
            type="button"
            onClick={() => statusScroll.scrollByDirection(direction)}
            disabled={disabled}
            aria-label={direction === -1 ? "Scroll status filters left" : "Scroll status filters right"}
            className={`${arrowBase} ${arrowTheme} ${disabled ? "opacity-40 pointer-events-none" : ""}`}
          >
            {/* CaretRight mirrored for the left arrow, so both carets stay visually identical. */}
            <CaretRight size={16} weight="bold" className={direction === -1 ? "rotate-180" : undefined} />
          </button>
        );

        return (
        <div className="flex items-center gap-2 pb-1 px-2">
          {/* Arrows appear only when the tabs overflow, so narrow status sets look unchanged. */}
          {statusScroll.overflowing && arrow(-1, statusScroll.atStart)}
          <div ref={statusScroll.ref} className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide flex-1 min-w-0">
          <button
            onClick={() => handleStatusTabChange("All")}
            className={`flex items-center gap-1.5 px-3 py-[7px] rounded-xl text-[14px]/[18px] font-medium whitespace-nowrap transition-all border ${currentStatusTab === "All"
              ? isDark ? "bg-[#18181B] text-white shadow-sm shadow-[#27272A]/10 border-[#27272A]" : "bg-[#1D4ED8] text-white shadow-sm shadow-[#1D4ED8]/25 border-[#1D4ED8]"
              : isDark ? "bg-[#0A0A0A] text-[#A1A1AA] border-[#27272A] hover:bg-[#27272A] hover:text-[#FFFFFF]" : "bg-[#f9fbff] text-[#0C2472] border-[#E3ECFC] hover:bg-[#E3ECFC]"
              }`}
          >
            All
            <span className={`text-[13px]/[16px] font-medium px-1.5 py-0.5 rounded-full leading-none ${currentStatusTab === "All" ? "bg-white/20 text-white" : "bg-[#1D4ED8]/10 text-[#0C2472]"
              }`}>
              {statusCounts ? (statusCounts["All"] ?? 0) : rowCount}
            </span>
          </button>
          {stages.map((stage) => {
            const active = currentStatusTab === stage.label;
            const cnt = statusCounts ? (statusCounts[stage.label] ?? 0) : (active ? rowCount : 0);
            return (
              <button
                key={stage.label}
                onClick={() => handleStatusTabChange(stage.label)}
                className={`flex items-center gap-1.5 px-3 py-[7px] rounded-xl text-[14px]/[18px] font-medium whitespace-nowrap transition-all border ${active
                  ? isDark ? "bg-[#18181B] text-white shadow-sm shadow-[#27272A]/10 border-[#27272A]" : "bg-[#1D4ED8] text-white shadow-sm shadow-[#1D4ED8]/25 border-[#1D4ED8]"
                  : isDark ? "bg-[#0A0A0A] text-[#A1A1AA] border-[#27272A] hover:bg-[#27272A] hover:text-[#FFFFFF]" : "bg-[#f9fbff] text-[#0C2472] border-[#E3ECFC] hover:bg-[#E3ECFC]"
                  }`}
              >
                {stage.label}
                <span className={`text-[13px]/[16px] font-medium px-1.5 py-0.5 rounded-full leading-none ${active ? "bg-white/20 text-white" : "bg-[#1D4ED8]/10 text-[#0C2472]"
                  }`}>
                  {cnt}
                </span>
              </button>
            );
          })}
          </div>
          {statusScroll.overflowing && arrow(1, statusScroll.atEnd)}
        </div>
        );
      })()}

      {/* ── Action Toolbar (Search + Popover Buttons) ── */}
      <div className="flex items-center gap-2.5 flex-wrap px-2 mb-3">
        {/* Search Input */}
        {/* Grows into the free space left by the action buttons; `min-w` keeps it
            usable once the toolbar wraps on narrow viewports. */}
        <div className={`flex items-center gap-2 border rounded-xl px-3 py-1.5 min-h-[44px] flex-1 min-w-[240px] focus-within:border-[#60A5FA] focus-within:border-2 focus-within:shadow-[0_0_0_2px_#60A5FA] transition-all ${isDark ? "bg-[#0A0A0A] border-[#27272A]" : "bg-[#f9fbff] border-[#E3ECFC]"}`}>
          <MagnifyingGlass size={15} color="#94A3B8" weight="duotone" />
          <InputBase
            placeholder="Search by name, company, email…"
            value={searchVal}
            onChange={e => handleSearchChange(e.target.value)}
            sx={{
              flex: 1,
              fontSize: "14px",
              color: isDark ? "#D4D4D8" : "#334155",
              "& input::placeholder": { color: "#94A3B8", opacity: 1 },
            }}
          />
          {searchVal && (
            <button onClick={() => handleSearchChange("")} className="text-slate-300 hover:text-slate-500 text-[15px]">✕</button>
          )}
        </div>

        {/* Filters Button */}
        <Button
          variant="outlined"
          size="small"
          startIcon={
            activeFilters.length > 0 ? (
              <Badge badgeContent={activeFilters.length} color="primary" sx={{ "& .MuiBadge-badge": { fontSize: "10px", height: 14, minWidth: 14 } }}>
                <FunnelSimple size={16} weight="duotone" />
              </Badge>
            ) : (
              <FunnelSimple size={16} weight="duotone" />
            )
          }
          onClick={e => setFiltersAnchor(e.currentTarget)}
          sx={{
            borderColor: activeFilters.length > 0 ? "#1D4ED8" : isDark ? "#27272A" : "#E3ECFC",
            color: activeFilters.length > 0 ? "#fff" : isDark ? "#E4E4E7" : "#0C2472",
            bgcolor: activeFilters.length > 0 ? "#1D4ED8" : isDark ? "#0F0F0F" : "#E3ECFC",
            borderRadius: "12px",
            textTransform: "none",
            fontWeight: 500,
            fontSize: "14px",
            px: 2.25,
            py: 1,
            // Shared control height across the toolbar (search / buttons / count
            // chip) so the row stays aligned, and a comfortable 44px hit target.
            minHeight: 44,
            "&:hover": {
              borderColor: activeFilters.length > 0 ? "#1640B8" : "#1D4ED8",
              color: activeFilters.length > 0 ? "#fff" : "#0C2472",
              bgcolor: activeFilters.length > 0 ? "#1640B8" : isDark ? "#0A0A0A" : "#DCE6FB",
            },
          }}
        >
          Filters{activeFilters.length > 0 ? ` (${activeFilters.length})` : ""}
        </Button>

        {/* Columns Button */}
        <Button
          variant="outlined"
          size="small"
          startIcon={<Columns size={16} weight="duotone" />}
          onClick={() => setColumnsDrawerOpen(true)}
          sx={{
            borderColor: isDark ? "#27272A" : "#E3ECFC",
            color: isDark ? "#E4E4E7" : "#0C2472",
            bgcolor: isDark ? "#0F0F0F" : "#E3ECFC",
            borderRadius: "12px",
            textTransform: "none",
            fontWeight: 500,
            fontSize: "14px",
            px: 2.25,
            py: 1,
            // Shared control height across the toolbar (search / buttons / count
            // chip) so the row stays aligned, and a comfortable 44px hit target.
            minHeight: 44,
            "&:hover": {
              borderColor: "#1D4ED8",
              color: isDark ? "#E4E4E7" : "#0C2472",
              bgcolor: isDark ? "#0A0A0A" : "#DCE6FB",
            },
          }}
        >
          Columns
        </Button>

        {/* Sort Button */}
        <Button
          variant="outlined"
          size="small"
          startIcon={
            activeSorts.length > 0 ? (
              <Badge badgeContent={activeSorts.length} color="primary" sx={{ "& .MuiBadge-badge": { fontSize: "10px", height: 14, minWidth: 14 } }}>
                <SortAscending size={16} weight="duotone" />
              </Badge>
            ) : (
              <SortAscending size={16} weight="duotone" />
            )
          }
          endIcon={<CaretDown size={12} weight="duotone" />}
          onClick={e => setSortAnchor(e.currentTarget)}
          sx={{
            borderColor: isDark ? "#27272A" : "#E3ECFC",
            color: isDark ? "#E4E4E7" : "#0C2472",
            bgcolor: isDark ? "#0F0F0F" : "#E3ECFC",
            borderRadius: "12px",
            textTransform: "none",
            fontWeight: 500,
            fontSize: "14px",
            px: 2.25,
            py: 1,
            // Shared control height across the toolbar (search / buttons / count
            // chip) so the row stays aligned, and a comfortable 44px hit target.
            minHeight: 44,
            "&:hover": {
              borderColor: "#1D4ED8",
              color: isDark ? "#E4E4E7" : "#0C2472",
              bgcolor: isDark ? "#0A0A0A" : "#DCE6FB",
            },
          }}
        >
          Sort{activeSorts.length > 0 ? ` (${activeSorts.length})` : ""}
        </Button>

        {/* Record count indicator — chip styling mirrors the search field and
            action buttons so the toolbar reads as one row of controls. */}
        <div className={`ml-auto flex-shrink-0 inline-flex items-center whitespace-nowrap border rounded-xl px-3 min-h-[32px] text-[13px]/[16px] ${isDark ? "bg-[#0F0F0F] border-[#27272A] text-[#71717A]" : "bg-[#f9fbff] border-[#E3ECFC] text-slate-400"}`}>
          {effectiveView === "list" ? (
            `${paginationModel.page * paginationModel.pageSize + 1} – ${Math.min((paginationModel.page + 1) * paginationModel.pageSize, rowCount)} of ${rowCount} records`
          ) : (
            `1 – ${data.length} of ${rowCount} records`
          )}
        </div>
      </div>

      {/* ── View Rendering ── */}
      {effectiveView === "list" && (
        <SDLDataGrid
          rows={data}
          columns={columns}
          rowCount={Number(rowCount)}
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={handlePaginationChange}
          sortingMode="server"
          onSortModelChange={handleSortModelChange}
          filterMode="server"
          filterModel={filterModel}
          pageSizeOptions={pageSizeOptions}
          loading={loading}
          columnVisibilityModel={columnVisibilityModel}
          onColumnVisibilityModelChange={(newModel) => setColumnVisibilityModel(newModel)}
          customToolbar={() => null}
          checkboxSelection={checkboxSelection}
          gridHeight={gridHeight}
        />
      )}

      {effectiveView === "grid" && (
        GridViewComponent
          ? <GridViewComponent rows={data} statusField={statusField || "status"} statusOptions={statusOptions} {...(viewProps || {})} />
          : <LeadGridView leads={data} statusField={statusField || "status"} statusOptions={statusOptions} />
      )}

      {effectiveView === "kanban" && (() => {
        const KanbanView = KanbanViewComponent ?? LeadKanbanView;
        return (
          <KanbanView
            leads={data}
            onUpdateLeadStatus={handleUpdateLeadStatus}
            onAddNewLead={onAddNew}
            // Prefer the raw pick list options: `stages[].bgColor` has already had a
            // default substituted, which would hide "no colour configured" from the
            // shared resolver and paint those statuses differently than the list does.
            statuses={statusOptions ?? stages?.map((s) => ({ value: s.label, label: s.label, color: s.bgColor }))}
            statusField={statusField || "status"}
            {...(viewProps || {})}
          />
        );
      })()}

      {/* Confirm deletion dialog */}
      <ConfirmDialog
        open={dialogOpen}
        title="Delete Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
        onClose={() => setDialogOpen(false)}
        onConfirm={handleDeleteClick}
      />

      {/* Reusable Filter Popover */}
      <FiltersDrawer
        anchor={filterAnchor}
        onClose={() => setFiltersAnchor(null)}
        filters={activeFilters}
        onChange={setActiveFilters}
        columns={colFields.map(f => ({
          value: `${f.doctype}.${f.field}`,
          label: `${f.doctype} · ${f.headerName || formatHeaderName(f.field)}`,
        }))}
      />

      {/* Reusable Column Drawer */}
      <ColumnsDrawer
        open={columnsDrawerOpen}
        onClose={() => setColumnsDrawerOpen(false)}
        selected={visibleCols}
        onChange={setVisibleCols}
        columns={colFields}
        defaultVisibleFields={colFields.filter(f => f.hidden?.toLowerCase() !== "true").map(f => `${f.doctype}.${f.field}`)}
      />

      {/* Reusable Sort Popover */}
      <SortPopover
        anchor={sortAnchor}
        onClose={() => setSortAnchor(null)}
        sorts={activeSorts}
        onChange={setActiveSorts}
        columns={colFields.map(f => ({
          value: `${f.doctype}.${f.field}`,
          label: f.headerName || formatHeaderName(f.field),
        }))}
      />
    </div>
  );
};

export default RawDynamicDataGrid;
