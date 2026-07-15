"use client";
import React from "react";
import { useRouter } from "next/navigation";
import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";
import { useTheme } from "@mui/material/styles";
import { Envelope, Phone, DeviceMobile, Buildings, DotsThreeVertical } from "@phosphor-icons/react";
import { getAvatarColor } from "@/@core/utils/avatarColor";

// Theme-aligned avatar color from the shared palette (consistent with the rest of the app).
const avatarColor = (n: string) => getAvatarColor(n || "Contact");
const initials = (first: string, last: string, fallback: string) => {
  const a = (first || "").trim();
  const b = (last || "").trim();
  const combined = `${a[0] || ""}${b[0] || ""}`.toUpperCase();
  return combined || (fallback || "?").trim().substring(0, 2).toUpperCase();
};
const ownerInitials = (n: string) =>
  (n || "?").trim().split(/\s+/).map((w) => w[0]).join("").toUpperCase().slice(0, 2);

// Alternating card palette (matches the reference contacts Grid View).
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
}

export default function ContactGridView({ rows }: Props) {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  if (!rows || rows.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-20 ${isDark ? "text-[#9CA3AF]" : "text-slate-400"}`}>
        <p className="font-heading text-[15px] font-semibold">No contacts found</p>
        <p className="text-[13px] mt-1">Adjust filters or add a new contact</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {rows.map((c, i) => {
        const firstName = c.first_name || "";
        const lastName = c.last_name || "";
        const fullName = c.full_name || `${firstName} ${lastName}`.trim() || c.name || "—";
        const email = c.email_id || c.email || "";
        const phone = c.phone || "";
        const mobile = c.mobile_no || c.actual_mobile_no || "";
        const account = c.company_name || c.organization || c.account_name || "";
        const ownerName = c.contact_owner || c.owner || "";

        const avCol = avatarColor(fullName);
        const avInit = initials(firstName, lastName, fullName);
        const owCol = avatarColor(ownerName || "?");

        const colored = i % 2 === 0;
        const pal = isDark ? DARK_PASTELS : PASTELS;
        const baseT = isDark ? { fill: "#1C1C1E", deep: "#4F8EF7" } : { fill: "#f9fbff", deep: "#3B82F6" };
        const cardT = colored ? pal[Math.floor(i / 2) % pal.length] : baseT;

        return (
          <div
            key={c.name || i}
            onClick={() => c.name && router.push(`/contacts/detail/${encodeURIComponent(c.name)}`)}
            className={`rounded-2xl border hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group overflow-hidden ${
              isDark ? "border-[#27272A] hover:border-[#3F3F46]" : colored ? "border-white/50" : "border-[#E3ECFC]"
            }`}
            style={{
              backgroundColor: cardT.fill,
              boxShadow: isDark ? "0 6px 24px rgba(0,0,0,0.3)" : "0 6px 24px rgba(15,23,42,0.06)",
            }}
          >
            <div className="p-4">
              {/* Avatar + Name + Menu */}
              <div className="flex items-start gap-3 mb-3">
                <Avatar sx={{ width: 44, height: 44, bgcolor: avCol, fontSize: "0.85rem", fontWeight: 800, flexShrink: 0, boxShadow: "0 2px 8px rgba(12,36,114,0.15)" }}>
                  {avInit}
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className={`font-heading text-[14px] font-bold truncate transition-colors ${isDark ? "text-[#D4D4D8]" : "text-[#0C2472]"}`}>
                    {fullName}
                  </p>
                  {account && (
                    <p className={`text-[12px] truncate flex items-center gap-1 mt-0.5 ${isDark ? "text-[#71717A]" : "text-slate-600"}`}>
                      <Buildings size={10} color={cardT.deep} weight="duotone" />
                      {account}
                    </p>
                  )}
                </div>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg ${isDark ? "hover:bg-white/10" : "hover:bg-[#f9fbff]/60"}`}
                >
                  <DotsThreeVertical size={15} color={isDark ? "#71717A" : "#475569"} weight="duotone" />
                </button>
              </div>

              {/* Contact info */}
              <div className="space-y-1.5">
                {email ? (
                  <div className={`flex items-center gap-2 text-[14px] ${isDark ? "text-[#A1A1AA]" : "text-slate-700"}`}>
                    <Envelope size={12} color={cardT.deep} weight="duotone" className="flex-shrink-0" />
                    <span className="truncate font-medium">{email}</span>
                  </div>
                ) : null}
                {phone ? (
                  <div className={`flex items-center gap-2 text-[14px] font-mono ${isDark ? "text-[#A1A1AA]" : "text-slate-600"}`}>
                    <Phone size={12} color={cardT.deep} weight="duotone" className="flex-shrink-0" />
                    <span>{phone}</span>
                  </div>
                ) : null}
                {mobile ? (
                  <div className={`flex items-center gap-2 text-[14px] font-mono ${isDark ? "text-[#A1A1AA]" : "text-slate-600"}`}>
                    <DeviceMobile size={12} color={cardT.deep} weight="duotone" className="flex-shrink-0" />
                    <span>{mobile}</span>
                  </div>
                ) : null}
                {!email && !phone && !mobile && (
                  <p className={`text-[14px] italic ${isDark ? "text-[#9CA3AF]" : "text-slate-400"}`}>No contact info</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div
              className={`flex items-center gap-2 px-4 py-2.5 border-t ${
                isDark ? "border-[#27272A] bg-black/20" : colored ? "border-white/50 bg-[#f9fbff]/30" : "border-[#EFF6FF] bg-[#EFF6FF]"
              }`}
            >
              <Tooltip title={ownerName || "No owner"}>
                <div className="flex items-center gap-1.5 min-w-0">
                  <Avatar sx={{ width: 20, height: 20, bgcolor: owCol, fontSize: "0.48rem", fontWeight: 800 }}>
                    {ownerInitials(ownerName)}
                  </Avatar>
                  <span className={`text-[12px] font-medium truncate max-w-[160px] ${isDark ? "text-[#71717A]" : "text-slate-600"}`}>
                    {ownerName || "—"}
                  </span>
                </div>
              </Tooltip>
            </div>
          </div>
        );
      })}
    </div>
  );
}
