"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAvatarColor } from "@/@core/utils/avatarColor";
import {
  Avatar,
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
  CircularProgress
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

// Phosphor Duotone Icons
import {
  House,
  CaretRight,
  Phone,
  Envelope,
  DotsThreeVertical,
  Check,
  Note,
  ClipboardText,
  Paperclip,
  ClockCounterClockwise,
  User,
  AddressBook,
  TrendUp,
  Buildings,
  Star,
  Clock,
  UserPlus,
  Copy,
  DownloadSimple,
  Trash,
  Users,
  CaretDown,
  CaretUp,
  ThumbsUp,
  ThumbsDown,
  Globe,
  Pen,
  ArrowsLeftRight,
  PencilSimple,
  Plus
} from "@phosphor-icons/react";

import { readAccessTokenDataParsed } from "@/utils/accessTokenDataStorage";
import {
  getDocument,
  updateFieldCustomDocument,
  postNote,
  deleteResource,
  updateResource
} from "@/services/api/common-erpnext-api/create-edit-api";
import {
  fetchNotesWithOwner,
  fetchTimelineComments,
  fetchTasksWithOwner,
  Task
} from "@/services/api/common-erpnext-api/create-update-custom-api";
import AddEditTaskDrawer from "@/components/Tasks/CreateEdit";
import AddEditLeadDrawer from "@/components/Leads/CreateEdit";
import AttachmentsSection from "@/components/Common/Upload/AttachmentsSection";
import { showToast } from "@/components/ToastNotificationNew";
import ConfirmDialog from "@/components/UI/ConfirmDialog";
import { useComponentPicklist } from "@/hooks/GeneralHooks/useComponentPicklist";

// ─────────────────────────────────────────────
// Status color helpers (colors come from the backend Component Pick List API)
// ─────────────────────────────────────────────
const DEFAULT_STATUS_ACCENT = "#64748b";

/** Append an alpha channel to a 7-char hex color, e.g. "#1D4ED8" + 0.12 -> "#1D4ED81F". */
const hexWithAlpha = (hex: string, alpha: number): string => {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return hex;
  const a = Math.round(Math.min(Math.max(alpha, 0), 1) * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex}${a}`;
};

/** Derive the badge {bg, text, dot} tones for a status from its single backend color. */
const deriveStatusCfg = (color: string | undefined, isDark: boolean) => {
  const accent = color || DEFAULT_STATUS_ACCENT;
  return {
    bg: hexWithAlpha(accent, isDark ? 0.22 : 0.12),
    text: isDark ? "#E2E8F0" : accent,
    dot: accent,
  };
};

// Theme-aligned avatar color from the shared palette (imported at top).

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase();
};

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────
function SectionCard({ icon: Icon, title, children, id, action }: { icon: React.ElementType; title: string; children: React.ReactNode; id?: string; action?: React.ReactNode }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  return (
    <div id={id} className={`rounded-2xl border shadow-sm1 overflow-hidden ${isDark ? "bg-[#1C1C1E] border-[#27272A]" : "bg-[#f9fbff] border-[#E3ECFC]"}`}>
      <div className={`flex items-center gap-2.5 px-5 py-3.5 border-b ${isDark ? "border-[#27272A]" : "border-[#EFF6FF]"}`}>
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isDark ? "bg-[#27272A]" : "bg-[#EFF6FF]"}`}>
          <Icon size={13} color={isDark ? "#9CA3AF" : "#1D4ED8"} weight="duotone" />
        </div>
        <p className={`font-heading text-[12px] font-bold uppercase tracking-[0.12em] ${isDark ? "text-[#D4D4D8]" : "text-[#1D4ED8]"}`}>{title}</p>
        {action && <div className="ml-auto">{action}</div>}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function KV({ label, value, blue }: { label: string; value?: string | number | null; blue?: boolean }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const displayVal = value !== undefined && value !== null && String(value).trim() !== "" ? String(value) : "";
  return (
    <div className="py-2 border-b border-[#EFF6FF] dark:border-[#27272A] last:border-0">
      <p className={`font-heading text-[11.5px] font-semibold uppercase tracking-wider mb-0.5 ${isDark ? "text-[#ABABAD]" : "text-slate-400"}`}>{label}</p>
      <p className={`text-[14px] font-medium ${blue ? "text-[#1D4ED8] dark:text-[#60A5FA] hover:underline cursor-pointer" : isDark ? "text-[#F4F4F5]" : "text-slate-800"} ${!displayVal ? "text-slate-300 dark:text-slate-600 italic" : ""}`}>
        {displayVal || "—"}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function LeadDetailDashboard({ name }: { name: string }) {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // State
  const [loading, setLoading] = useState(true);
  const [recordData, setRecordData] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  // UI states
  const [activeTab, setActiveTab] = useState<"overview" | "timeline">("overview");
  const [editOpen, setEditOpen] = useState(false);
  const [moreAnchor, setMoreAnchor] = useState<null | HTMLElement>(null);
  const [noteText, setNoteText] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskDrawerOpen, setTaskDrawerOpen] = useState(false);
  const [attachmentCount, setAttachmentCount] = useState(0);

  // Inline note editing + row-level delete
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState("");
  const [editingTask, setEditingTask] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ doctype: string; id: string; label: string; refetch: () => Promise<void> } | null>(null);

  // User Authentication details
  const [userToken, setUserToken] = useState<any>(() => {
    try {
      return readAccessTokenDataParsed() || {};
    } catch {
      return {};
    }
  });

  // Lead statuses loaded dynamically from the backend Component Pick List API.
  const { options: statusOptions } = useComponentPicklist("Leads", ["lead_status", "status"], {
    token: userToken?.access_token,
    roleProfile: userToken?.role_profile,
  });

  // Fetch record details
  const fetchRecord = useCallback(async () => {
    if (!userToken?.access_token || !name) return;
    try {
      const details = await getDocument("CRM Lead", name, userToken.access_token);
      if (details) {
        setRecordData(details);
      }
    } catch (err) {
      console.error("Failed to load Lead details:", err);
    }
  }, [name, userToken?.access_token]);

  // Fetch Notes
  const fetchNotes = useCallback(async () => {
    if (!userToken?.access_token || !name) return;
    try {
      const notesRes = await fetchNotesWithOwner("CRM Lead", name, userToken.access_token);
      const notesArray = Array.isArray(notesRes) ? notesRes : notesRes?.data || [];
      setNotes(notesArray);
    } catch (err) {
      console.error("Failed to load Lead notes:", err);
    }
  }, [name, userToken?.access_token]);

  // Fetch tasks linked to this lead
  const fetchTasks = useCallback(async () => {
    if (!userToken?.access_token || !name) return;
    try {
      const res = await fetchTasksWithOwner("CRM Lead", name, userToken.access_token, 100, 0);
      setTasks(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load Lead tasks:", err);
    }
  }, [name, userToken?.access_token]);

  // Fetch comments/timeline
  const fetchComments = useCallback(async () => {
    if (!userToken?.access_token || !name) return;
    try {
      const commentsRes = await fetchTimelineComments("CRM Lead", name, userToken.access_token);
      const commentsArray = Array.isArray(commentsRes) ? commentsRes : commentsRes?.data || [];
      setComments(commentsArray);
    } catch (err) {
      console.error("Failed to load Lead comments:", err);
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

  // Update Status / Stage
  const handleUpdateStatus = async (newStatus: string) => {
    if (!userToken?.access_token || !name) return;
    try {
      const res = await updateFieldCustomDocument("CRM Lead", name, { lead_status: newStatus }, userToken.access_token);
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

  // Add Note
  const handleAddNote = async () => {
    if (!noteText.trim() || !userToken?.access_token) return;
    try {
      const cleanText = noteText.trim();
      const res = await postNote({
        doctype: "FCRM Note",
        reference_doctype: "CRM Lead",
        reference_docname: name,
        content: cleanText,
        title: cleanText.replace(/<[^>]*>?/gm, '').substring(0, 80) || "Note",
        owner: userToken?.full_name || userToken?.username || "System",
        modified_by: userToken?.full_name || userToken?.username || "System"
      }, userToken.access_token);

      setNoteText("");
      showToast("Note saved successfully", "success");
      await fetchNotes();
    } catch (err) {
      showToast("Failed to save note", "error");
    }
  };

  // Open the Edit Task drawer with the FULL task document.
  // The list items come from a custom endpoint (partial, non-doctype shape), so we fetch
  // the complete CRM Task record to prefill every form field correctly.
  const handleEditTaskStart = async (task: Task) => {
    if (!userToken?.access_token || !task?.name) {
      setEditingTask(task);
      return;
    }
    try {
      const full = await getDocument("CRM Task", task.name, userToken.access_token);
      if (full) {
        // Drop Frappe timestamp/meta keys so the later update isn't rejected by the
        // optimistic-lock check and only real field values are prefilled.
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

  // Begin inline-editing a note
  const handleEditNoteStart = (n: any) => {
    setEditingNoteId(n.name);
    setEditingNoteText((n.content || "").replace(/<[^>]*>?/gm, ""));
  };

  // Save an inline-edited note
  const handleEditNoteSave = async (n: any) => {
    const cleanText = editingNoteText.trim();
    if (!cleanText || !userToken?.access_token) return;
    try {
      const res = await updateResource(
        "FCRM Note",
        n.name,
        { content: cleanText, title: cleanText.substring(0, 80) || "Note" },
        userToken.access_token
      );
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

  // Generic row-level delete (Notes / Tasks) confirmed through ConfirmDialog
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

  // Delete Lead
  const handleDeleteLead = async () => {
    if (!userToken?.access_token || !name) return;
    setDeleteDialogOpen(false);
    try {
      const res = await deleteResource("CRM Lead", name, userToken.access_token);
      showToast("Lead deleted successfully", "success");
      router.push("/leads");
    } catch (err) {
      showToast("Failed to delete lead", "error");
    }
  };

  // Scroll to section helper
  const handleRelatedClick = (label: string) => {
    if (label === "Stage History") {
      setActiveTab("timeline");
      return;
    }
    setActiveTab("overview");
    setTimeout(() => {
      const id = `section-${label.toLowerCase()}`;
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
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
        <p className="text-slate-500 font-semibold">Lead not found</p>
        <Link href="/leads" className="text-[#1D4ED8] text-[15px] font-bold hover:underline">
          ← Back to Leads
        </Link>
      </div>
    );
  }

  const fullName = recordData.lead_name || [recordData.salutation, recordData.first_name, recordData.last_name].filter(Boolean).join(" ") || "Unnamed Lead";
  const avColor = getAvatarColor(fullName);
  const avInit = getInitials(fullName);
  const currentStatus: string = recordData.lead_status || statusOptions[0]?.value || "";
  const pipelineIdx = statusOptions.findIndex((o) => o.value === currentStatus);
  const currentOption = statusOptions.find((o) => o.value === currentStatus);
  const cfg = deriveStatusCfg(currentOption?.color, isDark);

  // Won / Lost shortcut buttons — matched against the dynamic status picklist.
  const wonStatus = statusOptions.find((o) => /won|qualif/i.test(`${o.value} ${o.label || ""}`));
  const lostStatus = statusOptions.find((o) => /lost|disqualif|junk/i.test(`${o.value} ${o.label || ""}`));

  // Map activities for Timeline
  const activityFeed = [
    {
      icon: UserPlus,
      color: "#2F6FED",
      bg: isDark ? "#27272A" : "#EFF6FF",
      text: `Lead created by ${recordData.owner || "System"}`,
      time: recordData.creation
    },
    ...comments.map(c => ({
      icon: Note,
      color: "#7C3AED",
      bg: isDark ? "#27272A" : "#EFF6FF",
      text: c.comment_type === "Comment" ? `Comment: ${c.content?.replace(/<[^>]*>?/gm, '')}` : `Note added`,
      time: c.creation
    }))
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  // Related list configuration
  const relatedItems = [
    { icon: Note, label: "Notes", count: notes.length, color: "#7C3AED" },
    { icon: ClipboardText, label: "Tasks", count: tasks.length, color: "#3B82F6" },
    { icon: Phone, label: "Calls", count: 0, color: "#DB5E8C" },
    { icon: Envelope, label: "Emails", count: 0, color: "#E0883F" },
    { icon: Paperclip, label: "Attachments", count: attachmentCount, color: "#94A3B8" },
    { icon: ClockCounterClockwise, label: "Stage History", count: activityFeed.length, color: isDark ? "#38BDF8" : "#0C2472" }
  ];

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

  return (
    <div className={`min-h-screen !bg-transparent ${isDark ? "text-[#F4F4F5]" : "text-slate-800"}`}>
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Lead"
        message="Are you sure you want to delete this lead? This action cannot be undone."
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteLead}
      />

      <div className="max-w-[1600px] mx-auto space-y-4 bg-[#EBF3FE]">
        {/* ══ Breadcrumbs ══ */}
        <div className={`flex items-center gap-1.5 text-[13.5px] ${isDark ? "text-[#ABABAD]" : "text-slate-400"}`}>
          <House size={16} weight="duotone" />
          <CaretRight size={12} weight="duotone" />
          <Link href="/leads" className="hover:text-[#1D4ED8] transition-colors font-medium">Leads</Link>
          <CaretRight size={12} weight="duotone" />
          <span className="text-[#1D4ED8] font-semibold truncate max-w-[240px]">{fullName}</span>
        </div>

        {/* ══════════════════════════ HEADER CARD ══════════════════════════ */}
        <div className={`rounded-2xl border px-5 py-6 ${isDark ? "bg-[#1C1C1E] border-[#27272A]" : "bg-[#f9fbff] border-[#E3ECFC]"}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <Avatar
                  sx={{
                    width: 56,
                    height: 56,
                    bgcolor: avColor,
                    fontSize: "1.2rem",
                    fontWeight: 800,
                    boxShadow: "0 4px 14px 0 rgba(12,36,114,0.2)"
                  }}
                >
                  {avInit}
                </Avatar>
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-zinc-800" style={{ backgroundColor: cfg?.dot }} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className={`text-[20px] font-extrabold font-heading tracking-tight leading-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                    {fullName}
                  </h1>
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11.5px] font-bold"
                    style={{ backgroundColor: cfg?.bg, color: cfg?.text }}
                  >
                    <span className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: cfg?.dot }} />
                    {currentStatus}
                  </span>
                </div>
                <p className="text-[14px] text-slate-500 dark:text-[#ABABAD] font-medium flex items-center gap-1.5 flex-wrap">
                  <Buildings size={13} color="#94A3B8" weight="duotone" />
                  {recordData.job_title ? `${recordData.job_title} at ` : ""}
                  <span className="font-semibold">{recordData.company_name || recordData.organization || "—"}</span>
                  {recordData.industry && (
                    <>
                      <span className="text-slate-300">·</span>
                      <span className={isDark ? "text-[#ABABAD]" : "text-slate-400"}>{recordData.industry}</span>
                    </>
                  )}
                </p>
                <p className={`text-[12px] mt-0.5 ${isDark ? "text-[#ABABAD]" : "text-slate-400"}`}>
                  Lead ID: {name} · Created {formatDate(recordData.creation)}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {recordData.mobile_no && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Phone size={14} weight="duotone" />}
                  component="a"
                  href={`tel:${recordData.mobile_no}`}
                  sx={{
                    borderColor: isDark ? "#27272A" : "#E3ECFC",
                    color: isDark ? "#B4B5B6" : "#1D4ED8",
                    borderRadius: "9px",
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: "0.84rem",
                    bgcolor: isDark ? "#0F0F0F" : "transparent",
                    "&:hover": {
                      borderColor: "#1D4ED8",
                      color: "#1D4ED8",
                      bgcolor: isDark ? "#0A0A0A" : "#EFF6FF"
                    }
                  }}
                >
                  Call
                </Button>
              )}

              {recordData.email_id && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Envelope size={14} weight="duotone" />}
                  component="a"
                  href={`mailto:${recordData.email_id}`}
                  sx={{
                    borderColor: isDark ? "#27272A" : "#E3ECFC",
                    color: isDark ? "#B4B5B6" : "#1D4ED8",
                    borderRadius: "9px",
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: "0.84rem",
                    bgcolor: isDark ? "#0F0F0F" : "transparent",
                    "&:hover": {
                      borderColor: "#1D4ED8",
                      color: "#1D4ED8",
                      bgcolor: isDark ? "#0A0A0A" : "#EFF6FF"
                    }
                  }}
                >
                  Email
                </Button>
              )}

              <Button
                variant="outlined"
                onClick={() => router.push(`/leads/convert/${encodeURIComponent(name)}`)}
                startIcon={<ArrowsLeftRight size={14} weight="duotone" />}
                sx={{
                  borderColor: isDark ? "#27272A" : "#E3ECFC",
                  color: isDark ? "#B4B5B6" : "#1D4ED8",
                  borderRadius: "9px",
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "0.84rem",
                  bgcolor: isDark ? "#0F0F0F" : "transparent",
                  "&:hover": {
                    borderColor: "#1D4ED8",
                    color: "#1D4ED8",
                    bgcolor: isDark ? "#0A0A0A" : "#EFF6FF"
                  }
                }}
              >
                Convert
              </Button>

              <Button
                variant="contained"
                onClick={() => setEditOpen(true)}
                startIcon={<PencilSimple size={14} weight="duotone" />}
                sx={{
                  bgcolor: "#1D4ED8",
                  borderRadius: "9px",
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "0.84rem",
                  boxShadow: "0 1px 8px 0 #1D4ED833",
                  "&:hover": {
                    bgcolor: "#60A5FA",
                    boxShadow: "0 2px 14px 0 #60A5FA55"
                  },
                  "&:active": {
                    bgcolor: "#0C2472"
                  }
                }}
              >
                Edit
              </Button>

              <IconButton
                size="small"
                onClick={e => setMoreAnchor(e.currentTarget)}
                sx={{
                  borderRadius: "8px",
                  border: isDark ? "1.5px solid #27272A" : "1.5px solid #E3ECFC",
                  bgcolor: moreAnchor ? (isDark ? "#27272A" : "#EFF6FF") : (isDark ? "#0A0A0A" : "transparent"),
                  "&:hover": {
                    bgcolor: isDark ? "#27272A" : "#EFF6FF"
                  }
                }}
              >
                <DotsThreeVertical size={17} color="#94A3B8" weight="duotone" />
              </IconButton>
              <Menu
                anchorEl={moreAnchor}
                open={Boolean(moreAnchor)}
                onClose={() => setMoreAnchor(null)}
                PaperProps={{
                  sx: {
                    borderRadius: "12px",
                    mt: 1,
                    minWidth: 160,
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                    border: isDark ? "1px solid #27272A" : "1px solid #E2E8F0",
                    bgcolor: isDark ? "#1C1C1E" : "#FFFFFF"
                  }
                }}
              >
                {/* <MenuItem onClick={() => { setMoreAnchor(null); showToast("Feature not available in demo", "warning"); }}>
                  <ListItemIcon><Envelope size={16} color="#3B82F6" weight="duotone" /></ListItemIcon>
                  <ListItemText primary="Send Email" sx={{ color: isDark ? "#E2E8F0" : "#334155" }} />
                </MenuItem>
                <MenuItem onClick={() => { setMoreAnchor(null); showToast("Feature not available in demo", "warning"); }}>
                  <ListItemIcon><Users size={16} color="#2E9E7B" weight="duotone" /></ListItemIcon>
                  <ListItemText primary="Assign to Team" sx={{ color: isDark ? "#E2E8F0" : "#334155" }} />
                </MenuItem>
                <MenuItem onClick={() => { setMoreAnchor(null); showToast("Feature not available in demo", "warning"); }}>
                  <ListItemIcon><Copy size={16} color="#5B6CB5" weight="duotone" /></ListItemIcon>
                  <ListItemText primary="Duplicate Lead" sx={{ color: isDark ? "#E2E8F0" : "#334155" }} />
                </MenuItem> */}
                <MenuItem onClick={() => { setMoreAnchor(null); showToast("Feature not available in demo", "warning"); }}>
                  <ListItemIcon><DownloadSimple size={16} color="#94A3B8" weight="duotone" /></ListItemIcon>
                  <ListItemText primary="Export as PDF" sx={{ color: isDark ? "#E2E8F0" : "#334155" }} />
                </MenuItem>
                <Divider sx={{ my: 0.5, borderColor: isDark ? "#27272A" : "#EFF6FF" }} />
                <MenuItem onClick={() => { setMoreAnchor(null); setDeleteDialogOpen(true); }} sx={{ color: "#EF4444" }}>
                  <ListItemIcon><Trash size={16} color="#EF4444" weight="duotone" /></ListItemIcon>
                  <ListItemText primary="Delete Lead" sx={{ color: "#EF4444" }} />
                </MenuItem>
              </Menu>
            </div>
          </div>
        </div>

        {/* ══ Tab Bar ══ */}
        <div className={`flex items-center gap-1 border rounded-xl p-1 w-fit shadow-sm1 ${isDark ? "bg-[#000000] border-[#27272A]" : "bg-[#f9fbff] border-[#E3ECFC]"}`}>
          {([{ key: "overview", label: "Overview" }, { key: "timeline", label: "Timeline" }] as const).map(({ key, label }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`px-4 py-1.5 rounded-lg text-[14px] font-semibold transition-all ${activeTab === key ? "bg-[#1D4ED8] text-white shadow-sm1"
                  : isDark ? "text-[#B4B5B6] bg-[#0A0A0A] hover:bg-[#27272A] hover:text-[#D4D4D8]"
                    : "text-[#0C2472] bg-[#E3ECFC] hover:bg-[#1D4ED8]/10"
                }`}>
              {label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════ MAIN CONTENT ══════════════════════════ */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            {/* Left 2/3 */}
            <div className="lg:col-span-2 space-y-4 min-w-0">
              {/* ── Stage Pipeline ── */}
              <div className={`rounded-2xl border shadow-sm1 p-5 ${isDark ? "bg-[#1C1C1E] border-[#27272A]" : "bg-[#f9fbff] border-[#E3ECFC]"}`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className={`font-heading text-[12px] font-bold uppercase tracking-widest ${isDark ? "text-[#ABABAD]" : "text-slate-400"}`}>Stage Progress</p>
                    <p className="text-[12px] text-slate-500 mt-0.5">Click a stage to update · Started <span className="font-semibold text-slate-700">{formatDate(recordData.creation)}</span></p>
                  </div>
                  <div className="text-right">
                    <p className={`font-heading text-[12px] font-bold uppercase tracking-widest ${isDark ? "text-[#ABABAD]" : "text-slate-400"}`}>Last Updated</p>
                    <p className="text-[12px] font-semibold text-slate-700 mt-0.5">{formatDate(recordData.modified)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 flex-1 overflow-x-auto pb-1.5 pipeline-scroll">
                  {statusOptions.map((stage, i) => {
                    const isDone = i < pipelineIdx;
                    const isActive = i === pipelineIdx;
                    const isPending = i > pipelineIdx;
                    const accent = stage.color || "#1D4ED8";
                    const activeStyle = isActive
                      ? { backgroundColor: accent, color: "#fff", boxShadow: `0 4px 12px ${hexWithAlpha(accent, 0.25)}` }
                      : isDone
                        ? { backgroundColor: hexWithAlpha(accent, isDark ? 0.28 : 0.14), color: isDark ? "#D4D4D8" : accent }
                        : undefined;
                    return (
                      <div key={stage.value} className="flex items-center gap-1 flex-shrink-0">
                        <Tooltip title={isDone ? "Completed" : isActive ? "Current stage" : "Click to set stage"}>
                          <button
                            onClick={() => handleUpdateStatus(stage.value)}
                            style={activeStyle}
                            className={`flex items-center justify-center gap-1.5 flex-shrink-0 whitespace-nowrap py-2 px-3 rounded-xl text-[12.5px] font-bold transition-all
                              ${isActive ? "scale-[1.02]" : ""}
                              ${isPending ? isDark ? "bg-transparent text-[#ABABAD] border border-[#27272A] hover:bg-[#27272A] hover:text-[#D4D4D8]" : "bg-transparent text-slate-400 border border-transparent hover:bg-[#E3ECFC] hover:text-[#1D4ED8]" : ""}
                            `}
                          >
                            {isDone && <Check size={12} weight="duotone" />}
                            <span>{stage.label || stage.value}</span>
                          </button>
                        </Tooltip>
                        {i < statusOptions.length - 1 && (
                          <CaretRight size={16} color={isDone || isActive ? (isDark ? "#60A5FA" : "#1D4ED8") : (isDark ? "#71717A" : "#CBD5E1")} weight="duotone" style={{ flexShrink: 0 }} />
                        )}
                      </div>
                    );
                  })}
                  </div>

                  {/* Won / Lost buttons */}
                  {(wonStatus || lostStatus) && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {wonStatus && (
                        <Tooltip title={`Mark as ${wonStatus.label || wonStatus.value}`}>
                          <button onClick={() => handleUpdateStatus(wonStatus.value)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all text-[17px]
                              ${currentStatus === wonStatus.value ? "bg-emerald-500 scale-110" : "bg-emerald-50 hover:bg-emerald-100"}`}>
                            👍
                          </button>
                        </Tooltip>
                      )}
                      {lostStatus && (
                        <Tooltip title={`Mark as ${lostStatus.label || lostStatus.value}`}>
                          <button onClick={() => handleUpdateStatus(lostStatus.value)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all text-[17px]
                              ${currentStatus === lostStatus.value ? "bg-red-500 scale-110" : "bg-red-50 hover:bg-red-100"}`}>
                            👎
                          </button>
                        </Tooltip>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Lead Source", value: recordData.source || "—", icon: TrendUp, fill: isDark ? "#1A2D4A" : "#D6E4F9", deep: isDark ? "#60A5FA" : "#2F6FED" },
                  { label: "Rating", value: recordData.rating || "—", icon: Star, fill: isDark ? "#1A2D3A" : "#D0E5E0", deep: isDark ? "#34D399" : "#2E9E7B" },
                  { label: "Industry", value: recordData.industry || "—", icon: Buildings, fill: isDark ? "#2A1E10" : "#FAE3D0", deep: isDark ? "#FB923C" : "#E0883F" },
                  { label: "Employees", value: recordData.no_of_employees || "—", icon: User, fill: isDark ? "#2A1828" : "#F5D9E1", deep: isDark ? "#F472B6" : "#DB5E8C" }
                ].map(({ label, value, icon: Icon, fill, deep }) => (
                  <div
                    key={label}
                    className="rounded-xl border border-white/50 dark:border-zinc-800 p-3.5"
                    style={{ backgroundColor: fill, boxShadow: "0 6px 24px rgba(15,23,42,0.06)" }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center mb-2"
                      style={{ backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(249,251,255,0.7)" }}
                    >
                      <Icon size={15} color={deep} weight="duotone" />
                    </div>
                    <p className="font-heading text-[12px] font-bold uppercase tracking-wider mb-0.5" style={{ color: isDark ? "#94A3B8" : "#475569" }}>
                      {label}
                    </p>
                    <p className="text-[14px] font-bold truncate" style={{ color: isDark ? "#FFFFFF" : "#0C2472" }}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Personal Info */}
              <SectionCard icon={User} title="Personal Information">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                  <KV label="Salutation" value={recordData.salutation} />
                  <KV label="First Name" value={recordData.first_name} />
                  <KV label="Last Name" value={recordData.last_name} />
                  <KV label="Title" value={recordData.job_title} />
                  <KV label="Company" value={recordData.company_name || recordData.organization} />
                  <KV label="Industry" value={recordData.industry} />
                  <KV label="Email Opt Out" value={recordData.email_opt_out ? "Yes" : "No"} />
                  <KV label="Description" value={recordData.description} />
                </div>
              </SectionCard>

              {/* Contact Details */}
              <SectionCard icon={AddressBook} title="Contact Details">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                  <KV label="Email" value={recordData.email_id} blue={!!recordData.email_id} />
                  <KV label="Phone" value={recordData.phone} />
                  <KV label="Mobile" value={recordData.mobile_no} />
                  <KV label="Fax" value={recordData.fax} />
                  <KV label="Website" value={recordData.website} blue={!!recordData.website} />
                </div>
              </SectionCard>

              {/* Lead Details */}
              <SectionCard icon={TrendUp} title="Lead Details">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                  <KV label="Lead Source" value={recordData.source} />
                  <KV label="Lead Status" value={currentStatus} />
                  <KV label="Rating" value={recordData.rating} />
                  <KV label="No. of Employees" value={recordData.no_of_employees} />
                  <KV label="Annual Revenue" value={recordData.annual_revenue ? `₹${Number(recordData.annual_revenue).toLocaleString("en-IN")}` : ""} />
                </div>
              </SectionCard>

              {/* Notes Card */}
              <div id="section-notes">
                <SectionCard icon={Note} title="Notes">
                  <div className="space-y-4">
                    <div className={`border rounded-xl overflow-hidden transition-all ${isDark ? "border-[#3F3F46] focus-within:border-[#9CA3AF]" : "border-[#E3ECFC] focus-within:border-[#1D4ED8] focus-within:shadow-[0_0_0_2px_#4A7AE8]"
                      }`}>
                      <InputBase
                        fullWidth
                        multiline
                        minRows={2}
                        placeholder="Add a note…"
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        sx={{
                          px: 2,
                          py: 1.5,
                          fontSize: "0.8rem",
                          color: isDark ? "#D4D4D8" : "#334155",
                          "& textarea::placeholder": { color: isDark ? "#71717A" : "#94A3B8", opacity: 1 }
                        }}
                      />
                      {noteText.trim() && (
                        <div className="flex justify-end px-3 pb-2">
                          <Button
                            size="small"
                            variant="contained"
                            onClick={handleAddNote}
                            sx={{
                              bgcolor: isDark ? "#27272A" : "#E3ECFC",
                              color: isDark ? "#F4F4F5" : "#0C2472",
                              borderRadius: "8px",
                              textTransform: "none",
                              fontWeight: 700,
                              fontSize: "0.73rem",
                              "&:hover": { bgcolor: isDark ? "#3F3F46" : "#D0DEFA" }
                            }}
                          >
                            Save Note
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      {notes.map((n, i) => (
                        <div
                          key={n.name || i}
                          className={`group relative rounded-xl px-4 py-3 border ${isDark ? "bg-[#27272A] border-[#3F3F46]" : "bg-[#EFF6FF] border-[#E3ECFC]"
                            }`}
                        >
                          {editingNoteId && editingNoteId === n.name ? (
                            <div className="space-y-2">
                              <textarea
                                autoFocus
                                value={editingNoteText}
                                onChange={(e) => setEditingNoteText(e.target.value)}
                                rows={3}
                                className={`w-full rounded-lg border px-3 py-2 text-[14px] outline-none resize-y ${isDark ? "bg-[#18181B] border-[#3F3F46] text-[#D4D4D8] focus:border-[#9CA3AF]" : "bg-white border-[#E3ECFC] text-slate-700 focus:border-[#1D4ED8]"}`}
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => { setEditingNoteId(null); setEditingNoteText(""); }}
                                  className={`px-3 py-1 rounded-lg text-[12.5px] font-semibold ${isDark ? "text-[#ABABAD] hover:bg-[#3F3F46]" : "text-slate-500 hover:bg-[#E3ECFC]"}`}
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleEditNoteSave(n)}
                                  disabled={!editingNoteText.trim()}
                                  className="px-3 py-1 rounded-lg text-[12.5px] font-semibold bg-[#1D4ED8] text-white hover:bg-[#1E40AF] transition-colors disabled:opacity-50"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-start justify-between gap-2">
                                <p className={`flex-1 text-[14px] leading-relaxed ${isDark ? "text-[#D4D4D8]" : "text-slate-700"}`}>
                                  {n.content?.replace(/<[^>]*>?/gm, '')}
                                </p>
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
                                <p className={`text-[11.5px] ${isDark ? "text-[#ABABAD]" : "text-slate-400"}`}>
                                  By {n.owner_name || n.owner}
                                </p>
                                <p className={`text-[11px] ${isDark ? "text-[#ABABAD]" : "text-slate-400"}`}>
                                  {formatDate(n.creation)}
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </SectionCard>
              </div>

              {/* Tasks Section */}
              <div id="section-tasks">
                <SectionCard
                  icon={ClipboardText}
                  title="Tasks"
                  action={
                    <button
                      onClick={() => setTaskDrawerOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold bg-[#1D4ED8] text-white hover:bg-[#1E40AF] transition-colors"
                    >
                      <Plus size={13} weight="bold" />
                      New Task
                    </button>
                  }
                >
                  {tasks.length === 0 ? (
                    <div className={`flex items-center justify-center py-6 text-[14px] ${isDark ? "text-[#3F3F46]" : "text-slate-400"}`}>
                      No tasks yet
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {tasks.map((task) => (
                        <div
                          key={task.name}
                          className={`group flex items-center justify-between gap-3 rounded-xl px-4 py-3 border ${isDark ? "bg-[#27272A] border-[#3F3F46]" : "bg-[#EFF6FF] border-[#E3ECFC]"}`}
                        >
                          <div className="min-w-0">
                            <p className={`text-[14px] font-medium truncate ${isDark ? "text-[#D4D4D8]" : "text-slate-700"}`}>
                              {task.title || "Untitled task"}
                            </p>
                            {task.due_date && (
                              <p className={`text-[12px] mt-0.5 ${isDark ? "text-[#ABABAD]" : "text-slate-400"}`}>Due {formatDate(task.due_date)}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {task.status && (
                              <span className={`text-[11.5px] font-bold px-2 py-0.5 rounded-full ${isDark ? "bg-[#3F3F46] text-[#D4D4D8]" : "bg-[#E3ECFC] text-[#1D4ED8]"}`}>
                                {task.status}
                              </span>
                            )}
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Tooltip title="Edit task">
                                <IconButton size="small" onClick={() => handleEditTaskStart(task)} sx={{ p: 0.5 }}>
                                  <PencilSimple size={14} color={isDark ? "#9CA3AF" : "#64748B"} weight="duotone" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete task">
                                <IconButton size="small" onClick={() => setDeleteTarget({ doctype: "CRM Task", id: task.name, label: "Task", refetch: fetchTasks })} sx={{ p: 0.5 }}>
                                  <Trash size={14} color="#EF4444" weight="duotone" />
                                </IconButton>
                              </Tooltip>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </SectionCard>
              </div>

              {/* Calls Section */}
              <div id="section-calls">
                <SectionCard icon={Phone} title="Calls">
                  <div className={`flex items-center justify-center py-6 text-[14px] ${isDark ? "text-[#3F3F46]" : "text-slate-400"}`}>
                    No calls yet
                  </div>
                </SectionCard>
              </div>

              {/* Emails Section */}
              <div id="section-emails">
                <SectionCard icon={Envelope} title="Emails">
                  <div className={`flex items-center justify-center py-6 text-[14px] ${isDark ? "text-[#3F3F46]" : "text-slate-400"}`}>
                    No emails yet
                  </div>
                </SectionCard>
              </div>

              {/* Attachments (shared common Attachments UI) */}
              <AttachmentsSection doctype="CRM Lead" name={name} onCountChange={setAttachmentCount} />
            </div>

            {/* Right Column (1/3) */}
            <div className="space-y-4 lg:sticky lg:top-[100px] self-start">
              {/* Related List links */}
              <div className={`rounded-2xl border shadow-sm1 overflow-hidden w-full ${isDark ? "bg-[#1C1C1E] border-[#27272A]" : "bg-[#f9fbff] border-[#E3ECFC]"}`}>
                <div className={`px-4 py-3.5 border-b ${isDark ? "border-[#27272A]" : "border-[#EFF6FF]"}`}>
                  <p className={`font-heading text-[12px] font-bold uppercase tracking-wider ${isDark ? "text-[#ABABAD]" : "text-slate-500"}`}>
                    Related List
                  </p>
                </div>
                <div className="p-2 space-y-0.5">
                  {relatedItems.map(({ icon: Icon, label, count, color }) => (
                    <button
                      key={label}
                      onClick={() => handleRelatedClick(label)}
                      className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl group transition-colors bg-transparent ${isDark ? "hover:bg-[#27272A]" : "hover:bg-[#EFF6FF]"
                        }`}
                    >
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: color + "20" }}>
                        <Icon size={14} color={color} weight="duotone" />
                      </div>
                      <span className={`flex-1 text-left text-[14px] font-medium transition-colors min-w-0 truncate ${isDark ? "text-[#D4D4D8] group-hover:text-white" : "text-slate-700 group-hover:text-slate-900"}`}>
                        {label}
                      </span>
                      {count > 0 && (
                        <span className="text-[12px] font-bold bg-[#E3ECFC] dark:bg-[#1E3A8A] text-[#1D4ED8] dark:text-[#60A5FA] px-1.5 py-0.5 rounded-full">
                          {count}
                        </span>
                      )}
                      <CaretRight size={14} className="text-slate-300 dark:text-slate-600 group-hover:text-[#1D4ED8] dark:group-hover:text-[#60A5FA] transition-colors" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Lead Owner Card */}
              <div className={`rounded-2xl border shadow-sm1 p-4 space-y-3 ${isDark ? "bg-[#1C1C1E] border-[#27272A]" : "bg-[#f9fbff] border-[#E3ECFC]"}`}>
                <p className={`font-heading text-[12px] font-bold uppercase tracking-wider ${isDark ? "text-[#ABABAD]" : "text-slate-500"}`}>
                  Ownership
                </p>
                <div className="flex items-center gap-2.5">
                  <Avatar sx={{ width: 32, height: 32, bgcolor: "#3B82F6", fontSize: "0.72rem", fontWeight: 800 }}>
                    {recordData.owner ? getInitials(recordData.owner) : "SU"}
                  </Avatar>
                  <div>
                    <p className={`text-[14px] font-semibold ${isDark ? "text-[#F4F4F5]" : "text-slate-800"}`}>
                      {recordData.owner || "System User"}
                    </p>
                    <p className={`text-[12px] ${isDark ? "text-[#ABABAD]" : "text-slate-400"}`}>Lead Owner</p>
                  </div>
                </div>
                <Divider sx={{ borderColor: isDark ? "#27272A" : "#EFF6FF" }} />
                <div className="space-y-2">
                  <div className="flex justify-between text-[12px]">
                    <span className={`font-medium ${isDark ? "text-[#ABABAD]" : "text-slate-400"}`}>Created</span>
                    <span className={`font-semibold ${isDark ? "text-[#D4D4D8]" : "text-slate-700"}`}>
                      {formatDate(recordData.creation)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className={`font-medium ${isDark ? "text-[#ABABAD]" : "text-slate-400"}`}>Modified</span>
                    <span className={`font-semibold ${isDark ? "text-[#D4D4D8]" : "text-slate-700"}`}>
                      {formatDate(recordData.modified)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════ TIMELINE FEED ══════════════════════════ */}
        {activeTab === "timeline" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            <div className={`lg:col-span-2 rounded-2xl border shadow-sm1 ${isDark ? "bg-[#1C1C1E] border-[#27272A]" : "bg-[#f9fbff] border-[#E3ECFC]"}`}>
              <div className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? "border-[#27272A]" : "border-[#EFF6FF]"}`}>
                <p className={`font-heading text-[12px] font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>Timeline</p>
                <span className={`text-[12px] font-semibold px-2 py-0.5 rounded-full ${isDark ? "bg-[#27272A] text-[#ABABAD]" : "bg-slate-100 text-slate-400"}`}>
                  {activityFeed.length} events
                </span>
              </div>
              <div className="px-5 py-4 space-y-0">
                {activityFeed.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="flex gap-4 group">
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center z-10" style={{ backgroundColor: item.bg }}>
                          <Icon size={15} color={item.color} weight="duotone" />
                        </div>
                        {i < activityFeed.length - 1 && (
                          <div className={`w-px flex-1 my-1 min-h-[20px] ${isDark ? "bg-[#27272A]" : "bg-[#E3ECFC]"}`} />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className={`text-[14px] font-medium mt-1 ${isDark ? "text-[#D4D4D8] group-hover:text-white" : "text-slate-700 group-hover:text-slate-900"} transition-colors`}>
                          {item.text}
                        </p>
                        <p className={`text-[12px] mt-0.5 flex items-center gap-1 ${isDark ? "text-[#ABABAD]" : "text-slate-400"}`}>
                          <Clock size={11} weight="duotone" />
                          {formatDate(item.time)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right sidebar related list still visible */}
            <div className="space-y-4 lg:sticky lg:top-[100px] self-start">
              <div className={`rounded-2xl border shadow-sm1 overflow-hidden w-full ${isDark ? "bg-[#1C1C1E] border-[#27272A]" : "bg-[#f9fbff] border-[#E3ECFC]"}`}>
                <div className={`px-4 py-3.5 border-b ${isDark ? "border-[#27272A]" : "border-[#EFF6FF]"}`}>
                  <p className={`font-heading text-[12px] font-bold uppercase tracking-wider ${isDark ? "text-[#ABABAD]" : "text-slate-500"}`}>
                    Related List
                  </p>
                </div>
                <div className="p-2 space-y-0.5">
                  {relatedItems.map(({ icon: Icon, label, count, color }) => (
                    <button
                      key={label}
                      onClick={() => handleRelatedClick(label)}
                      className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl group transition-colors bg-transparent ${isDark ? "hover:bg-[#27272A]" : "hover:bg-[#EFF6FF]"
                        }`}
                    >
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: color + "20" }}>
                        <Icon size={14} color={color} weight="duotone" />
                      </div>
                      <span className={`flex-1 text-left text-[14px] font-medium transition-colors min-w-0 truncate ${isDark ? "text-[#D4D4D8] group-hover:text-white" : "text-slate-700 group-hover:text-slate-900"}`}>
                        {label}
                      </span>
                      {count > 0 && (
                        <span className="text-[12px] font-bold bg-[#E3ECFC] dark:bg-[#1E3A8A] text-[#1D4ED8] dark:text-[#60A5FA] px-1.5 py-0.5 rounded-full">
                          {count}
                        </span>
                      )}
                      <CaretRight size={14} className="text-slate-300 dark:text-slate-600 group-hover:text-[#1D4ED8] dark:group-hover:text-[#60A5FA] transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Drawer */}
      {editOpen && (
        <AddEditLeadDrawer
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
          reference_doctype="CRM Lead"
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
          reference_doctype="CRM Lead"
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
