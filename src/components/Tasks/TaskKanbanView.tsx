"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";
import { useTheme } from "@mui/material/styles";
import {
  Plus,
  CalendarBlank,
  WarningCircle,
  TextAlignLeft,
  DotsThreeVertical,
} from "@phosphor-icons/react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { getAvatarColor } from "@/@core/utils/avatarColor";
import {
  getTaskStageToken,
  getTaskPriorityToken,
  formatTaskDate,
  isTaskOverdue,
} from "./taskTokens";

const initials = (n: string) => {
  const p = (n || "?").trim().split(/\s+/);
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : (n || "?").substring(0, 2).toUpperCase();
};

interface StatusOption {
  value: string;
  label?: string;
  color?: string;
}

/**
 * Task Kanban View — mirrors the reference Leads kanban
 * (crm-app-UI-Arun-Latest/components/leads/LeadKanbanView.tsx): solid semantic
 * column headers with count + add button, neutral cards with an avatar header,
 * detail rows and an owner footer, and a dashed empty state.
 *
 * Drop-in for LeadKanbanView (same props) so it can be supplied to
 * RawDynamicDataGrid via `kanbanViewComponent`. Drag-and-drop status updates are
 * preserved (the reference has no DnD).
 */
interface Props {
  leads: any[];
  onUpdateLeadStatus: (name: string, newStatus: string) => Promise<void>;
  onAddNewLead?: () => void;
  statuses?: StatusOption[];
  statusField?: string;
}

export default function TaskKanbanView({
  leads,
  onUpdateLeadStatus,
  onAddNewLead,
  statuses,
  statusField = "status",
}: Props) {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const COLUMNS = (statuses ?? []).map((s) => {
    const token = getTaskStageToken(s.value);
    return {
      key: s.value,
      label: s.label || s.value,
      headerBg: token.headerBg,
      dot: isDark ? token.darkDeep : token.deep,
    };
  });

  const getStatus = (t: any): string => t?.[statusField] ?? t?.status ?? "";

  const [localTasks, setLocalTasks] = useState<any[]>(leads);
  useEffect(() => {
    setLocalTasks(leads);
  }, [leads]);

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const targetStatus = destination.droppableId;

    // Optimistic update on the resolved status field.
    setLocalTasks((prev) =>
      prev.map((t) => (t.name === draggableId ? { ...t, [statusField]: targetStatus } : t))
    );

    try {
      await onUpdateLeadStatus(draggableId, targetStatus);
    } catch (err) {
      console.error("Failed to update task status on drag and drop:", err);
      setLocalTasks(leads); // revert
    }
  };

  const byStatus: Record<string, any[]> = Object.fromEntries(
    COLUMNS.map((c) => [c.key, localTasks.filter((t) => getStatus(t) === c.key)])
  );

  if (COLUMNS.length === 0) {
    return (
      <div className={`flex items-center justify-center py-20 text-[14px] ${isDark ? "text-[#9CA3AF]" : "text-slate-400"}`}>
        No task statuses configured
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-280px)]" style={{ scrollbarWidth: "thin" }}>
        {COLUMNS.map((col) => {
          const colTasks = byStatus[col.key] || [];

          return (
            <div key={col.key} className="flex-shrink-0 w-[240px] flex flex-col">
              {/* Column header — keeps semantic color regardless of theme */}
              <div
                className="flex items-center justify-between px-3 py-2.5 rounded-xl mb-3 text-white"
                style={{ backgroundColor: col.headerBg }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-heading text-[14px] font-bold truncate">{col.label}</span>
                  <span className="text-[11px] font-bold bg-[#f9fbff]/20 px-1.5 py-0.5 rounded-full leading-none flex-shrink-0">
                    {colTasks.length}
                  </span>
                </div>
                {onAddNewLead && (
                  <Tooltip title={`Add task to ${col.label}`}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddNewLead();
                      }}
                      className="w-6 h-6 rounded-lg bg-[#f9fbff]/15 hover:bg-[#f9fbff]/30 flex items-center justify-center transition-colors flex-shrink-0"
                    >
                      <Plus size={13} color="white" weight="bold" />
                    </button>
                  </Tooltip>
                )}
              </div>

              {/* Droppable task cards */}
              <Droppable droppableId={col.key}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 space-y-2.5 rounded-xl transition-colors ${
                      snapshot.isDraggingOver ? (isDark ? "bg-[#27272A]/60" : "bg-[#EFF6FF]") : ""
                    }`}
                    style={{ minHeight: 80 }}
                  >
                    {colTasks.length === 0 && !snapshot.isDraggingOver ? (
                      <div
                        className={`flex flex-col items-center justify-center py-8 rounded-xl border-2 border-dashed text-[12px] text-center ${isDark ? "text-[#3F3F46]" : "text-slate-300"}`}
                        style={{ borderColor: col.dot + "60" }}
                      >
                        <Plus size={20} color={col.dot} weight="bold" className="mb-1 opacity-40" />
                        No {col.label.toLowerCase()} tasks
                      </div>
                    ) : (
                      colTasks.map((t, index) => {
                        const title = t.title || t.subject || t.name || "Untitled task";
                        const status = getStatus(t);
                        const priority = t.priority || "";
                        const dueDate = t.due_date || "";
                        const description = String(t.description || "").replace(/<[^>]*>?/gm, "");
                        const assignee = t.assigned_to || t.owner || "";
                        const overdue = isTaskOverdue(dueDate, status);
                        const pr = getTaskPriorityToken(priority, isDark);

                        return (
                          <Draggable key={t.name} draggableId={String(t.name)} index={index}>
                            {(dragProvided, dragSnapshot) => (
                              <div
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                {...dragProvided.dragHandleProps}
                                onClick={() => t.name && router.push(`/tasks/detail/${encodeURIComponent(t.name)}`)}
                                className={`rounded-xl border p-3 shadow-sm cursor-pointer group transition-all hover:-translate-y-0.5 ${
                                  isDark
                                    ? "bg-[#1C1C1E] border-[#27272A] hover:shadow-md hover:border-[#3F3F46]"
                                    : "bg-[#f9fbff] border-[#E3ECFC] hover:shadow-md hover:border-[#60A5FA]"
                                } ${dragSnapshot.isDragging ? "shadow-lg rotate-[1deg]" : ""}`}
                                style={{ ...dragProvided.draggableProps.style }}
                              >
                                {/* Card header: avatar + title + due date + menu */}
                                <div className="flex items-start gap-2 mb-2">
                                  <Avatar
                                    sx={{ width: 32, height: 32, bgcolor: getAvatarColor(assignee || title), fontSize: "0.72rem", fontWeight: 800, flexShrink: 0 }}
                                  >
                                    {initials(assignee || title)}
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <p className={`font-heading text-[14px] font-bold truncate leading-tight ${isDark ? "text-[#D4D4D8]" : "text-slate-800"}`}>
                                      {title}
                                    </p>
                                    {dueDate && (
                                      <p
                                        className={`text-[12px] truncate flex items-center gap-0.5 mt-0.5 ${
                                          overdue ? "text-[#DC2626] font-semibold" : isDark ? "text-[#E4E4E7]" : "text-slate-400"
                                        }`}
                                      >
                                        {overdue ? (
                                          <WarningCircle size={10} color="#DC2626" weight="duotone" />
                                        ) : (
                                          <CalendarBlank size={10} color={isDark ? "#3F3F46" : "#E2E8F0"} weight="duotone" />
                                        )}
                                        {formatTaskDate(dueDate)}
                                      </p>
                                    )}
                                  </div>
                                  <button
                                    onClick={(e) => e.stopPropagation()}
                                    className={`opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded flex-shrink-0 ${isDark ? "hover:bg-[#27272A]" : "hover:bg-[#EFF6FF]"}`}
                                  >
                                    <DotsThreeVertical size={13} color={isDark ? "#E4E4E7" : "#94A3B8"} weight="duotone" />
                                  </button>
                                </div>

                                {/* Details */}
                                {description && (
                                  <div className="space-y-1 mb-2.5">
                                    <div className={`flex items-center gap-1.5 text-[13px] truncate ${isDark ? "text-[#A1A1AA]" : "text-slate-500"}`}>
                                      <TextAlignLeft size={10} color={isDark ? "#3F3F46" : "#E3ECFC"} weight="duotone" className="flex-shrink-0" />
                                      <span className="truncate">{description}</span>
                                    </div>
                                  </div>
                                )}

                                {/* Footer: assignee + priority */}
                                <div className={`flex items-center gap-1.5 pt-2 border-t ${isDark ? "border-[#27272A]" : "border-[#EFF6FF]"}`}>
                                  <Tooltip title={assignee || "Unassigned"}>
                                    <Avatar sx={{ width: 16, height: 16, bgcolor: getAvatarColor(assignee || "?"), fontSize: "0.55rem", fontWeight: 800 }}>
                                      {initials(assignee)}
                                    </Avatar>
                                  </Tooltip>
                                  <span className={`text-[12px] truncate ${isDark ? "text-[#E4E4E7]" : "text-slate-400"}`}>
                                    {assignee || "Unassigned"}
                                  </span>
                                  {pr && (
                                    <span
                                      className="ml-auto text-[11px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                                      style={{ backgroundColor: pr.bg, color: pr.text }}
                                    >
                                      {priority}
                                    </span>
                                  )}
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
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
