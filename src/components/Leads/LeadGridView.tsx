"use client";
import React from "react";
import { useRouter } from "next/navigation";
import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";
import { useTheme } from "@mui/material/styles";
import { Phone, Envelope, TrendUp, Star, Buildings, DotsThreeVertical } from "@phosphor-icons/react";
import { getAvatarColor } from "@/@core/utils/avatarColor";
import { StatusBadge, buildStatusStyleMap, type StatusOption } from "@/components/Common/DataGrid/statusBadge";

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

// Theme-aligned avatar color from the shared palette.
const avatarColor = (n: string) => getAvatarColor(n || "Lead");

const initials = (n: string) => {
  const name = (n || "Lead").trim();
  const p = name.split(/\s+/);
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
};

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
  leads: Lead[];
  /** Data field the status value lives under (e.g. "lead_status"). Defaults to "status". */
  statusField?: string;
  /** Status pick list options from the backend, so badges match the configured label/colour. */
  statusOptions?: StatusOption[];
}

export default function LeadGridView({ leads, statusField = "status", statusOptions }: Props) {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const statusStyleMap = React.useMemo(() => buildStatusStyleMap(statusOptions), [statusOptions]);

  if (!leads || leads.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-20 ${isDark ? "text-[#E4E4E7]" : "text-slate-400"}`}>
        <p className="font-sans text-[15px]/[20px] font-semibold">No leads found</p>
        <p className="text-[13px]/[16px] mt-1">Adjust filters or add a new lead</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {leads.map((lead, i) => {
        const avCol = avatarColor(lead.lead_name);
        const avInit = initials(lead.lead_name);
        const owCol = avatarColor(lead.owner);
        const owInit = initials(lead.owner);

        const colored = i % 2 === 0;
        const pal = isDark ? DARK_PASTELS : PASTELS;
        const baseT = isDark ? { fill: "#1C1C1E", deep: "#4F8EF7" } : { fill: "#f9fbff", deep: "#3B82F6" };
        const cardT = colored ? pal[(i / 2) % pal.length] : baseT;

        return (
          <div
            key={lead.name}
            onClick={() => router.push(`/leads/detail/${lead.name}`)}
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
              {/* Avatar + Name + Menu */}
              <div className="flex items-start gap-3 mb-3">
                <Avatar
                  sx={{
                    width: 44,
                    height: 44,
                    bgcolor: avCol,
                    fontSize: "0.95rem",
                    fontWeight: 800,
                    flexShrink: 0,
                    boxShadow: "0 2px 8px rgba(12,36,114,0.15)",
                  }}
                >
                  {avInit}
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className={`font-sans text-[14.5px] font-bold truncate transition-colors ${isDark ? "text-[#D4D4D8]" : "text-[#0C2472]"}`}>
                    {lead.lead_name || lead.name}
                  </p>
                  {lead.organization && (
                    <p className={`text-[12.5px] truncate flex items-center gap-1 mt-0.5 ${isDark ? "text-[#A1A1AA]" : "text-slate-600"}`}>
                      <Buildings size={11} color={cardT.deep} weight="duotone" />
                      {lead.organization}
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

              {/* Status badge — label and colour come from the status pick list */}
              {(() => {
                const statusVal = String((lead as any)[statusField] ?? lead.status ?? "").trim();
                if (!statusVal) return null;
                return (
                  <div className="mb-3">
                    <StatusBadge value={statusVal} statusMap={statusStyleMap} isDark={isDark} />
                  </div>
                );
              })()}

              {/* Contact info */}
              <div className="space-y-1.5">
                {lead.email ? (
                  <div className={`flex items-center gap-2 text-[12.5px] ${isDark ? "text-[#A1A1AA]" : "text-slate-700"}`}>
                    <Envelope size={12} color={cardT.deep} weight="duotone" className="flex-shrink-0" />
                    <span className="truncate font-medium">{lead.email}</span>
                  </div>
                ) : null}
                {lead.mobile_no ? (
                  <div className={`flex items-center gap-2 text-[12.5px] ${isDark ? "text-[#A1A1AA]" : "text-slate-600"}`}>
                    <Phone size={12} color={cardT.deep} weight="duotone" className="flex-shrink-0" />
                    <span className="font-mono">{lead.mobile_no}</span>
                  </div>
                ) : null}
                {!lead.email && !lead.mobile_no && (
                  <p className={`text-[12px] italic ${isDark ? "text-[#E4E4E7]" : "text-slate-400"}`}>No contact info</p>
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
              <Tooltip title={lead.owner || "No owner"}>
                <div className="flex items-center gap-1.5">
                  <Avatar sx={{ width: 20, height: 20, bgcolor: owCol, fontSize: "0.58rem", fontWeight: 800 }}>
                    {owInit}
                  </Avatar>
                  <span className={`text-[12px] font-medium truncate max-w-[120px] ${isDark ? "text-[#A1A1AA]" : "text-slate-600"}`}>
                    {lead.owner}
                  </span>
                </div>
              </Tooltip>
              <div className="flex items-center gap-1.5">
                {lead.lead_source && (
                  <span className={`flex items-center gap-0.5 text-[11px] px-1.5 py-0.5 rounded-full ${isDark ? "bg-white/10 text-[#A1A1AA]" : "bg-[#f9fbff]/70 text-slate-600"}`}>
                    <TrendUp size={10} color={cardT.deep} weight="duotone" />
                    {lead.lead_source}
                  </span>
                )}
                {lead.rating && (
                  <span className={`flex items-center gap-0.5 text-[11px] px-1.5 py-0.5 rounded-full ${isDark ? "bg-white/10 text-[#A1A1AA]" : "bg-[#f9fbff]/70 text-slate-600"}`}>
                    <Star size={10} color="#F59E0B" weight="duotone" />
                    {lead.rating}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
