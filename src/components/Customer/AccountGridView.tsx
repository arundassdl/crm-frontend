"use client";
import React from "react";
import { useRouter } from "next/navigation";
import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";
import { useTheme } from "@mui/material/styles";
import { Phone, Globe, DotsThreeVertical } from "@phosphor-icons/react";
import { getAvatarColor, getVibrantAvatarColor } from "@/@core/utils/avatarColor";

// Account (entity) tiles use the vibrant palette to match the reference; owner
// avatars use the theme-blue palette (they represent a user).
const avatarColor = (n: string) => getVibrantAvatarColor(n || "Account");
const initials = (n: string) => (n || "?").trim().substring(0, 2).toUpperCase();
const ownerInitials = (n: string) =>
  (n || "?").trim().split(/\s+/).map((w) => w[0]).join("").toUpperCase().slice(0, 2);

// Alternating card palette (matches the reference accounts Grid View).
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

const shortDate = (v: string) => {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d.getTime())) return String(v).split(",")[0] || "";
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
};

interface Props {
  rows: any[];
}

export default function AccountGridView({ rows }: Props) {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  if (!rows || rows.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-20 ${isDark ? "text-[#9CA3AF]" : "text-slate-400"}`}>
        <p className="font-heading text-[15px] font-semibold">No accounts found</p>
        <p className="text-[13px] mt-1">Adjust filters or add a new account</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {rows.map((acc, i) => {
        const accName = acc.organization_name || acc.name || "—";
        const phone = acc.customer_phone || acc.phone || acc.mobile_no || acc.primary_contact_phone || "";
        const website = acc.website || "";
        const accountType = acc.customer_type || "";
        const ownerName = acc.account_owner || acc.owner || "";
        const creation = acc.creation || "";

        const avCol = avatarColor(accName);
        const owCol = getAvatarColor(ownerName || "?");

        const colored = i % 2 === 0;
        const pal = isDark ? DARK_PASTELS : PASTELS;
        const baseT = isDark ? { fill: "#1C1C1E", deep: "#4F8EF7" } : { fill: "#f9fbff", deep: "#3B82F6" };
        const cardT = colored ? pal[Math.floor(i / 2) % pal.length] : baseT;

        return (
          <div
            key={acc.name || i}
            onClick={() => acc.name && router.push(`/accounts/detail/${encodeURIComponent(acc.name)}`)}
            className={`rounded-2xl border hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group overflow-hidden ${
              isDark ? "border-[#27272A] hover:border-[#3F3F46]" : colored ? "border-white/50" : "border-[#E3ECFC]"
            }`}
            style={{
              backgroundColor: cardT.fill,
              boxShadow: isDark ? "0 6px 24px rgba(0,0,0,0.3)" : "0 6px 24px rgba(15,23,42,0.06)",
            }}
          >
            <div className="p-4">
              {/* Icon + Name + Menu */}
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-extrabold text-[13px] shadow-sm"
                  style={{ backgroundColor: avCol }}
                >
                  {initials(accName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-heading text-[14px] font-bold truncate transition-colors ${isDark ? "text-[#D4D4D8]" : "text-[#0C2472]"}`}>
                    {accName}
                  </p>
                  {accountType && (
                    <span className={`inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full mt-1 ${isDark ? "bg-white/10 text-[#A1A1AA]" : "bg-[#f9fbff]/70 text-[#0C2472]"}`}>
                      {accountType}
                    </span>
                  )}
                </div>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg ${isDark ? "hover:bg-white/10" : "hover:bg-[#f9fbff]/60"}`}
                >
                  <DotsThreeVertical size={15} color={isDark ? "#71717A" : "#475569"} weight="duotone" />
                </button>
              </div>

              {/* Details */}
              <div className="space-y-1.5">
                {phone && (
                  <div className={`flex items-center gap-2 text-[14px] font-mono ${isDark ? "text-[#A1A1AA]" : "text-slate-600"}`}>
                    <Phone size={11} color={cardT.deep} weight="duotone" className="flex-shrink-0" />
                    <span>{phone}</span>
                  </div>
                )}
                {website && (
                  <div className={`flex items-center gap-2 text-[14px] truncate ${isDark ? "text-[#A1A1AA]" : "text-slate-700"}`}>
                    <Globe size={11} color={cardT.deep} weight="duotone" className="flex-shrink-0" />
                    <span className="truncate">{website}</span>
                  </div>
                )}
                {!phone && !website && (
                  <p className={`text-[14px] italic ${isDark ? "text-[#9CA3AF]" : "text-slate-400"}`}>No details</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div
              className={`flex items-center justify-between px-4 py-2.5 border-t ${
                isDark ? "border-[#27272A] bg-black/20" : colored ? "border-white/50 bg-[#f9fbff]/30" : "border-[#EFF6FF] bg-[#EFF6FF]"
              }`}
            >
              <Tooltip title={ownerName || "No owner"}>
                <div className="flex items-center gap-1.5 min-w-0">
                  <Avatar sx={{ width: 20, height: 20, bgcolor: owCol, fontSize: "0.48rem", fontWeight: 800 }}>
                    {ownerInitials(ownerName)}
                  </Avatar>
                  <span className={`text-[12px] font-medium truncate max-w-[130px] ${isDark ? "text-[#71717A]" : "text-slate-600"}`}>
                    {ownerName || "—"}
                  </span>
                </div>
              </Tooltip>
              {creation && (
                <span className={`text-[12px] flex-shrink-0 ${isDark ? "text-[#9CA3AF]" : "text-slate-500"}`}>{shortDate(creation)}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
