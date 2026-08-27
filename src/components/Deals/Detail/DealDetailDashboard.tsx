"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Button,
  Tooltip,
  IconButton,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  InputBase,
  Box,
  CircularProgress,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

// Phosphor Duotone Icons
import {
  House,
  CaretRight,
  PencilSimple,
  DotsThreeVertical,
  Note,
  ClipboardText,
  Paperclip,
  ClockCounterClockwise,
  ThumbsUp,
  ThumbsDown,
  Plus,
  Trash,
  Trophy,
  Handshake,
  Tag,
  CurrencyCircleDollar,
  ChartLineUp,
  CalendarBlank,
  Check,
  DownloadSimple,
  UserPlus,
} from "@phosphor-icons/react";

import { readAccessTokenDataParsed } from "@/utils/accessTokenDataStorage";
import {
  getDocument,
  updateFieldCustomDocument,
  postNote,
  deleteResource,
  updateResource,
} from "@/services/api/common-erpnext-api/create-edit-api";
import {
  fetchNotesWithOwner,
  fetchTimelineComments,
  fetchTasksWithOwner,
  Task,
} from "@/services/api/common-erpnext-api/create-update-custom-api";
import { getLayoutList, getFormFields, getRelatedList } from "@/services/api/general_apis/layout-api";
import { fetchRawDataGridListing } from "@/services/api/common-erpnext-api/listing-api-get";
import {
  fetchModuleStageOptions,
  StageProbabilityOption,
} from "@/services/api/general_apis/component-picklist-api";
import AddEditTaskDrawer from "@/components/Tasks/CreateEdit";
import AddEditDealDrawer from "@/components/Deals/CreateEdit";
import AttachmentsSection from "@/components/Common/Upload/AttachmentsSection";
import StageHistory from "@/components/Common/RelatedList/StageHistory";
import DynamicRelatedSection from "@/components/Common/RelatedList/DynamicRelatedSection";
import { getRelatedListKind, getRelatedListMeta, isDedicatedRelatedList } from "@/components/Common/RelatedList/relatedListMeta";
import { useHorizontalScroll } from "@/hooks/GeneralHooks/useHorizontalScroll";
import { showToast } from "@/components/ToastNotificationNew";
import ConfirmDialog from "@/components/UI/ConfirmDialog";

const inr = (v: any) => {
  const n = Number(v);
  if (!v || Number.isNaN(n)) return "";
  return `₹${n.toLocaleString("en-IN")}`;
};

// ─────────────────────────────────────────────
// Sub-components (theme-aware)
// ─────────────────────────────────────────────
function SectionCard({ icon: Icon, title, children, id, action }: { icon: React.ElementType; title: string; children: React.ReactNode; id?: string; action?: React.ReactNode }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  return (
    <div id={id} className={`rounded-2xl border shadow-sm overflow-hidden ${isDark ? "bg-[#1C1C1E] border-[#27272A]" : "bg-[#f9fbff] border-[#E3ECFC]"}`}>
      <div className={`flex items-center gap-2.5 px-5 py-3.5 border-b ${isDark ? "border-[#27272A]" : "border-[#EFF6FF]"}`}>
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isDark ? "bg-[#27272A]" : "bg-[#EFF6FF]"}`}>
          <Icon size={13} color={isDark ? "#9CA3AF" : "#1D4ED8"} weight="duotone" />
        </div>
        <p className={`font-heading text-[12px] font-bold uppercase tracking-[0.12em] flex-1 ${isDark ? "text-[#D4D4D8]" : "text-[#1D4ED8]"}`}>{title}</p>
        {action}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function InfoGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-10 gap-y-0">{children}</div>;
}

function KV({ label, value, blue }: { label: string; value?: string | number | null; blue?: boolean }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const display = value !== undefined && value !== null && String(value).trim() !== "" && value !== 0 ? String(value) : "—";
  const isEmpty = display === "—";
  return (
    <div className="py-2 border-b border-[#EFF6FF] dark:border-[#27272A] last:border-0">
      <p className={`font-heading text-[11.5px] font-semibold uppercase tracking-wider mb-0.5 ${isDark ? "text-[#ABABAD]" : "text-slate-400"}`}>{label}</p>
      <p className={`text-[14px] font-medium ${blue ? "text-[#1D4ED8] dark:text-[#60A5FA]" : isDark ? (isEmpty ? "text-[#3F3F46] italic" : "text-[#D4D4D8]") : (isEmpty ? "text-slate-300 italic" : "text-slate-800")}`}>{display}</p>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function DealDetailDashboard({ name }: { name: string }) {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // Data state
  const [loading, setLoading] = useState(true);
  const [recordData, setRecordData] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stageOptions, setStageOptions] = useState<StageProbabilityOption[]>([]);
  const [stageField, setStageField] = useState<string>("status");
  const [layoutId, setLayoutId] = useState<string>("");

  // Drives the stage strip's left/right navigation arrows. Must stay above the
  // `loading` / `!recordData` early returns below — a hook skipped on one render
  // and called on the next changes the hook order.
  const stageScroll = useHorizontalScroll<HTMLDivElement>([stageOptions]);

  // UI state
  const [activeTab, setActiveTab] = useState<"overview" | "timeline">("overview");
  const [editOpen, setEditOpen] = useState(false);
  const [moreAnchor, setMoreAnchor] = useState<null | HTMLElement>(null);
  const [noteText, setNoteText] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskDrawerOpen, setTaskDrawerOpen] = useState(false);
  const [attachmentCount, setAttachmentCount] = useState(0);
  const [stageHistoryCount, setStageHistoryCount] = useState(0);
  // Config-driven related-list sections (beyond Stage History / Tasks) + their counts.
  const [relatedLists, setRelatedLists] = useState<any[]>([]);
  const [relatedCounts, setRelatedCounts] = useState<Record<string, number>>({});

  // Inline note editing + row-level delete
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState("");
  const [editingTask, setEditingTask] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ doctype: string; id: string; label: string; refetch: () => Promise<void> } | null>(null);

  const [userToken] = useState<any>(() => {
    try {
      return readAccessTokenDataParsed() || {};
    } catch {
      return {};
    }
  });

  // ── Data fetchers ──
  const fetchRecord = useCallback(async () => {
    if (!userToken?.access_token || !name) return;
    try {
      const details = await getDocument("CRM Deal", name, userToken.access_token);
      if (details) setRecordData(details);
    } catch (err) {
      console.error("Failed to load Deal details:", err);
    }
  }, [name, userToken?.access_token]);

  const fetchNotes = useCallback(async () => {
    if (!userToken?.access_token || !name) return;
    try {
      const notesRes = await fetchNotesWithOwner("CRM Deal", name, userToken.access_token);
      setNotes(Array.isArray(notesRes) ? notesRes : notesRes?.data || []);
    } catch (err) {
      console.error("Failed to load Deal notes:", err);
    }
  }, [name, userToken?.access_token]);

  const fetchTasks = useCallback(async () => {
    if (!userToken?.access_token || !name) return;
    try {
      const res = await fetchTasksWithOwner("CRM Deal", name, userToken.access_token, 100, 0);
      setTasks(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load Deal tasks:", err);
    }
  }, [name, userToken?.access_token]);

  const fetchComments = useCallback(async () => {
    if (!userToken?.access_token || !name) return;
    try {
      const commentsRes = await fetchTimelineComments("CRM Deal", name, userToken.access_token);
      setComments(Array.isArray(commentsRes) ? commentsRes : commentsRes?.data || []);
    } catch (err) {
      console.error("Failed to load Deal comments:", err);
    }
  }, [name, userToken?.access_token]);

  // Load all data
  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      await Promise.all([fetchRecord(), fetchNotes(), fetchComments(), fetchTasks()]);
      setLoading(false);
    };
    loadAllData();
  }, [fetchRecord, fetchNotes, fetchComments, fetchTasks]);

  // Resolve the deal layout (needed by the Stage History related list).
  useEffect(() => {
    const resolveLayout = async () => {
      if (!userToken?.access_token) return;
      const recordLayout = recordData?.layout_id;
      if (recordLayout != null && String(recordLayout).trim() !== "" && recordLayout !== 0) {
        setLayoutId(String(recordLayout));
        return;
      }
      try {
        const layouts: any[] = await getLayoutList("Deals", userToken.access_token, userToken.role_profile);
        if (Array.isArray(layouts) && layouts.length > 0) setLayoutId(String(layouts[0].value));
      } catch (err) {
        console.error("Failed to resolve Deal layout:", err);
      }
    };
    resolveLayout();
  }, [userToken?.access_token, userToken?.role_profile, recordData?.layout_id]);

  // Related-list sections from the Settings "Detail View" configuration.
  useEffect(() => {
    const load = async () => {
      if (!userToken?.access_token || !layoutId) return;
      try {
        const res = await getRelatedList("Deals", layoutId, userToken.access_token);
        setRelatedLists(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error("Failed to load Deal related lists:", err);
      }
    };
    load();
  }, [layoutId, userToken?.access_token]);

  const handleRelatedCount = useCallback((id: string, count: number) => {
    setRelatedCounts((prev) => (prev[id] === count ? prev : { ...prev, [id]: count }));
  }, []);

  // Tasks (dedicated inline section) and Stage History (dedicated StageHistory
  // component) are rendered separately, so exclude them from the generic sections.
  const sectionRelatedLists = relatedLists.filter((rl) => {
    const kind = getRelatedListKind(rl.main_doctype_name, rl.label);
    if (kind === "task") return false;
    // Notes / Attachments render as dedicated cards above — skip the config
    // copies so they are not shown a second time.
    if (isDedicatedRelatedList(rl.main_doctype_name, rl.label)) return false;
    const isStageHistory =
      String(rl.main_doctype_name || "") === "Stage Probability History" ||
      String(rl.label || "").toLowerCase().includes("stage history");
    return !isStageHistory;
  });

  // Deal stages loaded dynamically from the backend Stage Probability API.
  // The stage field is not always literally "status" — resolve the actual
  // `type: "stage"` field from the layout (as the Deals listing does) and pass
  // it plus fallbacks so the pipeline reliably gets its options.
  useEffect(() => {
    const loadStages = async () => {
      if (!userToken?.access_token) return;

      let resolvedField = "status";
      try {
        const response: any = await getFormFields("Deals", userToken.access_token, userToken.role_profile, "");
        const fieldList: any[] = Array.isArray(response?.fields)
          ? response.fields
          : Array.isArray(response)
            ? response
            : [];
        const stageFieldMeta = fieldList.find(
          (f: any) => String(f?.type || f?.fieldtype || "").toLowerCase().trim() === "stage"
        );
        resolvedField = String(stageFieldMeta?.fieldname || stageFieldMeta?.name || "").trim() || "status";
      } catch (err) {
        console.error("Failed to resolve Deal stage field:", err);
      }

      const candidates = Array.from(new Set([resolvedField, "status", "stage", "deal_stage"].filter(Boolean)));
      const result = await fetchModuleStageOptions("Deals", candidates, userToken.access_token, userToken.role_profile);
      setStageOptions(result.options || []);
      setStageField(result.field || resolvedField || "status");
    };
    loadStages();
  }, [userToken?.access_token, userToken?.role_profile]);

  // Stage History count for the Related List badge (Stage Probability History rows
  // whose parent is this deal). Mirrors the count logic used in ViewDetailsForm.
  useEffect(() => {
    let cancelled = false;
    const loadStageHistoryCount = async () => {
      if (!userToken?.access_token || !name) return;
      try {
        const id = String(name).replace(/'/g, "\\'");
        const res = await fetchRawDataGridListing(
          { page: 0, pageSize: 1 },
          userToken.access_token,
          [{ doctype: "Stage Probability History", field: "name", hidden: "True" }],
          "Stage Probability History",
          [],
          "",
          "",
          [],
          "",
          ` AND parent = '${id}'`,
          "",
          "",
          "",
          "True"
        );
        if (!cancelled) setStageHistoryCount(res.totalCount || 0);
      } catch {
        if (!cancelled) setStageHistoryCount(0);
      }
    };
    loadStageHistoryCount();
    return () => {
      cancelled = true;
    };
  }, [userToken?.access_token, name, recordData?.status]);

  // ── Actions ──
  const handleUpdateStatus = async (newStatus: string) => {
    if (!userToken?.access_token || !name) return;
    try {
      const res = await updateFieldCustomDocument("CRM Deal", name, { [stageField]: newStatus }, userToken.access_token);
      if (res?.success) {
        showToast(`Stage updated to "${newStatus}"`, "success");
        await Promise.all([fetchRecord(), fetchComments()]);
      } else {
        showToast(res?.message || "Failed to update stage", "warning");
      }
    } catch (err) {
      showToast("An error occurred during stage update", "error");
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim() || !userToken?.access_token) return;
    try {
      const cleanText = noteText.trim();
      await postNote({
        doctype: "FCRM Note",
        reference_doctype: "CRM Deal",
        reference_docname: name,
        content: cleanText,
        title: cleanText.replace(/<[^>]*>?/gm, "").substring(0, 80) || "Note",
        owner: userToken?.full_name || userToken?.username || "System",
        modified_by: userToken?.full_name || userToken?.username || "System",
      }, userToken.access_token);
      setNoteText("");
      showToast("Note saved successfully", "success");
      await fetchNotes();
    } catch (err) {
      showToast("Failed to save note", "error");
    }
  };

  const handleEditTaskStart = async (task: Task) => {
    if (!userToken?.access_token || !task?.name) {
      setEditingTask(task);
      return;
    }
    try {
      const full = await getDocument("CRM Task", task.name, userToken.access_token);
      if (full) {
        const { modified, creation, modified_by, ...rest } = full;
        setEditingTask(rest);
      } else {
        setEditingTask(task);
      }
    } catch (err) {
      console.error("Failed to load Task details:", err);
      setEditingTask(task);
    }
  };

  const handleEditNoteStart = (n: any) => {
    setEditingNoteId(n.name);
    setEditingNoteText((n.content || "").replace(/<[^>]*>?/gm, ""));
  };

  const handleEditNoteSave = async (n: any) => {
    const cleanText = editingNoteText.trim();
    if (!cleanText || !userToken?.access_token) return;
    try {
      const res = await updateResource("FCRM Note", n.name, { content: cleanText, title: cleanText.substring(0, 80) || "Note" }, userToken.access_token);
      if (res?.success) {
        showToast("Note updated successfully", "success");
        setEditingNoteId(null);
        setEditingNoteText("");
        await fetchNotes();
      } else {
        showToast(res?.message || "Failed to update note", "warning");
      }
    } catch (err) {
      showToast("Failed to update note", "error");
    }
  };

  const handleDeleteTarget = async () => {
    if (!deleteTarget || !userToken?.access_token) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    try {
      await deleteResource(target.doctype, target.id, userToken.access_token);
      showToast(`${target.label} deleted successfully`, "success");
      await target.refetch();
    } catch (err) {
      showToast(`Failed to delete ${target.label.toLowerCase()}`, "error");
    }
  };

  const handleDeleteDeal = async () => {
    if (!userToken?.access_token || !name) return;
    setDeleteDialogOpen(false);
    try {
      await deleteResource("CRM Deal", name, userToken.access_token);
      showToast("Deal deleted successfully", "success");
      router.push("/deals");
    } catch (err) {
      showToast("Failed to delete deal", "error");
    }
  };

  const handleRelatedClick = (label: string) => {
    setActiveTab("overview");
    setTimeout(() => {
      const id = `section-${label.toLowerCase().replace(/\s/g, "-")}`;
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch {
      return dateStr;
    }
  };

  const formatShortDate = (dateStr: string) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
  };

  // Time-only label (e.g. "02:10 pm") for the date-grouped History timeline.
  const formatTime = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }).toLowerCase();
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh", backgroundColor: "var(--bg-page)" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!recordData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-slate-500 font-semibold">Deal not found</p>
        <Link href="/deals" className="text-[#1D4ED8] text-[15px] font-bold hover:underline">← Back to Deals</Link>
      </div>
    );
  }

  // ── Derived fields ──
  const dealName = recordData.deal_name || recordData.organization || name;
  const account = recordData.organization || recordData.organization_name || "";
  const dealOwner = recordData.deal_owner || recordData.owner || "";
  const dealEmail = recordData.email || recordData.email_id || "";
  const contactName = recordData.lead_name || [recordData.first_name, recordData.last_name].filter(Boolean).join(" ");
  const amountRaw = recordData.deal_value ?? recordData.annual_revenue;  
  const expectedRaw = recordData.expected_revenue ?? recordData.expected_deal_value;
  const closeDate = recordData.close_date || recordData.closing_date || "";

  const currentStatus: string = recordData[stageField] || recordData.status || stageOptions[0]?.value || "";
  const pipelineIdx = stageOptions.findIndex((o) => o.value === currentStatus);
  const currentOption = stageOptions.find((o) => o.value === currentStatus);
  const cfgDot = currentOption?.color || "#1D4ED8";

  const wonStatus = stageOptions.find((o) => /won/i.test(`${o.value} ${o.label || ""}`));
  const lostStatus = stageOptions.find((o) => /lost/i.test(`${o.value} ${o.label || ""}`));

  const quickStats = [
    { label: "Amount", value: inr(amountRaw) || "—", icon: CurrencyCircleDollar, fill: isDark ? "rgba(96,165,250,0.08)" : "#EFF6FF", deep: isDark ? "#60A5FA" : "#1D4ED8" },
    { label: "Probability", value: recordData.probability != null && recordData.probability !== "" ? `${recordData.probability}%` : "—", icon: ChartLineUp, fill: isDark ? "rgba(52,211,153,0.08)" : "#F0FDF4", deep: isDark ? "#34D399" : "#059669" },
    { label: "Expected Revenue", value: inr(expectedRaw) || "—", icon: CurrencyCircleDollar, fill: isDark ? "rgba(251,191,36,0.08)" : "#FFFBEB", deep: isDark ? "#FBBF24" : "#D97706" },
    { label: "Closing Date", value: closeDate ? formatShortDate(closeDate) : "—", icon: CalendarBlank, fill: isDark ? "rgba(244,114,182,0.08)" : "#FDF2F8", deep: isDark ? "#F472B6" : "#DB2777" },
  ];

  const relatedItems = [
    { label: "Notes", icon: Note, count: notes.length, color: "#8B5CF6" },
    { label: "Attachments", icon: Paperclip, count: attachmentCount, color: "#F59E0B" },
    { label: "Stage History", icon: ClockCounterClockwise, count: stageHistoryCount, color: "#64748B" },
    { label: "Tasks", icon: ClipboardText, count: tasks.length, color: "#10B981" },
    ...sectionRelatedLists.map((rl) => ({
      label: rl.label || rl.main_doctype_name,
      icon: getRelatedListMeta(rl.main_doctype_name, rl.label).icon,
      count: relatedCounts[String(rl.id || rl.name || rl.label)] || 0,
      color: "#64748B",
    })),
  ];

  // Timeline activity feed (creation event + comments), newest first.
  const activityFeed = [
    { icon: UserPlus, color: "#2F6FED", bg: isDark ? "#27272A" : "#EFF6FF", text: `Deal created by ${dealOwner || "System"}`, time: recordData.creation, by: dealOwner || recordData.owner || "System" },
    ...comments.map((c) => ({
      icon: Note,
      color: "#7C3AED",
      bg: isDark ? "#27272A" : "#EFF6FF",
      text: c.comment_type === "Comment" ? `Comment: ${c.content?.replace(/<[^>]*>?/gm, "")}` : `Note added`,
      time: c.creation,
      by: c.owner_name || c.owner || c.comment_by || dealOwner || "System",
    })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  const RelatedListPanel = () => (
    <div className="space-y-4">
      <div className={`rounded-2xl border shadow-sm overflow-hidden w-full ${isDark ? "bg-[#1C1C1E] border-[#27272A]" : "bg-[#f9fbff] border-[#E3ECFC]"}`}>
        <div className={`px-4 py-3.5 border-b ${isDark ? "border-[#27272A]" : "border-[#EFF6FF]"}`}>
          <p className={`font-heading text-[12px] font-bold uppercase tracking-wider ${isDark ? "text-[#ABABAD]" : "text-slate-500"}`}>Related List</p>
        </div>
        <div className="p-2 space-y-0.5">
          {relatedItems.map(({ label, icon: Icon, count, color }) => (
            <button key={label} onClick={() => handleRelatedClick(label)}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl group transition-colors ${isDark ? "hover:bg-[#27272A]" : "hover:bg-[#EFF6FF]"}`}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: color + "20" }}>
                <Icon size={14} color={color} weight="duotone" />
              </div>
              <span className={`flex-1 min-w-0 truncate text-left text-[14px] font-medium ${isDark ? "text-[#D4D4D8]" : "text-slate-700"}`}>{label}</span>
              {count > 0 && (
                <span className="text-[12px] font-bold bg-[#E3ECFC] text-[#1D4ED8] px-1.5 py-0.5 rounded-full">{count}</span>
              )}
              <CaretRight size={14} color="#E2E8F0" weight="duotone" />
            </button>
          ))}
        </div>
      </div>

      {/* Ownership panel */}
      <div className={`rounded-2xl border shadow-sm p-4 space-y-3 ${isDark ? "bg-[#1C1C1E] border-[#27272A]" : "bg-[#f9fbff] border-[#E3ECFC]"}`}>
        <p className={`font-heading text-[12px] font-bold uppercase tracking-wider ${isDark ? "text-[#ABABAD]" : "text-slate-500"}`}>Ownership</p>
        <div className="space-y-2">
          <div className="flex justify-between text-[12px]">
            <span className={`font-medium ${isDark ? "text-[#ABABAD]" : "text-slate-400"}`}>Owner</span>
            <span className={`font-semibold ${isDark ? "text-[#D4D4D8]" : "text-slate-700"}`}>{dealOwner || "—"}</span>
          </div>
          <div className="flex justify-between text-[12px]">
            <span className={`font-medium ${isDark ? "text-[#ABABAD]" : "text-slate-400"}`}>Created</span>
            <span className={`font-semibold ${isDark ? "text-[#D4D4D8]" : "text-slate-700"}`}>{formatDate(recordData.creation)}</span>
          </div>
          <div className="flex justify-between text-[12px]">
            <span className={`font-medium ${isDark ? "text-[#ABABAD]" : "text-slate-400"}`}>Modified</span>
            <span className={`font-semibold ${isDark ? "text-[#D4D4D8]" : "text-slate-700"}`}>{formatDate(recordData.modified)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen !bg-transparent font-sans ${isDark ? "text-[#F4F4F5]" : "text-slate-800"}`}>
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Deal"
        message="Are you sure you want to delete this deal? This action cannot be undone."
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteDeal}
      />

      <div className="max-w-[1600px] mx-auto space-y-4">
        {/* ── Breadcrumb ── */}
        <div className={`flex items-center gap-1.5 text-[13.5px] ${isDark ? "text-[#ABABAD]" : "text-slate-400"}`}>
          <House size={16} weight="duotone" />
          <CaretRight size={12} weight="duotone" />
          <Link href="/deals" className="hover:text-[#1D4ED8] transition-colors font-medium">Deals</Link>
          <CaretRight size={12} weight="duotone" />
          <span className="text-[#1D4ED8] font-semibold truncate max-w-[240px]">{dealName}</span>
        </div>

        {/* ── Header card ── */}
        <div className={`rounded-2xl border shadow-sm px-5 py-4 ${isDark ? "bg-[#1C1C1E] border-[#27272A]" : "bg-[#f9fbff] border-[#E3ECFC]"}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className={`text-[20px] font-extrabold tracking-tight truncate ${isDark ? "text-[#FFFFFF]" : "text-slate-900"}`}>{dealName}</h1>
              <p className={`text-[12px] mt-0.5 ${isDark ? "text-[#ABABAD]" : "text-slate-400"}`}>{name}{account ? ` · ${account}` : ""}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {dealEmail && (
                <Button variant="outlined" size="small" component="a" href={`mailto:${dealEmail}`}
                  sx={{ borderColor: isDark ? "#27272A" : "#E3ECFC", color: isDark ? "#B4B5B6" : "#1D4ED8", borderRadius: "9px", textTransform: "none", fontWeight: 600, fontSize: "0.84rem", bgcolor: isDark ? "#0F0F0F" : "transparent", "&:hover": { borderColor: "#1D4ED8", color: "#1D4ED8", bgcolor: isDark ? "#0A0A0A" : "#EFF6FF" } }}>
                  Send Email
                </Button>
              )}
              <Button variant="contained" size="small" startIcon={<PencilSimple size={14} weight="duotone" />} onClick={() => setEditOpen(true)}
                sx={{ bgcolor: "#1D4ED8", borderRadius: "9px", textTransform: "none", fontWeight: 700, fontSize: "0.84rem", boxShadow: "0 1px 8px 0 #1D4ED833", "&:hover": { bgcolor: "#60A5FA", boxShadow: "0 2px 14px 0 #60A5FA55" }, "&:active": { bgcolor: "#0C2472" } }}>
                Edit
              </Button>
              <Tooltip title="More options">
                <IconButton size="small" onClick={(e) => setMoreAnchor(e.currentTarget)}
                  sx={{ border: `1px solid ${isDark ? "#27272A" : "#E3ECFC"}`, bgcolor: isDark ? "#0F0F0F" : "transparent", borderRadius: "9px", p: 0.75, "&:hover": { borderColor: "#1D4ED8", bgcolor: isDark ? "#0A0A0A" : "#EFF6FF" } }}>
                  <DotsThreeVertical size={16} color={isDark ? "#B4B5B6" : "#1D4ED8"} weight="bold" />
                </IconButton>
              </Tooltip>
              <Menu anchorEl={moreAnchor} open={Boolean(moreAnchor)} onClose={() => setMoreAnchor(null)}
                PaperProps={{ sx: { borderRadius: "12px", mt: 1, minWidth: 160, border: `1px solid ${isDark ? "#27272A" : "#E3ECFC"}`, bgcolor: isDark ? "#1C1C1E" : "#fff", boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.5)" : "0 8px 32px rgba(12,36,114,0.10)" } }}>
                <MenuItem onClick={() => { setMoreAnchor(null); showToast("Feature not available in demo", "warning"); }} sx={{ mx: 0.5, borderRadius: "8px", py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 30 }}><DownloadSimple size={15} color="#94A3B8" weight="duotone" /></ListItemIcon>
                  <ListItemText primaryTypographyProps={{ fontSize: "0.8rem", fontWeight: 600, color: isDark ? "#D4D4D8" : "#334155" }}>Export as PDF</ListItemText>
                </MenuItem>
                <Divider sx={{ my: 0.5, borderColor: isDark ? "#27272A" : "#EFF6FF" }} />
                <MenuItem onClick={() => { setMoreAnchor(null); setDeleteDialogOpen(true); }} sx={{ mx: 0.5, borderRadius: "8px", py: 1, color: "#EF4444" }}>
                  <ListItemIcon sx={{ minWidth: 30 }}><Trash size={15} color="#EF4444" weight="duotone" /></ListItemIcon>
                  <ListItemText primaryTypographyProps={{ fontSize: "0.8rem", fontWeight: 600, color: "#EF4444" }}>Delete Deal</ListItemText>
                </MenuItem>
              </Menu>
            </div>
          </div>

          {/* Quick stat cards */}
          <div className="grid grid-cols-4 gap-3 mt-4">
            {quickStats.map(({ label, value, icon: Icon, fill, deep }) => (
              <div key={label} className="rounded-xl border border-white/50 p-3.5" style={{ backgroundColor: fill, boxShadow: "0 6px 24px rgba(15,23,42,0.06)" }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(249,251,255,0.7)" }}>
                  <Icon size={15} color={deep} weight="duotone" />
                </div>
                <p className="font-heading text-[12px] font-bold uppercase tracking-wider mb-0.5" style={{ color: isDark ? "#94A3B8" : "#475569" }}>{label}</p>
                <p className="text-[14px] font-bold truncate" style={{ color: isDark ? "#FFFFFF" : "#0C2472" }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className={`flex items-center gap-1 border rounded-xl p-1 w-fit shadow-sm ${isDark ? "bg-[#000000] border-[#27272A]" : "bg-[#f9fbff] border-[#E3ECFC]"}`}>
          {(["overview", "timeline"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-[14px] font-semibold capitalize transition-all ${activeTab === tab ? "bg-[#1D4ED8] text-white shadow-sm" : isDark ? "text-[#B4B5B6] bg-[#0A0A0A] hover:bg-[#27272A] hover:text-[#D4D4D8]" : "text-[#0C2472] bg-[#E3ECFC] hover:bg-[#1D4ED8]/10"}`}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="grid grid-cols-3 gap-4 items-start">
            <div className="col-span-2 space-y-5 min-w-0">
              {/* ── Stage Pipeline ── */}
              <div className={`rounded-2xl border shadow-sm p-4 ${isDark ? "bg-[#1C1C1E] border-[#27272A]" : "bg-[#f9fbff] border-[#E3ECFC]"}`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className={`text-[12px] font-bold uppercase tracking-widest ${isDark ? "text-[#71717A]" : "text-slate-400"}`}>Start</p>
                    <p className={`text-[12px] font-semibold ${isDark ? "text-[#A1A1AA]" : "text-slate-600"}`}>{formatShortDate(recordData.creation)}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-[12px] font-bold uppercase tracking-widest ${isDark ? "text-[#71717A]" : "text-slate-400"}`}>Closing</p>
                    <p className={`text-[12px] font-semibold ${isDark ? "text-[#A1A1AA]" : "text-slate-600"}`}>{closeDate ? formatShortDate(closeDate) : "—"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                {/* Arrows render only while the stages overflow, so a short
                    pipeline keeps the existing full-width layout. */}
                {stageScroll.overflowing && (
                  <button
                    type="button"
                    onClick={() => stageScroll.scrollByDirection(-1)}
                    disabled={stageScroll.atStart}
                    title="Scroll stages left"
                    aria-label="Scroll stages left"
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA]
                      ${isDark ? "bg-[#18181B] text-[#E4E4E7] border-[#3F3F46] hover:bg-[#27272A] hover:text-white" : "bg-[#E3ECFC] text-[#0C2472] border-[#CBDCF9] hover:bg-[#DCE6FB] hover:border-[#1D4ED8]"}
                      ${stageScroll.atStart ? "opacity-40 pointer-events-none" : ""}`}
                  >
                    <CaretRight size={16} weight="bold" className="rotate-180" />
                  </button>
                )}
                {/* Scrollbar hidden — the arrows above are the navigation affordance.
                    Wheel / trackpad / touch scrolling still reach every stage. */}
                <div ref={stageScroll.ref} className="flex items-center gap-0 flex-1 min-w-0 overflow-x-auto pb-1 scrollbar-hide">
                  {stageOptions.map((stage, i) => {
                    const isActive = currentStatus === stage.value;
                    const isPast = pipelineIdx > i;
                    const isLast = i === stageOptions.length - 1;
                    return (
                      <div key={stage.value} className="flex items-center flex-shrink-0">
                        <Tooltip title={isActive ? `Current stage: ${stage.label || stage.value}` : `Move to ${stage.label || stage.value}`}>
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(stage.value)}
                            aria-pressed={isActive}
                            className={`relative px-3 py-1.5 text-[12.5px] font-bold flex items-center gap-1.5 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]/40
                              ${i === 0 ? "rounded-l-lg" : ""} ${isLast ? "rounded-r-lg" : ""}
                              ${isActive
                                ? isDark ? "bg-[#3F3F46] text-[#F4F4F5] z-10 shadow-md hover:bg-[#52525B]" : "bg-[#1D4ED8] text-white z-10 shadow-md shadow-[#1D4ED8]/20 hover:bg-[#2563EB]"
                                : isPast
                                  ? isDark ? "bg-[#27272A] text-[#71717A] hover:bg-[#3F3F46] hover:text-[#D4D4D8]" : "bg-[#E3ECFC] text-[#1D4ED8] hover:bg-[#D0DEFA]"
                                  : isDark ? "bg-[#1C1C1E] text-[#3F3F46] border border-[#27272A] hover:bg-[#27272A] hover:text-[#71717A]" : "bg-[#f9fbff] text-slate-400 border border-[#E3ECFC] hover:bg-[#EFF6FF] hover:text-[#1D4ED8] hover:border-[#D0DEFA]"}`}>
                            {isLast && <Trophy size={12} weight="duotone" />}
                            {isPast && <Check size={11} weight="bold" />}
                            <span className="whitespace-nowrap">{stage.label || stage.value}</span>
                          </button>
                        </Tooltip>
                        {!isLast && (
                          <div className={`w-0 h-0 border-t-[14px] border-b-[14px] border-l-[10px] border-transparent flex-shrink-0 ${
                            isActive ? (isDark ? "border-l-[#3F3F46]" : "border-l-[#1D4ED8]")
                              : isPast ? (isDark ? "border-l-[#27272A]" : "border-l-[#E3ECFC]")
                              : isDark ? "border-l-[#1C1C1E]" : "border-l-[#E3ECFC]"}`} />
                        )}
                      </div>
                    );
                  })}

                  {(wonStatus || lostStatus) && (
                    <div className="flex items-center gap-1 ml-3 flex-shrink-0">
                      {wonStatus && (
                        <Tooltip title={`Mark as ${wonStatus.label || wonStatus.value}`}>
                          <IconButton size="small" onClick={() => handleUpdateStatus(wonStatus.value)} sx={{ bgcolor: isDark ? "#14532D" : "#DCFCE7", "&:hover": { bgcolor: isDark ? "#166534" : "#BBF7D0" }, borderRadius: "8px", p: 0.8 }}>
                            <ThumbsUp size={14} color={isDark ? "#4ADE80" : "#16A34A"} weight="duotone" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {lostStatus && (
                        <Tooltip title={`Mark as ${lostStatus.label || lostStatus.value}`}>
                          <IconButton size="small" onClick={() => handleUpdateStatus(lostStatus.value)} sx={{ bgcolor: isDark ? "#450A0A" : "#FEF2F2", "&:hover": { bgcolor: isDark ? "#7F1D1D" : "#FECACA" }, borderRadius: "8px", p: 0.8 }}>
                            <ThumbsDown size={14} color={isDark ? "#F87171" : "#DC2626"} weight="duotone" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </div>
                  )}
                </div>
                {stageScroll.overflowing && (
                  <button
                    type="button"
                    onClick={() => stageScroll.scrollByDirection(1)}
                    disabled={stageScroll.atEnd}
                    title="Scroll stages right"
                    aria-label="Scroll stages right"
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA]
                      ${isDark ? "bg-[#18181B] text-[#E4E4E7] border-[#3F3F46] hover:bg-[#27272A] hover:text-white" : "bg-[#E3ECFC] text-[#0C2472] border-[#CBDCF9] hover:bg-[#DCE6FB] hover:border-[#1D4ED8]"}
                      ${stageScroll.atEnd ? "opacity-40 pointer-events-none" : ""}`}
                  >
                    <CaretRight size={16} weight="bold" />
                  </button>
                )}
                </div>
              </div>

              {/* ── Quick Info ── */}
              <div className={`rounded-2xl border shadow-sm divide-y ${isDark ? "bg-[#1C1C1E] border-[#27272A] divide-[#27272A]" : "bg-[#f9fbff] border-[#E3ECFC] divide-[#EFF6FF]"}`}>
                {[
                  { label: "Deal Name", value: dealName },
                  { label: "Stage", value: currentStatus },
                  { label: "Probability (%)", value: recordData.probability != null ? String(recordData.probability) : "" },
                  { label: "Closing Date", value: closeDate ? formatShortDate(closeDate) : "" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between px-5 py-3">
                    <span className={`text-[12px] font-medium w-40 flex-shrink-0 ${isDark ? "text-[#71717A]" : "text-slate-500"}`}>{label}:</span>
                    <span className={`flex-1 text-[14px] font-semibold ${isDark ? "text-[#D4D4D8]" : "text-slate-700"}`}>{value || "—"}</span>
                    <IconButton size="small" onClick={() => setEditOpen(true)} sx={{ p: 0.5, color: isDark ? "#3F3F46" : "#E2E8F0", "&:hover": { color: "#1D4ED8", bgcolor: isDark ? "#27272A" : "#EFF6FF" }, borderRadius: "6px" }}>
                      <PencilSimple size={14} weight="duotone" />
                    </IconButton>
                  </div>
                ))}
              </div>

              {/* ── Deal Information ── */}
              <SectionCard icon={Handshake} title="Deal Information"
                action={
                  <IconButton size="small" onClick={(e) => setMoreAnchor(e.currentTarget)}
                    sx={{ p: 0.5, color: isDark ? "#3F3F46" : "#E2E8F0", "&:hover": { color: "#1D4ED8", bgcolor: isDark ? "#27272A" : "#EFF6FF" }, borderRadius: "6px" }}>
                    <DotsThreeVertical size={16} weight="bold" />
                  </IconButton>
                }>
                <InfoGrid>
                  <KV label="Deal Name" value={dealName} />
                  <KV label="Amount" value={inr(amountRaw)} />
                  <KV label="Deal Owner" value={dealOwner} />
                  <KV label="Closing Date" value={closeDate ? formatShortDate(closeDate) : ""} />
                  <KV label="Account Name" value={account} />
                  <KV label="Stage" value={currentStatus} />
                  <KV label="Type" value={recordData.deal_type || recordData.type} />
                  <KV label="Next Step" value={recordData.next_step} />
                  <KV label="Probability (%)" value={recordData.probability} />
                  <KV label="Lead Source" value={recordData.source} />
                  <KV label="Expected Revenue" value={inr(expectedRaw)} />
                  <KV label="Contact Name" value={contactName} />
                  <KV label="Created By" value={`${recordData.owner || dealOwner} · ${formatDate(recordData.creation)}`} />
                  <KV label="Modified By" value={`${recordData.modified_by || dealOwner} · ${formatDate(recordData.modified)}`} />
                  <KV label="Record Category" value={recordData.record_category} />
                </InfoGrid>
              </SectionCard>

              {/* ── Description ── */}
              <SectionCard icon={Tag} title="Description Information">
                <KV label="Description" value={recordData.description} />
              </SectionCard>

              {/* ── Notes ── */}
              <div id="section-notes">
                <SectionCard icon={Note} title="Notes">
                  <div className="space-y-3">
                    <div className={`border rounded-xl overflow-hidden transition-all ${isDark ? "border-[#3F3F46] focus-within:border-[#9CA3AF]" : "border-[#E3ECFC] focus-within:border-[#1D4ED8] focus-within:shadow-[0_0_0_2px_#4A7AE8]"}`}>
                      <InputBase fullWidth multiline minRows={2} placeholder="Add a note…" value={noteText} onChange={(e) => setNoteText(e.target.value)}
                        sx={{ px: 2, py: 1.5, fontSize: "0.8rem", color: isDark ? "#D4D4D8" : "#334155", "& textarea::placeholder": { color: isDark ? "#3F3F46" : "#CBD5E1", opacity: 1 } }} />
                      {noteText.trim() && (
                        <div className="flex justify-end px-3 pb-2">
                          <Button size="small" variant="contained" onClick={handleAddNote}
                            sx={{ bgcolor: isDark ? "#27272A" : "#1D4ED8", color: isDark ? "#F4F4F5" : "white", borderRadius: "8px", textTransform: "none", fontWeight: 700, fontSize: "0.73rem", "&:hover": { bgcolor: isDark ? "#3F3F46" : "#2563EB" } }}>
                            Save Note
                          </Button>
                        </div>
                      )}
                    </div>
                    {notes.map((n, i) => (
                      <div key={n.name || i} className={`group relative rounded-xl px-4 py-3 border ${isDark ? "bg-[#27272A] border-[#3F3F46]" : "bg-[#EFF6FF] border-[#E3ECFC]"}`}>
                        {editingNoteId === n.name ? (
                          <div className="space-y-2">
                            <textarea autoFocus value={editingNoteText} onChange={(e) => setEditingNoteText(e.target.value)} rows={3}
                              className={`w-full rounded-lg border px-3 py-2 text-[14px] outline-none resize-y ${isDark ? "bg-[#18181B] border-[#3F3F46] text-[#D4D4D8] focus:border-[#9CA3AF]" : "bg-white border-[#E3ECFC] text-slate-700 focus:border-[#1D4ED8]"}`} />
                            <div className="flex justify-end gap-2">
                              <button onClick={() => { setEditingNoteId(null); setEditingNoteText(""); }} className={`px-3 py-1 rounded-lg text-[12.5px] font-semibold ${isDark ? "text-[#ABABAD] hover:bg-[#3F3F46]" : "text-slate-500 hover:bg-[#E3ECFC]"}`}>Cancel</button>
                              <button onClick={() => handleEditNoteSave(n)} disabled={!editingNoteText.trim()} className="px-3 py-1 rounded-lg text-[12.5px] font-semibold bg-[#1D4ED8] text-white hover:bg-[#1E40AF] transition-colors disabled:opacity-50">Save</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-start justify-between gap-2">
                              <p className={`flex-1 text-[14px] leading-relaxed ${isDark ? "text-[#D4D4D8]" : "text-slate-700"}`}>{n.content?.replace(/<[^>]*>?/gm, "")}</p>
                              {n.name && (
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                  <Tooltip title="Edit note">
                                    <IconButton size="small" onClick={() => handleEditNoteStart(n)} sx={{ p: 0.5 }}>
                                      <PencilSimple size={14} color={isDark ? "#9CA3AF" : "#64748B"} weight="duotone" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Delete note">
                                    <IconButton size="small" onClick={() => setDeleteTarget({ doctype: "FCRM Note", id: n.name, label: "Note", refetch: fetchNotes })} sx={{ p: 0.5 }}>
                                      <Trash size={14} color="#EF4444" weight="duotone" />
                                    </IconButton>
                                  </Tooltip>
                                </div>
                              )}
                            </div>
                            <div className="flex justify-between items-center mt-2">
                              <p className={`text-[11.5px] ${isDark ? "text-[#ABABAD]" : "text-slate-400"}`}>By {n.owner_name || n.owner}</p>
                              <p className={`text-[11px] ${isDark ? "text-[#ABABAD]" : "text-slate-400"}`}>{formatDate(n.creation)}</p>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </div>

              {/* ── Attachments ── */}
              {/* ── Attachments (shared common Attachments UI) ── */}
              <AttachmentsSection doctype="CRM Deal" name={name} onCountChange={setAttachmentCount} />

              {/* ── Stage History ── */}
              <div id="section-stage-history">
                <SectionCard icon={ClockCounterClockwise} title="Stage History">
                  {layoutId ? (
                    <StageHistory module="Deals" module_name="Deals" layout_name={layoutId} link_name={name} />
                  ) : (
                    <div className={`flex items-center justify-center py-6 text-[14px] ${isDark ? "text-[#3F3F46]" : "text-slate-300"}`}>No history yet</div>
                  )}
                </SectionCard>
              </div>

              {/* ── Tasks ── */}
              <div id="section-tasks">
                <SectionCard icon={ClipboardText} title="Tasks"
                  action={
                    <button onClick={() => setTaskDrawerOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold bg-[#1D4ED8] text-white hover:bg-[#1E40AF] transition-colors">
                      <Plus size={13} weight="bold" />
                      New Task
                    </button>
                  }>
                  <div className="overflow-x-auto -mx-5 px-5">
                    <table className="w-full">
                      <thead>
                        <tr className={`border-b ${isDark ? "border-[#27272A]" : "border-[#E3ECFC]"}`}>
                          <th className={`text-left py-2 pr-4 text-[11.5px] font-bold uppercase tracking-wider ${isDark ? "text-[#ABABAD]" : "text-[#0C2472]"}`}>Subject</th>
                          <th className={`text-left py-2 pr-4 text-[11.5px] font-bold uppercase tracking-wider ${isDark ? "text-[#ABABAD]" : "text-[#0C2472]"}`}>Status</th>
                          <th className="w-16" />
                        </tr>
                      </thead>
                      <tbody>
                        {tasks.length === 0 ? (
                          <tr>
                            <td colSpan={3} className={`py-8 text-center text-[14px] ${isDark ? "text-[#3F3F46]" : "text-slate-300"}`}>No rows</td>
                          </tr>
                        ) : tasks.map((t) => (
                          <tr key={t.name} className={`group border-b transition-colors ${isDark ? "border-[#27272A] hover:bg-[#27272A]" : "border-[#EFF6FF] hover:bg-[rgba(29,78,216,0.03)]"}`}>
                            <td className={`py-3 pr-4 text-[14px] font-medium ${isDark ? "text-[#D4D4D8]" : "text-slate-700"}`}>{t.title || "Untitled task"}</td>
                            <td className={`py-3 pr-4 text-[14px] ${isDark ? "text-[#A1A1AA]" : "text-slate-600"}`}>
                              {t.status && (
                                <span className={`text-[11.5px] font-bold px-2 py-0.5 rounded-full ${isDark ? "bg-[#3F3F46] text-[#D4D4D8]" : "bg-[#E3ECFC] text-[#1D4ED8]"}`}>{t.status}</span>
                              )}
                            </td>
                            <td className="py-3">
                              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Tooltip title="Edit task">
                                  <IconButton size="small" onClick={() => handleEditTaskStart(t)} sx={{ p: 0.5 }}>
                                    <PencilSimple size={14} color={isDark ? "#9CA3AF" : "#64748B"} weight="duotone" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete task">
                                  <IconButton size="small" onClick={() => setDeleteTarget({ doctype: "CRM Task", id: t.name, label: "Task", refetch: fetchTasks })} sx={{ p: 0.5 }}>
                                    <Trash size={14} color="#EF4444" weight="duotone" />
                                  </IconButton>
                                </Tooltip>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </SectionCard>
              </div>

              {/* ── Config-driven related lists (from Settings "Detail View") ── */}
              {sectionRelatedLists.map((rl) => (
                <DynamicRelatedSection
                  key={rl.id || rl.name || rl.label}
                  config={rl}
                  parent_module="Deals"
                  link_name={name}
                  onCountChange={handleRelatedCount}
                />
              ))}
            </div>

            <div className="sticky top-4 self-start">
              <RelatedListPanel />
            </div>
          </div>
        )}

        {activeTab === "timeline" && (
          <div className="grid grid-cols-3 gap-4 items-start">
            <div className="col-span-2">
              <div className={`rounded-2xl border shadow-sm overflow-hidden ${isDark ? "bg-[#1C1C1E] border-[#27272A]" : "bg-[#f9fbff] border-[#E3ECFC]"}`}>
                <div className={`flex items-center gap-2.5 px-5 py-3.5 border-b ${isDark ? "border-[#27272A]" : "border-[#EFF6FF]"}`}>
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isDark ? "bg-[#27272A]" : "bg-[#EFF6FF]"}`}>
                    <ClockCounterClockwise size={13} color={isDark ? "#9CA3AF" : "#1D4ED8"} weight="duotone" />
                  </div>
                  <p className={`font-heading text-[12px] font-bold uppercase tracking-[0.12em] ${isDark ? "text-[#D4D4D8]" : "text-[#1D4ED8]"}`}>History</p>
                </div>

                {activityFeed.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2">
                    <ClockCounterClockwise size={28} color={isDark ? "#27272A" : "#E2E8F0"} weight="duotone" />
                    <p className={`text-[14px] ${isDark ? "text-[#A1A1AA]" : "text-slate-400"}`}>No history yet</p>
                  </div>
                ) : (() => {
                  // Group the activity feed by day so the history reads as a
                  // date-sectioned timeline (matching the reference design).
                  const grouped: Record<string, typeof activityFeed> = {};
                  activityFeed.forEach((e) => {
                    const key = new Date(e.time).toDateString();
                    if (!grouped[key]) grouped[key] = [];
                    grouped[key].push(e);
                  });
                  const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

                  return (
                    <div className="px-6 py-5 space-y-6">
                      {sortedDates.map((date, di) => (
                        <div key={date}>
                          <div className="flex items-center gap-3 mb-4">
                            <span className={`text-[12px] font-semibold ${isDark ? "text-[#71717A]" : "text-slate-400"}`}>
                              {new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                            </span>
                            <div className={`flex-1 h-px ${isDark ? "bg-[#27272A]" : "bg-[#E3ECFC]"}`} />
                          </div>

                          <div className="space-y-0">
                            {grouped[date].map((entry, i) => {
                              const Icon = entry.icon;
                              const isLast = i === grouped[date].length - 1 && di === sortedDates.length - 1;
                              return (
                                <div key={i} className="flex gap-4">
                                  <div className="w-16 flex-shrink-0 text-right">
                                    <span className={`text-[12px] font-medium ${isDark ? "text-[#71717A]" : "text-slate-400"}`}>{formatTime(entry.time)}</span>
                                  </div>

                                  <div className="flex flex-col items-center flex-shrink-0">
                                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center z-10 flex-shrink-0 ${isDark ? "bg-[#27272A] border-[#3F3F46]" : "bg-[#EFF6FF] border-[#E3ECFC]"}`}>
                                      <Icon size={13} color={isDark ? "#A1A1AA" : "#1D4ED8"} weight="duotone" />
                                    </div>
                                    {!isLast && <div className={`w-px flex-1 my-1 min-h-[24px] ${isDark ? "bg-[#27272A]" : "bg-[#E3ECFC]"}`} />}
                                  </div>

                                  <div className="pb-5 flex-1 min-w-0 overflow-hidden">
                                    <p className={`text-[14px] leading-relaxed break-words ${isDark ? "text-[#A1A1AA]" : "text-slate-700"}`}>{entry.text}</p>
                                    {entry.by && <p className={`text-[12px] mt-0.5 break-all ${isDark ? "text-[#71717A]" : "text-slate-400"}`}>by {entry.by}</p>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="sticky top-4 self-start">
              <RelatedListPanel />
            </div>
          </div>
        )}
      </div>

      {/* Edit Drawer */}
      {editOpen && (
        <AddEditDealDrawer
          initialValues={recordData}
          open={editOpen}
          onClose={() => setEditOpen(false)}
          operation="Edit"
          onSubmit={async () => {
            setEditOpen(false);
            setLoading(true);
            await fetchRecord();
            setLoading(false);
          }}
        />
      )}

      {/* New Task Drawer */}
      {taskDrawerOpen && (
        <AddEditTaskDrawer
          initialValues={[]}
          open={taskDrawerOpen}
          onClose={() => setTaskDrawerOpen(false)}
          operation="New"
          reference_doctype="CRM Deal"
          reference_docname={name}
          onSubmit={async () => {
            setTaskDrawerOpen(false);
            await fetchTasks();
          }}
        />
      )}

      {/* Edit Task Drawer */}
      {editingTask && (
        <AddEditTaskDrawer
          initialValues={editingTask}
          open={!!editingTask}
          onClose={() => setEditingTask(null)}
          operation="Edit"
          reference_doctype="CRM Deal"
          reference_docname={name}
          onSubmit={async () => {
            setEditingTask(null);
            await fetchTasks();
          }}
        />
      )}

      {/* Shared row-level delete confirmation (Notes / Tasks) */}
      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete ${deleteTarget?.label ?? "Item"}`}
        message={`Are you sure you want to delete this ${(deleteTarget?.label ?? "item").toLowerCase()}? This action cannot be undone.`}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteTarget}
      />
    </div>
  );
}
