"use client";

import React, { useState } from "react";
import { Button } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Paperclip, GridFour, List } from "@phosphor-icons/react";
import MultiFileUpload from "@/components/Common/Upload/MultiFileUpload";

interface AttachmentsSectionProps {
  /** Doctype the files are attached to (e.g. "CRM Deal", "Contact", "CRM Organization"). */
  doctype: string;
  /** Record name the files are attached to. */
  name: string;
  /** Called whenever the uploaded file list changes (for related-list counts). */
  onCountChange?: (count: number) => void;
  allowedTypes?: string[];
  maxFiles?: number;
  folder?: string;
  /** DOM id for related-list scroll targets. */
  id?: string;
  title?: string;
}

/**
 * Shared Attachments card — the common Attachments UI for every module.
 *
 * Owns the card chrome (paperclip header, grid/list view toggle, Attach button)
 * and delegates upload/list/delete behaviour to MultiFileUpload, so all modules
 * get identical layout, spacing, typography and colors while keeping the existing
 * attachment functionality intact.
 */
export default function AttachmentsSection({
  doctype,
  name,
  onCountChange,
  allowedTypes = ["image/*", "application/pdf"],
  maxFiles = 10,
  folder = "Home/Attachments",
  id = "section-attachments",
  title = "Attachments",
}: AttachmentsSectionProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [attachView, setAttachView] = useState<"grid" | "list">("grid");
  const [attachSignal, setAttachSignal] = useState(0);

  return (
    <div
      id={id}
      className={`rounded-2xl border shadow-sm overflow-hidden ${
        isDark ? "bg-[#1C1C1E] border-[#27272A]" : "bg-[#f9fbff] border-[#E3ECFC]"
      }`}
    >
      {/* Header: icon + title + view toggle + Attach */}
      <div className={`flex items-center gap-2.5 px-5 py-3.5 border-b ${isDark ? "border-[#27272A]" : "border-[#EFF6FF]"}`}>
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isDark ? "bg-[#27272A]" : "bg-[#EFF6FF]"}`}>
          <Paperclip size={13} color={isDark ? "#9CA3AF" : "#1D4ED8"} weight="duotone" />
        </div>
        <p className={`font-heading text-[12px] font-bold uppercase tracking-[0.12em] flex-1 ${isDark ? "text-[#D4D4D8]" : "text-[#1D4ED8]"}`}>
          {title}
        </p>

        <div className="flex items-center gap-2">
          {/* Grid / List toggle */}
          <div className={`flex items-center rounded-lg p-0.5 gap-0.5 ${isDark ? "bg-[#27272A]" : "bg-[#EFF6FF]"}`}>
            {([
              { k: "grid", Icon: GridFour },
              { k: "list", Icon: List },
            ] as const).map(({ k, Icon }) => (
              <button
                key={k}
                type="button"
                aria-label={`${k} view`}
                aria-pressed={attachView === k}
                onClick={() => setAttachView(k)}
                className={`p-1 rounded-md transition-colors ${
                  attachView === k
                    ? isDark
                      ? "bg-[#3F3F46] text-[#D4D4D8]"
                      : "bg-[#f9fbff] text-[#1D4ED8]"
                    : isDark
                      ? "text-[#9CA3AF] hover:text-[#D4D4D8]"
                      : "text-slate-400 hover:text-[#1D4ED8]"
                }`}
              >
                <Icon size={13} weight="duotone" />
              </button>
            ))}
          </div>

          {/* Attach */}
          <Button
            size="small"
            variant="outlined"
            onClick={() => setAttachSignal((s) => s + 1)}
            sx={{
              borderColor: isDark ? "#3F3F46" : "#E3ECFC",
              color: isDark ? "#A1A1AA" : "#0C2472",
              bgcolor: isDark ? "#27272A" : "#E3ECFC",
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.73rem",
              "&:hover": {
                borderColor: isDark ? "#9CA3AF" : "#E3ECFC",
                bgcolor: isDark ? "#3F3F46" : "#f9fbff",
              },
            }}
          >
            Attach
          </Button>
        </div>
      </div>

      {/* Body: files (grid/list) or the empty state, from MultiFileUpload */}
      <div className="px-5 py-4">
        <MultiFileUpload
          attachedToDoctype={doctype}
          attachedToName={name}
          allowedTypes={allowedTypes}
          folder={folder}
          maxFiles={maxFiles}
          hideHeader
          openSignal={attachSignal}
          viewMode={attachView}
          onUploadComplete={(files) => onCountChange?.(files.length)}
        />
      </div>
    </div>
  );
}
