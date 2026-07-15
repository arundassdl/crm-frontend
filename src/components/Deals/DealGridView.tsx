"use client";
import React from "react";
import { useRouter } from "next/navigation";
import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";
import { useTheme } from "@mui/material/styles";
import { Buildings, User, TrendUp, DotsThreeVertical } from "@phosphor-icons/react";
import { getAvatarColor } from "@/@core/utils/avatarColor";
import { getDealStageToken, fmtAmount, fmtDate, resolveAmount, resolveProbability } from "./dealTokens";

const initials = (n: string) => {
  const p = (n || "?").trim().split(/\s+/);
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : (n || "?").substring(0, 2).toUpperCase();
};

interface Props {
  rows: any[];
  /** Field the stage value lives under (backend-driven, e.g. "status"). */
  statusField?: string;
  /** Amount field resolved from the layout's currency field. */
  amountField?: string;
}

/**
 * Deals Grid View — mirrors the reference
 * (crm-app-UI-Arun-Latest/components/deals/DealGridView.tsx).
 */
export default function DealGridView({ rows, statusField = "status", amountField }: Props) {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  if (!rows || rows.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-20 ${isDark ? "text-[#9CA3AF]" : "text-slate-400"}`}>
        <p className="font-heading text-[15px] font-semibold">No deals found</p>
        <p className="text-[13px] mt-1">Adjust filters or create a new deal</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {rows.map((deal, i) => {
        const dealName = deal.deal_name || deal.organization || deal.name || "—";
        console.log("deal",deal);
        
        const amount = resolveAmount(deal, amountField);
        const account = deal.organization || deal.organization_name || "";
        const stage = deal[statusField] ?? deal.status ?? "";
        const probability = resolveProbability(deal);
        const contactName = deal.lead_name || deal.contact || "";
        const owner = deal.deal_owner || deal.owner || "";
        const created = deal.creation || "";

        const raw = getDealStageToken(stage);
        const fill = isDark ? raw.darkFill : raw.fill;
        const deep = isDark ? raw.darkDeep : raw.deep;

        return (
          <div
            key={deal.name || i}
            onClick={() => deal.name && router.push(`/deals/detail/${encodeURIComponent(deal.name)}`)}
            className={`rounded-2xl border hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group overflow-hidden ${
              isDark ? "border-[#27272A] hover:border-[#3F3F46]" : "border-white/50"
            }`}
            style={{
              backgroundColor: fill,
              boxShadow: isDark ? "0 6px 24px rgba(0,0,0,0.3)" : "0 6px 24px rgba(15,23,42,0.06)",
            }}
          >
            <div className="p-4">
              {/* Deal name + menu */}
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className={`font-heading text-[14px] font-bold truncate leading-tight flex-1 ${isDark ? "text-[#D4D4D8]" : "text-[#0C2472]"}`}>
                  {dealName}
                </h3>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg flex-shrink-0 ${isDark ? "hover:bg-white/10" : "hover:bg-[#f9fbff]/60"}`}
                >
                  <DotsThreeVertical size={15} color={isDark ? "#71717A" : "#475569"} weight="duotone" />
                </button>
              </div>

              {/* Amount — prominent */}
              <p className={`font-heading text-[22px] font-extrabold tracking-tight mb-3 ${isDark ? "text-[#A1A1AA]" : "text-[#0C2472]"}`}>
                {fmtAmount(deal?.deal_value)}
              </p>

              {/* Stage + probability */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {stage && (
                  <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${isDark ? "bg-white/10 text-[#A1A1AA]" : "bg-[#f9fbff]/70 text-[#0C2472]"}`}>
                    <span className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: deep }} />
                    {stage}
                  </span>
                )}
                {probability > 0 && (
                  <span className={`text-[11px] font-bold ${isDark ? "text-[#71717A]" : "text-slate-600"}`}>{probability}%</span>
                )}
              </div>

              {/* Probability bar */}
              <div className={`w-full h-1 rounded-full mb-4 overflow-hidden ${isDark ? "bg-white/10" : "bg-[#f9fbff]/60"}`}>
                <div className="h-full rounded-full transition-all" style={{ width: `${probability}%`, backgroundColor: deep }} />
              </div>

              {/* Account + contact */}
              <div className="space-y-1.5">
                {account && (
                  <div className={`flex items-center gap-1.5 text-[12px] ${isDark ? "text-[#71717A]" : "text-slate-600"}`}>
                    <Buildings size={11} color={deep} weight="duotone" className="flex-shrink-0" />
                    <span className="truncate">{account}</span>
                  </div>
                )}
                {contactName && (
                  <div className={`flex items-center gap-1.5 text-[12px] ${isDark ? "text-[#71717A]" : "text-slate-600"}`}>
                    <User size={11} color={deep} weight="duotone" className="flex-shrink-0" />
                    <span className="truncate">{contactName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className={`flex items-center justify-between px-4 py-2.5 border-t ${isDark ? "border-[#27272A] bg-black/20" : "border-white/50 bg-[#f9fbff]/30"}`}>
              <Tooltip title={owner || "Unassigned"}>
                <div className="flex items-center gap-1.5 min-w-0">
                  <Avatar sx={{ width: 20, height: 20, bgcolor: getAvatarColor(owner || "?"), fontSize: "0.48rem", fontWeight: 800 }}>
                    {initials(owner)}
                  </Avatar>
                  <span className={`text-[12px] font-medium truncate max-w-[140px] ${isDark ? "text-[#71717A]" : "text-slate-600"}`}>
                    {owner || "Unassigned"}
                  </span>
                </div>
              </Tooltip>
              {created && (
                <span className={`flex items-center gap-1 text-[12px] flex-shrink-0 ${isDark ? "text-[#9CA3AF]" : "text-slate-500"}`}>
                  <TrendUp size={10} color={deep} weight="duotone" />
                  {fmtDate(created)}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
