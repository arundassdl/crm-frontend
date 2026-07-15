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
  Avatar,
  CircularProgress,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

// Phosphor Duotone Icons (matches reference: crm-app-UI-Arun-Latest/components/contacts/ContactDetail.tsx)
import {
  House,
  CaretRight,
  PencilSimple,
  DotsThreeVertical,
  Note,
  ClipboardText,
  Paperclip,
  ClockCounterClockwise,
  Plus,
  Trash,
  UserCircle,
  MapPin,
  Handshake,
  Phone,
  Envelope,
  Buildings,
  DownloadSimple,
} from "@phosphor-icons/react";

import { readAccessTokenDataParsed } from "@/utils/accessTokenDataStorage";
import {
  getDocument,
  postNote,
  deleteResource,
} from "@/services/api/common-erpnext-api/create-edit-api";
import {
  fetchNotesWithOwner,
  fetchTimelineComments,
  fetchTasksWithOwner,
  Task,
} from "@/services/api/common-erpnext-api/create-update-custom-api";
import { getFormFields, getRelatedList, getLayoutList } from "@/services/api/general_apis/layout-api";
import AddEditTaskDrawer from "@/components/Tasks/CreateEdit";
import AddEditConctactDrawer from "@/components/Contact/Createcontact";
import DynamicRelatedSection from "@/components/Common/RelatedList/DynamicRelatedSection";
import { getRelatedListKind, getRelatedListMeta } from "@/components/Common/RelatedList/relatedListMeta";
import AttachmentsSection from "@/components/Common/Upload/AttachmentsSection";
import { showToast } from "@/components/ToastNotificationNew";
import ConfirmDialog from "@/components/UI/ConfirmDialog";
import { getAvatarColor } from "@/@core/utils/avatarColor";


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
export default function ContactDetailDashboard({ name }: { name: string }) {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // Data state
  const [loading, setLoading] = useState(true);
  const [recordData, setRecordData] = useState<any>(null);
  const [layoutFields, setLayoutFields] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  // Related-list sections + counts come from the Settings "Detail View" config.
  const [selectedLayoutId, setSelectedLayoutId] = useState<string>("");
  const [relatedLists, setRelatedLists] = useState<any[]>([]);
  const [relatedCounts, setRelatedCounts] = useState<Record<string, number>>({});

  // UI state
  const [activeTab, setActiveTab] = useState<"overview" | "timeline">("overview");
  const [editOpen, setEditOpen] = useState(false);
  const [taskDrawerOpen, setTaskDrawerOpen] = useState(false);
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
      const details = await getDocument("Contact", name, userToken.access_token);
      if (details) setRecordData(details);
    } catch (err) {
      console.error("Failed to load Contact details:", err);
    }
  }, [name, userToken?.access_token]);

  const fetchNotes = useCallback(async () => {
    if (!userToken?.access_token || !name) return;
    try {
      const res = await fetchNotesWithOwner("Contact", name, userToken.access_token);
      setNotes(Array.isArray(res) ? res : res?.data || []);
    } catch (err) {
      console.error("Failed to load Contact notes:", err);
    }
  }, [name, userToken?.access_token]);

  const fetchTasks = useCallback(async () => {
    if (!userToken?.access_token || !name) return;
    try {
      const res = await fetchTasksWithOwner("Contact", name, userToken.access_token, 100, 0);
      setTasks(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load Contact tasks:", err);
    }
  }, [name, userToken?.access_token]);

  const fetchComments = useCallback(async () => {
    if (!userToken?.access_token || !name) return;
    try {
      const res = await fetchTimelineComments("Contact", name, userToken.access_token);
      setComments(Array.isArray(res) ? res : res?.data || []);
    } catch (err) {
      console.error("Failed to load Contact comments:", err);
    }
  }, [name, userToken?.access_token]);

  // Resolve the active layout (record's layout_id, else module default).
  const resolveLayoutId = useCallback(async () => {
    if (!userToken?.access_token) return;
    try {
      const recordLayout = recordData?.layout_id;
      if (recordLayout != null && String(recordLayout).trim() !== "" && String(recordLayout) !== "0") {
        setSelectedLayoutId(String(recordLayout));
        return;
      }
      const layouts: any[] = await getLayoutList("Contacts", userToken.access_token, userToken.role_profile || "");
      const list = Array.isArray(layouts) ? layouts : [];
      if (list[0]?.value) setSelectedLayoutId(String(list[0].value));
    } catch (err) {
      console.error("Failed to resolve Contact layout id:", err);
    }
  }, [recordData?.layout_id, userToken?.access_token, userToken?.role_profile]);

  // Related-list sections come from the Settings "Detail View" configuration.
  const fetchRelatedLists = useCallback(async () => {
    if (!userToken?.access_token || !selectedLayoutId) return;
    try {
      const res = await getRelatedList("Contacts", selectedLayoutId, userToken.access_token);
      setRelatedLists(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error("Failed to load Contact related lists:", err);
    }
  }, [selectedLayoutId, userToken?.access_token]);

  // Dynamic Contact Information fields from the backend layout (chosen approach:
  // reference layout + dynamic fields, so custom/admin fields are preserved).
  const fetchLayoutFields = useCallback(async () => {
    if (!userToken?.access_token) return;
    try {
      const response: any = await getFormFields("Contacts", userToken.access_token, userToken.role_profile, "");
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
      console.error("Failed to load Contact layout fields:", err);
    }
  }, [userToken?.access_token, userToken?.role_profile]);

  useEffect(() => {
    resolveLayoutId();
  }, [resolveLayoutId]);

  useEffect(() => {
    fetchRelatedLists();
  }, [fetchRelatedLists]);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([
        fetchRecord(),
        fetchLayoutFields(),
        fetchNotes(),
        fetchComments(),
        fetchTasks(),
      ]);
      setLoading(false);
    };
    loadAll();
  }, [fetchRecord, fetchLayoutFields, fetchNotes, fetchComments, fetchTasks]);

  const handleRelatedCount = useCallback((id: string, count: number) => {
    setRelatedCounts((prev) => (prev[id] === count ? prev : { ...prev, [id]: count }));
  }, []);

  // Task keeps its dedicated inline section below, so exclude it here.
  const sectionRelatedLists = relatedLists.filter(
    (rl) => getRelatedListKind(rl.main_doctype_name, rl.label) !== "task"
  );

  // ── Actions ──
  const handleAddNote = async () => {
    if (!noteText.trim() || !userToken?.access_token) return;
    try {
      const cleanText = noteText.trim();
      await postNote({
        doctype: "FCRM Note",
        reference_doctype: "Contact",
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

  const handleDeleteContact = async () => {
    if (!userToken?.access_token || !name) return;
    setDeleteDialogOpen(false);
    try {
      await deleteResource("Contact", name, userToken.access_token);
      showToast("Contact deleted successfully", "success");
      router.push("/contacts");
    } catch (err) {
      showToast("Failed to delete contact", "error");
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
        <p className="text-slate-500 font-semibold">Contact not found</p>
        <Link href="/contacts" className="text-[#1D4ED8] text-[15px] font-bold hover:underline">← Back to Contacts</Link>
      </div>
    );
  }

  // ── Derived fields ──
  const firstName = recordData.first_name || "";
  const lastName = recordData.last_name || "";
  const fullName = recordData.full_name || `${firstName} ${lastName}`.trim() || name;
  const title = recordData.designation || recordData.title || "";
  const account = recordData.company_name || recordData.organization || recordData.account_name || "";
  const contactOwner = recordData.contact_owner || recordData.owner || "";
  const contactOwnerEmail = recordData.owner || recordData.contact_owner_email || "";
  const email = recordData.email_id || recordData.email || "";
  const phone = recordData.phone || "";
  const mobile = recordData.mobile_no || recordData.actual_mobile_no || "";
  const department = recordData.department || "";
  const leadSource = recordData.source || recordData.lead_source || "";
  const mailingAddress = recordData.address || recordData.mailing_address || "";
  const otherAddress = recordData.other_address || "";

  const avColor = getAvatarColor(fullName);
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? (firstName[1] ?? "")}`.toUpperCase() || fullName.substring(0, 2).toUpperCase();

  // Contact Information: dynamic fields from the layout, hydrated from the record.
  const SKIP_FIELDS = new Set(["naming_series", "image", "full_name"]);
  const contactInfoFields = layoutFields
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
      if (ft === "checkbox" || ft === "check") value = value ? true : false;
      return { label: f.label || fn, value, fn };
    });

  // Fallback to the reference's fixed field set if the layout hasn't loaded.
  const contactInfoFallback = [
    { label: "First Name", value: firstName },
    { label: "Last Name", value: lastName },
    { label: "Contact Owner", value: contactOwner },
    { label: "Lead Source", value: leadSource },
    { label: "Account Name", value: account },
    { label: "Email", value: email },
    { label: "Title", value: title },
    { label: "Phone", value: phone },
    { label: "Department", value: department },
    { label: "Mobile", value: mobile },
  ];

  // Timeline activity feed (creation event + comments), newest first.
  const activityFeed = [
    { icon: PencilSimple, text: `Contact created by ${contactOwner || "System"}`, time: recordData.creation, by: contactOwner || recordData.owner || "System" },
    ...comments.map((c) => ({
      icon: Note,
      text: c.comment_type === "Comment" ? `Comment: ${c.content?.replace(/<[^>]*>?/gm, "")}` : `Note added`,
      time: c.creation,
      by: c.owner_name || c.owner || c.comment_by || contactOwner || "System",
    })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  const relatedItems = [
    { label: "Tasks", icon: ClipboardText, count: tasks.length, color: "#10B981" },
    { label: "Notes", icon: Note, count: notes.length, color: "#8B5CF6" },
    { label: "Attachments", icon: Paperclip, count: attachmentCount, color: "#F59E0B" },
    ...sectionRelatedLists.map((rl) => ({
      label: rl.label || rl.main_doctype_name,
      icon: getRelatedListMeta(rl.main_doctype_name, rl.label).icon,
      count: relatedCounts[String(rl.id || rl.name || rl.label)] || 0,
      color: "#64748B",
    })),
  ];

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
        <div className="flex items-center gap-2.5">
          <Avatar sx={{ width: 28, height: 28, bgcolor: getAvatarColor(contactOwner || "?"), fontSize: "0.6rem", fontWeight: 800 }}>
            {(contactOwner || "?").split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)}
          </Avatar>
          <div className="min-w-0">
            <p className={`text-[13px] font-semibold leading-tight ${isDark ? "text-[#D4D4D8]" : "text-slate-700"}`}>{contactOwner || "—"}</p>
            <p className={`text-[11px] truncate ${isDark ? "text-[#ABABAD]" : "text-slate-400"}`}>{contactOwnerEmail}</p>
          </div>
        </div>
        <div className={`h-px ${isDark ? "bg-[#27272A]" : "bg-[#EFF6FF]"}`} />
        <div className="flex justify-between text-[12px]">
          <span className={`font-medium ${isDark ? "text-[#ABABAD]" : "text-slate-400"}`}>Created</span>
          <span className={`font-semibold text-right max-w-[150px] ${isDark ? "text-[#D4D4D8]" : "text-slate-700"}`}>{formatDate(recordData.creation)}</span>
        </div>
        <div className="flex justify-between text-[12px]">
          <span className={`font-medium ${isDark ? "text-[#ABABAD]" : "text-slate-400"}`}>Modified</span>
          <span className={`font-semibold text-right max-w-[150px] ${isDark ? "text-[#D4D4D8]" : "text-slate-700"}`}>{formatDate(recordData.modified)}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen !bg-transparent font-sans ${isDark ? "text-[#F4F4F5]" : "text-slate-800"}`}>
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Contact"
        message="Are you sure you want to delete this contact? This action cannot be undone."
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteContact}
      />

      <div className="max-w-[1600px] mx-auto space-y-4">
        {/* ── Breadcrumb ── */}
        <div className={`flex items-center gap-1.5 text-[13.5px] ${isDark ? "text-[#ABABAD]" : "text-slate-400"}`}>
          <House size={16} weight="duotone" />
          <CaretRight size={12} weight="duotone" />
          <Link href="/contacts" className="hover:text-[#1D4ED8] transition-colors font-medium">Contacts</Link>
          <CaretRight size={12} weight="duotone" />
          <span className="text-[#1D4ED8] font-semibold truncate max-w-[240px]">{fullName}</span>
        </div>

        {/* ── Header card ── */}
        <div className={`rounded-2xl border shadow-sm px-5 py-4 ${isDark ? "bg-[#1C1C1E] border-[#27272A]" : "bg-[#f9fbff] border-[#E3ECFC]"}`}>
          <div className="flex items-start gap-4">
            <Avatar sx={{ width: 56, height: 56, bgcolor: avColor, fontSize: "1.2rem", fontWeight: 800, boxShadow: "0 4px 14px 0 rgba(12,36,114,0.2)", flexShrink: 0 }}>
              {initials}
            </Avatar>
            <div className="flex-1 min-w-0">
              <h1 className={`text-[20px] font-extrabold tracking-tight leading-tight ${isDark ? "text-[#F4F4F5]" : "text-slate-900"}`}>{fullName}</h1>
              {title && <p className={`text-[13px] mt-0.5 ${isDark ? "text-[#ABABAD]" : "text-slate-400"}`}>{title}</p>}
              <p className={`text-[12px] mt-0.5 ${isDark ? "text-[#ABABAD]" : "text-slate-400"}`}>
                ID: {name}
                {account ? <span> · {account}</span> : null}
              </p>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {email && (
                  <span className={`flex items-center gap-1 text-[12px] ${isDark ? "text-[#ABABAD]" : "text-slate-500"}`}>
                    <Envelope size={12} color="#94A3B8" weight="duotone" />{email}
                  </span>
                )}
                {phone && (
                  <span className={`flex items-center gap-1 text-[12px] ${isDark ? "text-[#ABABAD]" : "text-slate-500"}`}>
                    <Phone size={12} color="#94A3B8" weight="duotone" />{phone}
                  </span>
                )}
                {account && (
                  <span className={`flex items-center gap-1 text-[12px] ${isDark ? "text-[#ABABAD]" : "text-slate-500"}`}>
                    <Buildings size={12} color="#94A3B8" weight="duotone" />{account}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {email && (
                <Button variant="outlined" size="small" component="a" href={`mailto:${email}`}
                  sx={{ borderColor: isDark ? "#27272A" : "#E3ECFC", color: isDark ? "#B4B5B6" : "#1D4ED8", borderRadius: "9px", textTransform: "none", fontWeight: 600, fontSize: "0.84rem", bgcolor: isDark ? "#0F0F0F" : "transparent", "&:hover": { borderColor: "#1D4ED8", color: "#1D4ED8", bgcolor: isDark ? "#0A0A0A" : "#EFF6FF" } }}>
                  Send Email
                </Button>
              )}
              <Button variant="contained" size="small" startIcon={<PencilSimple size={14} weight="duotone" />} onClick={() => setEditOpen(true)}
                sx={{ bgcolor: "#1D4ED8", borderRadius: "9px", textTransform: "none", fontWeight: 700, fontSize: "0.84rem", boxShadow: "0 1px 8px 0 #1D4ED833", "&:hover": { bgcolor: "#60A5FA", boxShadow: "0 2px 14px 0 #60A5FA55" }, "&:active": { bgcolor: "#0C2472" } }}>
                Edit
              </Button>
              <Tooltip title="More actions">
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
                  <ListItemText primaryTypographyProps={{ fontSize: "0.8rem", fontWeight: 600, color: "#EF4444" }}>Delete Contact</ListItemText>
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
              {/* ── Quick info ── */}
              <div className={`rounded-2xl border shadow-sm divide-y ${isDark ? "bg-[#1C1C1E] border-[#27272A] divide-[#27272A]" : "bg-[#f9fbff] border-[#E3ECFC] divide-[#EFF6FF]"}`}>
                {[
                  { label: "Contact Owner", value: contactOwner },
                  { label: "Email", value: email },
                  { label: "Phone", value: phone },
                  { label: "Mobile", value: mobile },
                  { label: "Department", value: department },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center px-5 py-3">
                    <span className={`text-[12px] font-medium w-40 flex-shrink-0 ${isDark ? "text-[#71717A]" : "text-slate-500"}`}>{label}:</span>
                    <span className={`flex-1 text-[14px] font-semibold ${value ? (isDark ? "text-[#D4D4D8]" : "text-slate-700") : (isDark ? "text-[#3F3F46]" : "text-slate-300")}`}>{value || "—"}</span>
                  </div>
                ))}
              </div>

              {/* ── Contact Information (dynamic layout fields) ── */}
              <SectionCard icon={UserCircle} title="Contact Information"
                action={
                  <IconButton size="small" onClick={() => setEditOpen(true)}
                    sx={{ p: 0.5, color: isDark ? "#3F3F46" : "#E2E8F0", "&:hover": { color: "#1D4ED8", bgcolor: isDark ? "#27272A" : "#EFF6FF" }, borderRadius: "6px" }}>
                    <DotsThreeVertical size={16} weight="bold" />
                  </IconButton>
                }>
                <div className="grid grid-cols-2 gap-x-10 gap-y-0">
                  {(contactInfoFields.length > 0 ? contactInfoFields : contactInfoFallback).map((f, i) => (
                    <KV key={`${f.label}-${i}`} label={f.label} value={f.value as any} />
                  ))}
                </div>
              </SectionCard>

              {/* ── Address Information ── */}
              <SectionCard icon={MapPin} title="Address Information">
                <div className="grid grid-cols-2 gap-x-10 gap-y-0">
                  <KV label="Mailing Address" value={mailingAddress} />
                  <KV label="Other Address" value={otherAddress} />
                </div>
              </SectionCard>

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
                        </tr>
                      </thead>
                      <tbody>
                        {tasks.length === 0 ? (
                          <tr>
                            <td colSpan={2} className={`py-8 text-center text-[14px] ${isDark ? "text-[#3F3F46]" : "text-slate-300"}`}>No rows</td>
                          </tr>
                        ) : tasks.map((t) => (
                          <tr key={t.name} className={`border-b transition-colors ${isDark ? "border-[#27272A] hover:bg-[#27272A]" : "border-[#EFF6FF] hover:bg-[rgba(29,78,216,0.03)]"}`}>
                            <td className={`py-3 pr-4 text-[14px] font-medium ${isDark ? "text-[#D4D4D8]" : "text-slate-700"}`}>{t.title || "Untitled task"}</td>
                            <td className={`py-3 pr-4 text-[14px]`}>
                              {t.status && (
                                <span className={`text-[11.5px] font-bold px-2 py-0.5 rounded-full ${isDark ? "bg-[#3F3F46] text-[#D4D4D8]" : "bg-[#E3ECFC] text-[#1D4ED8]"}`}>{t.status}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </SectionCard>
              </div>

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

              {/* ── Attachments ── */}
              {/* ── Attachments (shared common Attachments UI) ── */}
              <AttachmentsSection doctype="Contact" name={name} onCountChange={setAttachmentCount} />

              {/* ── Config-driven related lists (from Settings "Detail View") ── */}
              {sectionRelatedLists.map((rl) => (
                <DynamicRelatedSection
                  key={rl.id || rl.name || rl.label}
                  config={rl}
                  parent_module="Contacts"
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
        <AddEditConctactDrawer
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
          reference_doctype="Contact"
          reference_docname={name}
          onSubmit={async () => {
            setTaskDrawerOpen(false);
            await fetchTasks();
          }}
        />
      )}
    </div>
  );
}
