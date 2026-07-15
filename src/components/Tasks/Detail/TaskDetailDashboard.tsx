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

// Phosphor Duotone Icons — matches reference:
// crm-app-UI-Arun-Latest/components/tasks/TaskDetail.tsx
import {
  House,
  CaretRight,
  PencilSimple,
  DotsThreeVertical,
  Note,
  Paperclip,
  ClipboardText,
  ClockCounterClockwise,
  Tag,
  Trash,
  DownloadSimple,
} from "@phosphor-icons/react";

import { readAccessTokenDataParsed } from "@/utils/accessTokenDataStorage";
import { getDocument, postNote, deleteResource } from "@/services/api/common-erpnext-api/create-edit-api";
import {
  fetchNotesWithOwner,
  fetchTimelineComments,
} from "@/services/api/common-erpnext-api/create-update-custom-api";
import { getFormFields } from "@/services/api/general_apis/layout-api";
import AddEditTaskDrawer from "@/components/Tasks/CreateEdit";
import AttachmentsSection from "@/components/Common/Upload/AttachmentsSection";
import { showToast } from "@/components/ToastNotificationNew";
import ConfirmDialog from "@/components/UI/ConfirmDialog";
import { getTaskStatusToken, getTaskPriorityToken, formatTaskDate } from "@/components/Tasks/taskTokens";

const MODULE = "CRM Task";

// ─────────────────────────────────────────────
// Sub-components (theme-aware) — mirror the reference SectionCard / KV
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

function KV({ label, value, fullWidth }: { label: string; value?: string | number | boolean | null; fullWidth?: boolean }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const display =
    value !== undefined && value !== null && value !== "" && value !== false
      ? typeof value === "boolean"
        ? value ? "Yes" : "No"
        : String(value)
      : typeof value === "boolean" ? "No" : "—";
  const isEmpty = display === "—" || display === "No";
  return (
    <div className={`py-2 border-b last:border-0 ${isDark ? "border-[#27272A]" : "border-[#EFF6FF]"} ${fullWidth ? "col-span-2" : ""}`}>
      <p className={`font-heading text-[11.5px] font-semibold uppercase tracking-wider mb-0.5 ${isDark ? "text-[#ABABAD]" : "text-slate-400"}`}>{label}</p>
      <p className={`text-[14px] font-medium whitespace-pre-line ${isEmpty ? (isDark ? "text-[#3F3F46] italic" : "text-slate-300 italic") : (isDark ? "text-[#D4D4D8]" : "text-slate-800")}`}>{display}</p>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function TaskDetailDashboard({ name }: { name: string }) {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // Data state
  const [loading, setLoading] = useState(true);
  const [recordData, setRecordData] = useState<any>(null);
  const [layoutFields, setLayoutFields] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);

  // UI state
  const [activeTab, setActiveTab] = useState<"overview" | "timeline">("overview");
  const [editOpen, setEditOpen] = useState(false);
  const [moreAnchor, setMoreAnchor] = useState<null | HTMLElement>(null);
  const [noteText, setNoteText] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [attachmentCount, setAttachmentCount] = useState(0);

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
      const details = await getDocument(MODULE, name, userToken.access_token);
      if (details) setRecordData(details);
    } catch (err) {
      console.error("Failed to load Task details:", err);
    }
  }, [name, userToken?.access_token]);

  const fetchLayoutFields = useCallback(async () => {
    if (!userToken?.access_token) return;
    try {
      const response: any = await getFormFields("Tasks", userToken.access_token, userToken.role_profile, "");
      const fieldList: any[] = Array.isArray(response?.fields)
        ? response.fields
        : Array.isArray(response)
          ? response
          : Array.isArray(response?.data?.fields)
            ? response.data.fields
            : Array.isArray(response?.data)
              ? response.data
              : [];
      setLayoutFields(fieldList);
    } catch (err) {
      console.error("Failed to load Task layout fields:", err);
    }
  }, [userToken?.access_token, userToken?.role_profile]);

  const fetchNotes = useCallback(async () => {
    if (!userToken?.access_token || !name) return;
    try {
      const res = await fetchNotesWithOwner(MODULE, name, userToken.access_token);
      setNotes(Array.isArray(res) ? res : res?.data || []);
    } catch (err) {
      console.error("Failed to load Task notes:", err);
    }
  }, [name, userToken?.access_token]);

  const fetchComments = useCallback(async () => {
    if (!userToken?.access_token || !name) return;
    try {
      const res = await fetchTimelineComments(MODULE, name, userToken.access_token);
      setComments(Array.isArray(res) ? res : res?.data || []);
    } catch (err) {
      console.error("Failed to load Task comments:", err);
    }
  }, [name, userToken?.access_token]);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchRecord(), fetchLayoutFields(), fetchNotes(), fetchComments()]);
      setLoading(false);
    };
    loadAll();
  }, [fetchRecord, fetchLayoutFields, fetchNotes, fetchComments]);

  // ── Actions ──
  const handleAddNote = async () => {
    if (!noteText.trim() || !userToken?.access_token) return;
    try {
      const cleanText = noteText.trim();
      await postNote({
        doctype: "FCRM Note",
        reference_doctype: MODULE,
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

  const handleDeleteTask = async () => {
    if (!userToken?.access_token || !name) return;
    setDeleteDialogOpen(false);
    try {
      await deleteResource(MODULE, name, userToken.access_token);
      showToast("Task deleted successfully", "success");
      router.push("/tasks");
    } catch (err) {
      showToast("Failed to delete task", "error");
    }
  };

  const handleRelatedClick = (label: string) => {
    setActiveTab("overview");
    setTimeout(() => {
      const id = `section-${label.toLowerCase().replace(/\s+/g, "-")}`;
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

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
        <p className="text-slate-500 font-semibold">Task not found</p>
        <Link href="/tasks" className="text-[#1D4ED8] text-[15px] font-bold hover:underline">← Back to Tasks</Link>
      </div>
    );
  }

  // ── Derived fields ──
  const subject = recordData.title || recordData.subject || name;
  const taskType = recordData.task_type || recordData.type || "";
  const status = recordData.status || "";
  const priority = recordData.priority || "";
  const dueDate = recordData.due_date || "";
  const description = String(recordData.description || "").replace(/<[^>]*>?/gm, "");
  const taskOwner = recordData.assigned_to || recordData.owner || "";
  const contact = recordData.contact || "";
  const relatedTo = recordData.reference_docname || recordData.related_to || "";
  const reminder = recordData.reminder || "";

  const statusCfg = status ? getTaskStatusToken(status, isDark) : null;
  const priorityCfg = getTaskPriorityToken(priority, isDark);

  // Task Information: dynamic fields from the backend layout (preserves custom fields).
  const SKIP_FIELDS = new Set(["naming_series", "image"]);
  const taskInfoFields = layoutFields
    .filter((f: any) => {
      if (f?.hide) return false;
      const fn = f?.fieldname || f?.name;
      if (!fn || SKIP_FIELDS.has(fn)) return false;
      const ft = String(f?.type || f?.fieldtype || "").toLowerCase();
      return ft !== "address" && ft !== "table" && ft !== "section break" && ft !== "column break" && ft !== "html";
    })
    .map((f: any) => {
      const fn = f.fieldname || f.name;
      let value = recordData[fn];
      const ft = String(f?.type || f?.fieldtype || "").toLowerCase();
      if (ft === "checkbox" || ft === "check") value = !!value;
      return { label: f.label || fn, value };
    });

  // Fallback to the reference's fixed field set if the layout hasn't loaded.
  const taskInfoFallback = [
    { label: "Type", value: taskType },
    { label: "Subject", value: subject },
    { label: "Due Date", value: dueDate ? formatTaskDate(dueDate) : "" },
    { label: "Status", value: status },
    { label: "Priority", value: priority },
    { label: "Contact", value: contact },
    { label: "Related to", value: relatedTo },
    { label: "Reminder", value: reminder },
    { label: "Task Owner", value: taskOwner },
    { label: "Created By", value: `${recordData.owner || taskOwner} · ${formatDate(recordData.creation)}` },
    { label: "Modified By", value: `${recordData.modified_by || taskOwner} · ${formatDate(recordData.modified)}` },
  ];

  // Timeline activity feed (creation event + comments), newest first.
  const activityFeed = [
    { icon: PencilSimple, text: `Task created by ${taskOwner || "System"}`, time: recordData.creation, by: taskOwner || recordData.owner || "System" },
    ...comments.map((c) => ({
      icon: Note,
      text: c.comment_type === "Comment" ? `Comment: ${c.content?.replace(/<[^>]*>?/gm, "")}` : `Note added`,
      time: c.creation,
      by: c.owner_name || c.owner || c.comment_by || taskOwner || "System",
    })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  const relatedItems = [
    { label: "Notes", icon: Note, count: notes.length, color: "#8B5CF6" },
    { label: "Attachments", icon: Paperclip, count: attachmentCount, color: "#F59E0B" },
  ];

  const StatusBadge = ({ small }: { small?: boolean }) =>
    statusCfg ? (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${small ? "px-2.5 py-1 text-[11px] font-bold" : "px-2.5 py-1 text-[12px]"}`}
        style={{ backgroundColor: statusCfg.bg, color: statusCfg.text }}
      >
        <span className="w-1.5 h-1.5 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: statusCfg.dot }} />
        {status}
      </span>
    ) : null;

  const PriorityBadge = ({ small }: { small?: boolean }) =>
    priorityCfg ? (
      <span
        className={`inline-flex items-center rounded-full font-semibold ${small ? "px-2.5 py-1 text-[11px] font-bold" : "px-2.5 py-1 text-[12px]"}`}
        style={{ backgroundColor: priorityCfg.bg, color: priorityCfg.text }}
      >
        {priority}
      </span>
    ) : null;

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

      {/* Details panel (reference: Due Date / Task Owner / Created By) */}
      <div className={`rounded-2xl border shadow-sm p-4 space-y-3 ${isDark ? "bg-[#1C1C1E] border-[#27272A]" : "bg-[#f9fbff] border-[#E3ECFC]"}`}>
        <p className={`font-heading text-[12px] font-bold uppercase tracking-wider ${isDark ? "text-[#ABABAD]" : "text-slate-500"}`}>Details</p>
        {[
          { label: "Due Date", value: dueDate ? formatTaskDate(dueDate) : "—" },
          { label: "Task Owner", value: taskOwner || "—" },
          { label: "Created By", value: recordData.owner || "—" },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between text-[12px]">
            <span className={`font-medium ${isDark ? "text-[#ABABAD]" : "text-slate-400"}`}>{label}</span>
            <span className={`font-semibold text-right max-w-[140px] truncate ${isDark ? "text-[#D4D4D8]" : "text-slate-700"}`}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen !bg-transparent font-sans ${isDark ? "text-[#F4F4F5]" : "text-slate-800"}`}>
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteTask}
      />

      <div className="max-w-[1600px] mx-auto space-y-4">
        {/* ── Breadcrumb ── */}
        <div className={`flex items-center gap-1.5 text-[13.5px] ${isDark ? "text-[#ABABAD]" : "text-slate-400"}`}>
          <House size={16} weight="duotone" />
          <CaretRight size={12} weight="duotone" />
          <Link href="/tasks" className="hover:text-[#1D4ED8] transition-colors font-medium">Tasks</Link>
          <CaretRight size={12} weight="duotone" />
          <span className="text-[#1D4ED8] font-semibold truncate max-w-[240px]">{subject}</span>
        </div>

        {/* ── Header card ── */}
        <div className={`rounded-2xl border shadow-sm px-5 py-4 ${isDark ? "bg-[#1C1C1E] border-[#27272A]" : "bg-[#f9fbff] border-[#E3ECFC]"}`}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 ${isDark ? "bg-[#27272A]" : "bg-[#1D4ED8]"}`}>
                <ClipboardText size={18} color={isDark ? "#71717A" : "#fff"} weight="duotone" />
              </div>
              <div className="min-w-0">
                <h1 className={`text-[20px] font-extrabold tracking-tight leading-tight mb-0 truncate ${isDark ? "text-[#F4F4F5]" : "text-slate-900"}`}>{subject}</h1>
                <p className={`text-[12px] mt-0.5 truncate ${isDark ? "text-[#ABABAD]" : "text-slate-400"}`}>
                  {taskType ? `${taskType} · ` : ""}#{name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <StatusBadge />
              <PriorityBadge />
              <Button size="small" variant="outlined" startIcon={<PencilSimple size={13} weight="duotone" />} onClick={() => setEditOpen(true)}
                sx={{ borderColor: isDark ? "#27272A" : "#E3ECFC", color: isDark ? "#B4B5B6" : "#1D4ED8", borderRadius: "9px", textTransform: "none", fontWeight: 600, fontSize: "0.84rem", bgcolor: isDark ? "#0F0F0F" : "transparent", "&:hover": { borderColor: "#1D4ED8", color: "#1D4ED8", bgcolor: isDark ? "#0A0A0A" : "#EFF6FF" } }}>
                Edit
              </Button>
              <Tooltip title="More actions">
                <IconButton size="small" onClick={(e) => setMoreAnchor(e.currentTarget)}
                  sx={{ border: `1.5px solid ${isDark ? "#27272A" : "#E3ECFC"}`, borderRadius: "9px", bgcolor: isDark ? "#0F0F0F" : "transparent", p: 0.8, "&:hover": { borderColor: "#1D4ED8", bgcolor: isDark ? "#0A0A0A" : "#EFF6FF" } }}>
                  <DotsThreeVertical size={16} weight="bold" color={isDark ? "#B4B5B6" : "#64748B"} />
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
                  <ListItemText primaryTypographyProps={{ fontSize: "0.8rem", fontWeight: 600, color: "#EF4444" }}>Delete Task</ListItemText>
                </MenuItem>
              </Menu>
            </div>
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
              {/* ── Quick Info ── */}
              <div className={`rounded-2xl border shadow-sm divide-y ${isDark ? "bg-[#1C1C1E] border-[#27272A] divide-[#27272A]" : "bg-[#f9fbff] border-[#E3ECFC] divide-[#EFF6FF]"}`}>
                {[
                  { label: "Type", value: taskType },
                  { label: "Subject", value: subject },
                  { label: "Due Date", value: dueDate ? formatTaskDate(dueDate) : "" },
                  { label: "Priority", value: priority },
                  { label: "Status", value: status },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between px-5 py-3">
                    <span className={`text-[12px] font-medium w-32 flex-shrink-0 ${isDark ? "text-[#71717A]" : "text-slate-500"}`}>{label}:</span>
                    <span className={`flex-1 text-[14px] font-semibold ${value ? (isDark ? "text-[#D4D4D8]" : "text-slate-700") : (isDark ? "text-[#3F3F46]" : "text-slate-300")}`}>
                      {label === "Status" && value && statusCfg ? (
                        <StatusBadge small />
                      ) : label === "Priority" && value && priorityCfg ? (
                        <PriorityBadge small />
                      ) : (
                        value || <span className={isDark ? "text-[#3F3F46]" : "text-slate-300"}>—</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>

              {/* ── Task Information (dynamic layout fields) ── */}
              <SectionCard icon={ClipboardText} title="Task Information"
                action={
                  <IconButton size="small" onClick={() => setEditOpen(true)}
                    sx={{ p: 0.5, color: isDark ? "#3F3F46" : "#E2E8F0", "&:hover": { color: "#1D4ED8", bgcolor: isDark ? "#27272A" : "#EFF6FF" }, borderRadius: "6px" }}>
                    <DotsThreeVertical size={16} weight="bold" />
                  </IconButton>
                }>
                <InfoGrid>
                  {(taskInfoFields.length > 0 ? taskInfoFields : taskInfoFallback).map((f, i) => (
                    <KV key={`${f.label}-${i}`} label={f.label} value={f.value as any} />
                  ))}
                </InfoGrid>
              </SectionCard>

              {/* ── Description ── */}
              <SectionCard icon={Tag} title="Description Information">
                <KV label="Description" value={description} fullWidth />
              </SectionCard>

              {/* ── Notes ── */}
              <div id="section-notes">
                <SectionCard icon={Note} title="Notes">
                  <div className="space-y-3">
                    <div className={`border rounded-xl overflow-hidden transition-all ${isDark ? "border-[#3F3F46] focus-within:border-[#9CA3AF]" : "border-[#E3ECFC] focus-within:border-[#1D4ED8] focus-within:shadow-[0_0_0_2px_#4A7AE8]"}`}>
                      <InputBase fullWidth multiline minRows={2} placeholder="Add a note…" value={noteText} onChange={(e) => setNoteText(e.target.value)}
                        sx={{ px: 2, py: 1.5, fontSize: "0.8rem", color: isDark ? "#D4D4D8" : "#334155", "& textarea::placeholder": { color: isDark ? "#3F3F46" : "#94A3B8", opacity: 1 } }} />
                      {noteText.trim() && (
                        <div className="flex justify-end px-3 pb-2">
                          <Button size="small" variant="contained" onClick={handleAddNote}
                            sx={{ bgcolor: "#1D4ED8", color: "white", borderRadius: "8px", textTransform: "none", fontWeight: 700, fontSize: "0.73rem", "&:hover": { bgcolor: "#2563EB" } }}>
                            Save Note
                          </Button>
                        </div>
                      )}
                    </div>
                    {notes.map((n, i) => (
                      <div key={n.name || i} className={`rounded-xl px-4 py-3 border ${isDark ? "bg-[#27272A] border-[#3F3F46]" : "bg-[#EFF6FF] border-[#E3ECFC]"}`}>
                        <p className={`text-[14px] leading-relaxed ${isDark ? "text-[#D4D4D8]" : "text-slate-700"}`}>{n.content?.replace(/<[^>]*>?/gm, "")}</p>
                        <div className="flex justify-between items-center mt-2">
                          <p className={`text-[11.5px] ${isDark ? "text-[#ABABAD]" : "text-slate-400"}`}>By {n.owner_name || n.owner}</p>
                          <p className={`text-[11px] ${isDark ? "text-[#ABABAD]" : "text-slate-400"}`}>{formatDate(n.creation)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </div>

              {/* ── Attachments (shared common Attachments UI) ── */}
              <AttachmentsSection doctype={MODULE} name={name} onCountChange={setAttachmentCount} />
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
                            <span className={`text-[12px] font-semibold whitespace-nowrap ${isDark ? "text-[#71717A]" : "text-slate-400"}`}>
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
        <AddEditTaskDrawer
          initialValues={recordData}
          open={editOpen}
          onClose={() => setEditOpen(false)}
          operation="Edit"
          reference_doctype={recordData.reference_doctype}
          reference_docname={recordData.reference_docname}
          onSubmit={async () => {
            setEditOpen(false);
            setLoading(true);
            await fetchRecord();
            setLoading(false);
          }}
        />
      )}
    </div>
  );
}
