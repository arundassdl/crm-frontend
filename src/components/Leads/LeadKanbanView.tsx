"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";
import { useTheme } from "@mui/material/styles";
import { Plus, Phone, Envelope, Buildings, DotsThreeVertical } from "@phosphor-icons/react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { getAvatarColor } from "@/@core/utils/avatarColor";
import { getStatusTokens, type StatusOption } from "@/components/Common/DataGrid/statusBadge";

interface Lead {
  name: string;
  lead_name: string;
  organization: string;
  email: string;
  mobile_no: string;
  status: string;
  owner: string;
  lead_source?: string;
  rating?: string;
  creation?: string;
}

type StatusColumn = { key: string; label: string; bg: string; text: string; dot: string };

/** A backend status option (from the Component Pick List API). */
export type LeadStatusOption = StatusOption;

/** Append an alpha channel to a 7-char hex color, e.g. "#0C2472" + 0.1 -> "#0C24721A". */
const hexWithAlpha = (hex: string, alpha: number): string => {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return "#F1F5F9";
  const a = Math.round(Math.min(Math.max(alpha, 0), 1) * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex}${a}`;
};

/**
 * Build a Kanban column from a status option.
 *
 * Colours come from `getStatusTokens` — the exact resolver the List/Grid status
 * badge uses — so a status is painted identically in every view: the configured
 * pick list colour wins, otherwise the shared curated/derived fallback applies.
 */
const buildColumn = (option: LeadStatusOption, isDark: boolean): StatusColumn => {
  const { bg, text, dot } = getStatusTokens(option.value, option.color, isDark);
  return {
    key: option.value,
    label: option.label || option.value,
    bg,
    text,
    dot,
  };
};

// Theme-aligned avatar color from the shared palette.
const avatarColor = (n: string) => getAvatarColor(n || "Lead");

const initials = (n: string) => {
  const name = (n || "Lead").trim();
  const p = name.split(/\s+/);
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
};

interface Props {
  leads: Lead[];
  onUpdateLeadStatus: (leadName: string, newStatus: string) => Promise<void>;
  onAddNewLead?: () => void;
  /** Dynamic lead statuses loaded from the backend Component Pick List API. */
  statuses?: LeadStatusOption[];
  /** Data field the status value lives under (e.g. "lead_status"). Defaults to "status". */
  statusField?: string;
}

export default function LeadKanbanView({ leads, onUpdateLeadStatus, onAddNewLead, statuses, statusField = "status" }: Props) {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const STATUSES: StatusColumn[] = React.useMemo(
    () => (statuses ?? []).map((option) => buildColumn(option, isDark)),
    [statuses, isDark]
  );

  // Read a lead's status from the resolved field, falling back to `status` for safety.
  const getLeadStatus = (lead: Lead): string => (lead as any)[statusField] ?? lead.status;

  const [localLeads, setLocalLeads] = useState<Lead[]>(leads);

  useEffect(() => {
    setLocalLeads(leads);
  }, [leads]);

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const targetStatus = destination.droppableId;

    // Optimistically update status in local state (on the resolved field)
    setLocalLeads((prev) =>
      prev.map((lead) => (lead.name === draggableId ? { ...lead, [statusField]: targetStatus } : lead))
    );

    try {
      await onUpdateLeadStatus(draggableId, targetStatus);
    } catch (err) {
      console.error("Failed to update status on drag and drop:", err);
      // Revert to original leads prop if API failed
      setLocalLeads(leads);
    }
  };

  const byStatus = Object.fromEntries(
    STATUSES.map((s) => [s.key, localLeads.filter((l) => getLeadStatus(l) === s.key)])
  );

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-280px)]" style={{ scrollbarWidth: "thin" }}>
        {STATUSES.map((col) => {
          const colLeads = byStatus[col.key] || [];

          return (
            <div key={col.key} className="flex-shrink-0 w-[240px] flex flex-col">
              {/* Column header — same status tokens as the List/Grid badge */}
              <div
                className="flex items-center justify-between px-3 py-2.5 rounded-xl mb-3"
                style={{ backgroundColor: col.bg, color: col.text }}
              >
                <div className="flex items-center gap-2">
                  <span className="w-[6px] h-[6px] rounded-full flex-shrink-0" style={{ backgroundColor: col.dot }} />
                  <span className="font-sans text-[14px] font-bold">{col.label}</span>
                  <span
                    className="text-[11px] font-bold px-1.5 py-0.5 rounded-full leading-none"
                    style={{ backgroundColor: hexWithAlpha(col.dot, 0.2) }}
                  >
                    {colLeads.length}
                  </span>
                </div>
                {onAddNewLead && (
                  <Tooltip title={`Add lead to ${col.label}`}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddNewLead();
                      }}
                      className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors"
                      style={{ backgroundColor: hexWithAlpha(col.dot, 0.15) }}
                    >
                      <Plus size={13} color={col.text} weight="bold" />
                    </button>
                  </Tooltip>
                )}
              </div>

              {/* Droppable Lead cards */}
              <Droppable droppableId={col.key}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 space-y-2.5 overflow-y-auto rounded-xl p-1 transition-colors duration-200 ${
                      snapshot.isDraggingOver
                        ? isDark ? "bg-[#27272A]/40" : "bg-[#EFF6FF]/40"
                        : "bg-transparent"
                    }`}
                    style={{ maxHeight: "calc(100vh - 340px)", minHeight: "250px" }}
                  >
                    {colLeads.length === 0 ? (
                      <div
                        className={`flex flex-col items-center justify-center py-8 rounded-xl border-2 border-dashed text-[12px] text-center ${
                          isDark ? "text-[#3F3F46]" : "text-slate-300"
                        }`}
                        style={{ borderColor: col.dot + "60" }}
                      >
                        <Plus size={20} color={col.dot} weight="bold" className="mb-1 opacity-40" />
                        No {col.label.toLowerCase()} leads
                      </div>
                    ) : (
                      colLeads.map((lead, index) => {
                        const avCol = avatarColor(lead.lead_name);
                        const avInit = initials(lead.lead_name);
                        const owCol = avatarColor(lead.owner);
                        const owInit = initials(lead.owner);

                        return (
                          <Draggable key={lead.name} draggableId={lead.name} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onClick={() => router.push(`/leads/detail/${lead.name}`)}
                                className={`rounded-xl border p-3 cursor-pointer group transition-all ${
                                  snapshot.isDragging
                                    ? "shadow-lg scale-[1.02] border-[#1D4ED8]"
                                    : isDark
                                    ? "bg-[#1C1C1E] border-[#27272A] hover:shadow-md hover:border-[#3F3F46]"
                                    : "bg-[#f9fbff] border-[#E3ECFC] hover:shadow-md hover:border-[#60A5FA]"
                                }`}
                              >
                                {/* Lead header */}
                                <div className="flex items-start gap-2 mb-2">
                                  <Avatar
                                    sx={{
                                      width: 32,
                                      height: 32,
                                      bgcolor: avCol,
                                      fontSize: "0.72rem",
                                      fontWeight: 800,
                                      flexShrink: 0,
                                    }}
                                  >
                                    {avInit}
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <p className={`font-sans text-[14px] font-bold truncate leading-tight ${isDark ? "text-[#D4D4D8]" : "text-slate-800"}`}>
                                      {lead.lead_name || lead.name}
                                    </p>
                                    {lead.organization && (
                                      <p className={`text-[12px] truncate flex items-center gap-0.5 mt-0.5 ${isDark ? "text-[#E4E4E7]" : "text-slate-400"}`}>
                                        <Buildings size={10} color={isDark ? "#3F3F46" : "#CBD5E1"} weight="duotone" />
                                        {lead.organization}
                                      </p>
                                    )}
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                    }}
                                    className={`opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded ${
                                      isDark ? "hover:bg-[#27272A]" : "hover:bg-[#EFF6FF]"
                                    }`}
                                  >
                                    <DotsThreeVertical size={13} color={isDark ? "#E4E4E7" : "#94A3B8"} weight="duotone" />
                                  </button>
                                </div>

                                {/* Contact */}
                                <div className="space-y-1 mb-2.5">
                                  {lead.email && (
                                    <div className={`flex items-center gap-1.5 text-[12.5px] truncate ${isDark ? "text-[#A1A1AA]" : "text-slate-600"}`}>
                                      <Envelope size={10} color={isDark ? "#3F3F46" : "#E3ECFC"} weight="duotone" className="flex-shrink-0" />
                                      <span className="truncate">{lead.email}</span>
                                    </div>
                                  )}
                                  {lead.mobile_no && (
                                    <div className={`flex items-center gap-1.5 text-[12.5px] font-mono ${isDark ? "text-[#A1A1AA]" : "text-slate-500"}`}>
                                      <Phone size={10} color={isDark ? "#3F3F46" : "#E3ECFC"} weight="duotone" className="flex-shrink-0" />
                                      <span>{lead.mobile_no}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Footer */}
                                <div className={`flex items-center gap-1.5 pt-2 border-t ${isDark ? "border-[#27272A]" : "border-[#EFF6FF]"}`}>
                                  <Tooltip title={lead.owner || "No owner"}>
                                    <Avatar sx={{ width: 16, height: 16, bgcolor: owCol, fontSize: "0.55rem", fontWeight: 800 }}>
                                      {owInit}
                                    </Avatar>
                                  </Tooltip>
                                  <span className={`text-[12px] truncate ${isDark ? "text-[#E4E4E7]" : "text-slate-400"}`}>{lead.owner}</span>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>

              {/* Column footer — add lead */}
              {onAddNewLead && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddNewLead();
                  }}
                  className={`flex items-center justify-center gap-1.5 mt-3 px-2 py-2 rounded-xl border border-dashed text-[14px] font-medium w-full transition-all ${
                    isDark ? "text-[#E4E4E7] border-[#3F3F46] hover:bg-[#1C1C1E] hover:text-[#A1A1AA]" : "hover:bg-[#EFF6FF]"
                  }`}
                  style={{
                    borderColor: isDark ? undefined : col.dot + "60",
                    color: isDark ? undefined : col.text,
                  }}
                >
                  <Plus size={13} weight="bold" />
                  Add lead
                </button>
              )}
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
