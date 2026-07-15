"use client";
import React from "react";
import { useRouter } from "next/navigation";
import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";
import { useTheme } from "@mui/material/styles";
import {
  CalendarBlank,
  WarningCircle,
  TextAlignLeft,
  User,
  Star,
  DotsThreeVertical,
} from "@phosphor-icons/react";
import { getAvatarColor } from "@/@core/utils/avatarColor";
import {
  getTaskStatusToken,
  getTaskPriorityToken,
  formatTaskDate,
  isTaskOverdue,
} from "./taskTokens";

const initials = (n: string) => {
  const p = (n || "?").trim().split(/\s+/);
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : (n || "?").substring(0, 2).toUpperCase();
};

// Alternating card palette — matches the reference Leads grid
// (crm-app-UI-Arun-Latest/components/leads/LeadGridView.tsx).
const PASTELS = [
  { fill: "#D6E4F9", deep: "#2F6FED" },
  { fill: "#D0E5E0", deep: "#2E9E7B" },
  { fill: "#FAE3D0", deep: "#E0883F" },
  { fill: "#F5D9E1", deep: "#DB5E8C" },
  { fill: "#D2DFF0", deep: "#5B6CB5" },
];
const DARK_PASTELS = [
  { fill: "#1E2235", deep: "#4F8EF7" },
  { fill: "#1A2820", deep: "#34D399" },
  { fill: "#2A1F18", deep: "#F59E0B" },
  { fill: "#28181F", deep: "#F472B6" },
  { fill: "#1B1E2D", deep: "#818CF8" },
];

interface Props {
  rows: any[];
  statusField?: string;
}

/**
 * Task Grid View — mirrors the reference Leads grid
 * (crm-app-UI-Arun-Latest/components/leads/LeadGridView.tsx): alternating pastel
 * cards, avatar + title header, status pill, detail rows and an owner footer.
 */
export default function TaskGridView({ rows, statusField = "status" }: Props) {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  if (!rows || rows.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-20 ${isDark ? "text-[#E4E4E7]" : "text-slate-400"}`}>
        <p className="font-heading text-[15px]/[20px] font-semibold">No tasks found</p>
        <p className="text-[13px]/[16px] mt-1">Adjust filters or add a new task</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {rows.map((t, i) => {
        const title = t.title || t.subject || t.name || "Untitled task";
        const status = t[statusField] ?? t.status ?? "";
        const priority = t.priority || "";
        const dueDate = t.due_date || "";
        const description = String(t.description || "").replace(/<[^>]*>?/gm, "");
        const assignee = t.assigned_to || t.owner || "";

        const overdue = isTaskOverdue(dueDate, status);
        const pr = getTaskPriorityToken(priority, isDark);

        // Card colour alternates by position (as in the reference Leads grid).
        const colored = i % 2 === 0;
        const pal = isDark ? DARK_PASTELS : PASTELS;
        const baseT = isDark ? { fill: "#1C1C1E", deep: "#4F8EF7" } : { fill: "#f9fbff", deep: "#3B82F6" };
        const cardT = colored ? pal[Math.floor(i / 2) % pal.length] : baseT;

        return (
          <div
            key={t.name || i}
            onClick={() => t.name && router.push(`/tasks/detail/${encodeURIComponent(t.name)}`)}
            className={`rounded-2xl border hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group overflow-hidden ${
              isDark
                ? "border-[#27272A] hover:border-[#3F3F46]"
                : colored ? "border-white/50" : "border-[#E3ECFC]"
            }`}
            style={{
              backgroundColor: cardT.fill,
              boxShadow: isDark ? "0 6px 24px rgba(0,0,0,0.3)" : "0 6px 24px rgba(15,23,42,0.06)",
            }}
          >
            <div className="p-4">
              {/* Avatar + title + menu */}
              <div className="flex items-start gap-3 mb-3">
                <Avatar
                  sx={{ width: 44, height: 44, bgcolor: getAvatarColor(assignee || title), fontSize: "0.95rem", fontWeight: 800, flexShrink: 0, boxShadow: "0 2px 8px rgba(12,36,114,0.15)" }}
                >
                  {initials(assignee || title)}
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className={`font-heading text-[14.5px] font-bold truncate ${isDark ? "text-[#D4D4D8]" : "text-[#0C2472]"}`}>
                    {title}
                  </p>
                  {dueDate && (
                    <p
                      className={`text-[12.5px] truncate flex items-center gap-1 mt-0.5 ${
                        overdue ? "text-[#DC2626] font-semibold" : isDark ? "text-[#A1A1AA]" : "text-slate-600"
                      }`}
                    >
                      {overdue ? (
                        <WarningCircle size={11} color="#DC2626" weight="duotone" />
                      ) : (
                        <CalendarBlank size={11} color={cardT.deep} weight="duotone" />
                      )}
                      {formatTaskDate(dueDate)}
                    </p>
                  )}
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className={`p-1 rounded-lg transition-colors ${isDark ? "hover:bg-white/10" : "hover:bg-[#f9fbff]/60"}`}
                  >
                    <DotsThreeVertical size={15} color={isDark ? "#A1A1AA" : "#475569"} weight="duotone" />
                  </button>
                </div>
              </div>

              {/* Status badge */}
              {status && (
                <span className={`inline-flex items-center gap-1.5 text-[11.5px] font-bold px-2.5 py-0.5 rounded-full mb-3 ${isDark ? "bg-white/10 text-[#A1A1AA]" : "bg-[#f9fbff]/70 text-[#0C2472]"}`}>
                  <span className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: cardT.deep }} />
                  {status}
                </span>
              )}

              {/* Details */}
              <div className="space-y-1.5">
                {description ? (
                  <div className={`flex items-center gap-2 text-[12.5px] ${isDark ? "text-[#A1A1AA]" : "text-slate-700"}`}>
                    <TextAlignLeft size={12} color={cardT.deep} weight="duotone" className="flex-shrink-0" />
                    <span className="truncate font-medium">{description}</span>
                  </div>
                ) : null}
                {assignee ? (
                  <div className={`flex items-center gap-2 text-[12.5px] ${isDark ? "text-[#A1A1AA]" : "text-slate-600"}`}>
                    <User size={12} color={cardT.deep} weight="duotone" className="flex-shrink-0" />
                    <span className="truncate">{assignee}</span>
                  </div>
                ) : null}
                {!description && !assignee && (
                  <p className={`text-[12px] italic ${isDark ? "text-[#E4E4E7]" : "text-slate-400"}`}>No details</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div
              className={`flex items-center justify-between px-4 py-2.5 border-t ${
                isDark
                  ? "border-[#27272A] bg-black/20"
                  : colored ? "border-white/50 bg-[#f9fbff]/30" : "border-[#EFF6FF] bg-[#EFF6FF]"
              }`}
            >
              <Tooltip title={assignee || "Unassigned"}>
                <div className="flex items-center gap-1.5 min-w-0">
                  <Avatar sx={{ width: 20, height: 20, bgcolor: getAvatarColor(assignee || "?"), fontSize: "0.58rem", fontWeight: 800 }}>
                    {initials(assignee)}
                  </Avatar>
                  <span className={`text-[12px] font-medium truncate max-w-[90px] ${isDark ? "text-[#A1A1AA]" : "text-slate-600"}`}>
                    {assignee || "Unassigned"}
                  </span>
                </div>
              </Tooltip>
              {pr && (
                <span
                  className="flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: pr.bg, color: pr.text }}
                >
                  <Star size={10} color={pr.text} weight="duotone" />
                  {priority}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
