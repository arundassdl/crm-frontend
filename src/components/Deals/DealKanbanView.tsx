"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";
import { useTheme } from "@mui/material/styles";
import { Plus, Buildings, User, CurrencyDollar } from "@phosphor-icons/react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { getAvatarColor } from "@/@core/utils/avatarColor";
import { getDealStageToken, fmtCompact, fmtTotal, resolveAmount, resolveProbability } from "./dealTokens";

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
 * Deals Kanban View — mirrors the reference
 * (crm-app-UI-Arun-Latest/components/deals/DealKanbanView.tsx): solid colored
 * column headers with count + add button, a "Total" strip, and neutral cards.
 *
 * Drop-in for LeadKanbanView (same props) so it can be supplied to
 * RawDynamicDataGrid via `kanbanViewComponent`. Drag-and-drop stage updates are
 * preserved (the reference has no DnD).
 */
interface Props {
  leads: any[];
  onUpdateLeadStatus: (name: string, newStatus: string) => Promise<void>;
  onAddNewLead?: () => void;
  statuses?: StatusOption[];
  statusField?: string;
  /** Amount field resolved from the layout's currency field. */
  amountField?: string;
}

export default function DealKanbanView({
  leads,
  onUpdateLeadStatus,
  onAddNewLead,
  statuses,
  statusField = "status",
  amountField,
}: Props) {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const COLUMNS = (statuses ?? []).map((s) => {
    const token = getDealStageToken(s.value);
    return {
      key: s.value,
      label: s.label || s.value,
      headerBg: token.headerBg,
      dot: isDark ? token.darkDeep : token.deep,
    };
  });

  const getStage = (d: any): string => d?.[statusField] ?? d?.status ?? "";

  const [localDeals, setLocalDeals] = useState<any[]>(leads);
  useEffect(() => {
    setLocalDeals(leads);
  }, [leads]);

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const targetStage = destination.droppableId;

    // Optimistic update on the resolved stage field.
    setLocalDeals((prev) =>
      prev.map((d) => (d.name === draggableId ? { ...d, [statusField]: targetStage } : d))
    );

    try {
      await onUpdateLeadStatus(draggableId, targetStage);
    } catch (err) {
      console.error("Failed to update deal stage on drag and drop:", err);
      setLocalDeals(leads); // revert
    }
  };

  const byStage: Record<string, any[]> = Object.fromEntries(
    COLUMNS.map((c) => [c.key, localDeals.filter((d) => getStage(d) === c.key)])
  );

  if (COLUMNS.length === 0) {
    return (
      <div className={`flex items-center justify-center py-20 text-[14px] ${isDark ? "text-[#9CA3AF]" : "text-slate-400"}`}>
        No deal stages configured
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-280px)]" style={{ scrollbarWidth: "thin" }}>
        {COLUMNS.map((col) => {
          const colDeals = byStage[col.key] || [];
          const total = colDeals.reduce((s, d) => s + resolveAmount(d, amountField), 0);

          return (
            <div key={col.key} className="flex-shrink-0 w-[240px] flex flex-col">
              {/* Column header — solid semantic color */}
              <div className="rounded-xl mb-3 overflow-hidden shadow-sm">
                <div className="px-3 py-2.5 flex items-center justify-between" style={{ backgroundColor: col.headerBg }}>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-heading text-[12px] font-bold uppercase tracking-wider text-white truncate">
                      {col.label}
                    </span>
                    <span className="text-[11px] font-bold bg-[#f9fbff]/20 text-white px-1.5 py-0.5 rounded-full flex-shrink-0">
                      {colDeals.length}
                    </span>
                  </div>
                  {onAddNewLead && (
                    <Tooltip title={`Add deal to ${col.label}`}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddNewLead();
                        }}
                        className="w-6 h-6 rounded-lg bg-[#f9fbff]/15 hover:bg-[#f9fbff]/30 flex items-center justify-center transition-colors flex-shrink-0 ml-1"
                      >
                        <Plus size={13} color="white" weight="bold" />
                      </button>
                    </Tooltip>
                  )}
                </div>

                {/* Total amount strip */}
                <div
                  className={`px-3 py-1.5 border-x border-b ${isDark ? "bg-[#1C1C1E] border-[#27272A]" : "bg-[#f9fbff] border-[#E3ECFC]"}`}
                  style={{ borderTop: `2px solid ${col.dot}` }}
                >
                  <p className={`text-[12px] font-medium flex items-center gap-1 ${isDark ? "text-[#9CA3AF]" : "text-slate-400"}`}>
                    <CurrencyDollar size={10} color={isDark ? "#3F3F46" : "#94A3B8"} weight="duotone" />
                    Total:
                    <span className={`font-bold ml-0.5 ${isDark ? "text-[#A1A1AA]" : "text-slate-600"}`}>{fmtTotal(total)}</span>
                  </p>
                </div>
              </div>

              {/* Droppable deal cards */}
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
                    {colDeals.length === 0 && !snapshot.isDraggingOver ? (
                      <div
                        className={`flex flex-col items-center justify-center py-8 rounded-xl border-2 border-dashed text-[12px] text-center ${isDark ? "text-[#3F3F46]" : "text-slate-300"}`}
                        style={{ borderColor: col.dot + "60" }}
                      >
                        <Plus size={20} color={col.dot} weight="bold" className="mb-1 opacity-40" />
                        No deals
                      </div>
                    ) : (
                      colDeals.map((deal, index) => {
                        const dealName = deal.deal_name || deal.organization || deal.name || "—";
                        const amount = resolveAmount(deal, amountField);
                        const account = deal.organization || deal.organization_name || "";
                        const contactName = deal.lead_name || deal.contact || "";
                        const owner = deal.deal_owner || deal.owner || "";
                        const probability = resolveProbability(deal);

                        return (
                          <Draggable key={deal.name} draggableId={String(deal.name)} index={index}>
                            {(dragProvided, dragSnapshot) => (
                              <div
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                {...dragProvided.dragHandleProps}
                                onClick={() => deal.name && router.push(`/deals/detail/${encodeURIComponent(deal.name)}`)}
                                className={`rounded-xl border p-3 shadow-sm cursor-pointer group transition-all hover:-translate-y-0.5 ${
                                  isDark
                                    ? "bg-[#1C1C1E] border-[#27272A] hover:shadow-md hover:border-[#3F3F46]"
                                    : "bg-[#f9fbff] border-[#E3ECFC] hover:shadow-md hover:border-[#60A5FA]"
                                } ${dragSnapshot.isDragging ? "shadow-lg rotate-[1deg]" : ""}`}
                                style={{ ...dragProvided.draggableProps.style }}
                              >
                                {/* Amount */}
                                <p className={`font-heading text-[14px] font-extrabold mb-1 ${isDark ? "text-[#A1A1AA]" : "text-[#0C2472]"}`}>
                                  {fmtCompact(deal?.deal_value || amount)}
                                </p>

                                {/* Deal name */}
                                <p className={`font-heading text-[14px] font-bold truncate leading-tight mb-2 ${isDark ? "text-[#D4D4D8]" : "text-slate-800"}`}>
                                  {dealName}
                                </p>

                                {/* Probability mini-bar */}
                                {probability > 0 && (
                                  <div className={`w-full h-0.5 rounded-full mb-2 overflow-hidden ${isDark ? "bg-[#27272A]" : "bg-[#E3ECFC]"}`}>
                                    <div className="h-full rounded-full" style={{ width: `${probability}%`, backgroundColor: col.dot }} />
                                  </div>
                                )}

                                {/* Account + contact */}
                                <div className="space-y-1 mb-2.5">
                                  {account && (
                                    <div className={`flex items-center gap-1 text-[12px] truncate ${isDark ? "text-[#9CA3AF]" : "text-slate-400"}`}>
                                      <Buildings size={10} color={isDark ? "#3F3F46" : "#94A3B8"} weight="duotone" className="flex-shrink-0" />
                                      <span className="truncate">{account}</span>
                                    </div>
                                  )}
                                  {contactName && (
                                    <div className={`flex items-center gap-1 text-[12px] truncate ${isDark ? "text-[#9CA3AF]" : "text-slate-400"}`}>
                                      <User size={10} color={isDark ? "#3F3F46" : "#94A3B8"} weight="duotone" className="flex-shrink-0" />
                                      <span className="truncate">{contactName}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Footer */}
                                <div className={`flex items-center gap-1.5 pt-2 border-t ${isDark ? "border-[#27272A]" : "border-[#EFF6FF]"}`}>
                                  <Tooltip title={owner || "Unassigned"}>
                                    <Avatar sx={{ width: 16, height: 16, bgcolor: getAvatarColor(owner || "?"), fontSize: "0.45rem", fontWeight: 800 }}>
                                      {initials(owner)}
                                    </Avatar>
                                  </Tooltip>
                                  <span className={`text-[12px] truncate ${isDark ? "text-[#9CA3AF]" : "text-slate-400"}`}>
                                    {owner || "Unassigned"}
                                  </span>
                                  {probability > 0 && (
                                    <span className={`ml-auto text-[12px] flex-shrink-0 ${isDark ? "text-[#3F3F46]" : "text-slate-300"}`}>
                                      {probability}%
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

              {/* Add deal */}
              {onAddNewLead && (
                <button
                  onClick={onAddNewLead}
                  className={`flex items-center justify-center gap-1.5 mt-3 px-2 py-2 rounded-xl border border-dashed text-[12px] font-medium w-full transition-colors ${
                    isDark ? "text-[#9CA3AF] hover:bg-[#1C1C1E] hover:text-[#71717A]" : "text-slate-400 hover:bg-[#EFF6FF]"
                  }`}
                  style={{ borderColor: col.dot + "60" }}
                >
                  <Plus size={13} weight="bold" />
                  Add deal
                </button>
              )}
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
