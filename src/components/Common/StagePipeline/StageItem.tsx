"use client";

import React from "react";
import type { StageProbabilityOption } from "@/services/api/general_apis/component-picklist-api";

interface StageItemProps {
  stage: StageProbabilityOption;
  isActive: boolean;
  isCompleted: boolean;
  onClick?: () => void;
  variant?: "boxed" | "connected";
  isLast?: boolean;
  isFirst?: boolean;
  prevIsActive?: boolean;
}

export function StageItem({
  stage,
  isActive,
  isCompleted,
  onClick,
  variant = "boxed",
  isLast = false,
  isFirst = false,
  prevIsActive = false,
}: StageItemProps) {
  const base =
    "relative flex items-center whitespace-nowrap px-4 py-2 text-sm font-medium shrink-0 " +
    "transition-colors select-none";

  // Visual states (completed uses normal style per latest requirement)
  const bgCls = isActive ? "bg-[#EEF2FF]" : "bg-white";
  const textCls = isActive ? "text-[#5B5BD6]" : "text-gray-700";
  const borderCls = "border-[#D8DEE8]";

  const shellCls =
    variant === "connected"
      ? `border-t border-b ${isFirst ? "border-l" : ""} ${isLast ? "border-r" : ""} ${borderCls} ${bgCls} ${textCls}`
      : `rounded-md border ${borderCls} ${bgCls} ${textCls}`;

  // Arrow geometry (keep consistent height across stages)
  const ARROW_W = 12; // px (triangle width)
  const HALF_H = 18; // px (half height)
  // Active stage border should be transparent (per requirement).
  // Keep arrow border blue for active to preserve chevron outline.
  const arrowBorderColor = isActive ? "#A5B4FC" /* indigo-300 */ : "#D8DEE8" /* soft gray */;
  const arrowFillColor = isActive ? "#EEF2FF" /* light indigo */ : "#FFFFFF" /* white */;
  const leftFillColor = "#FFFFFF"; // pipeline container background
  const leftCutBorderColor = prevIsActive ? "#A5B4FC" /* indigo-300 */ : "#D8DEE8" /* soft gray */;

  const recordCategory = String(stage.record_category ?? "").toLowerCase();
  const showWonIcon = recordCategory === "closed won";
  const showLostIcon = recordCategory === "closed lost";

  const ThumbsUp = (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
      <path d="M2 20h2a1 1 0 001-1v-8a1 1 0 00-1-1H2v10zm19.83-7.12c.11-.25.17-.52.17-.88v-2a2 2 0 00-2-2h-6.31l.95-4.57.03-.32a1.5 1.5 0 00-.44-1.06L13.17 2 7.59 7.59A2 2 0 007 9v10a2 2 0 002 2h9a2 2 0 001.84-1.22l2-5.12z" />
    </svg>
  );

  const ThumbsDown = (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22 4h-2a1 1 0 00-1 1v8a1 1 0 001 1h2V4zM2.17 11.12A2 2 0 002 12v2a2 2 0 002 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L10.83 22l5.59-5.59A2 2 0 0017 15V5a2 2 0 00-2-2H6a2 2 0 00-1.84 1.22l-2 5.12z" />
    </svg>
  );

  return (
    <button
      type="button"
      onClick={onClick}
      // Allow reverse (backward) stage selection as well:
      // never disable clicks based on completion state; only respect disabled via onClick undefined.
      className={[
        base,
        shellCls,
        "h-9 gap-2",
        variant === "connected" ? "rounded-none" : "",
        variant === "connected" && isFirst ? "rounded-l-md" : "",
        variant === "connected" && isLast ? "rounded-r-md" : "",
        !isFirst && variant === "connected" ? "pl-7" : "", // space for left cut
        // Make active stage (and its arrow fill) render above neighbors
        isActive ? "z-30" : "z-0",
        onClick ? "cursor-pointer" : "cursor-not-allowed opacity-60",
      ].join(" ")}
    >
      {/* Left cut-out with border + fill so arrow borders stay consistent */}
      {variant === "connected" && !isFirst ? (
        <>
          {/* Left border triangle (behind) */}
          <div
            className="absolute left-0 top-0 z-0 h-0 w-0"
            style={{
              borderTop: `${HALF_H}px solid transparent`,
              borderBottom: `${HALF_H}px solid transparent`,
              // Use previous stage color so active arrow isn't overridden by next stage
              borderLeft: `${ARROW_W}px solid ${leftCutBorderColor}`,
            }}
          />
          {/* Left fill triangle (on top) */}
          <div
            className="absolute left-0 top-0 z-10 h-0 w-0"
            style={{
              borderTop: `${HALF_H - 1}px solid transparent`,
              borderBottom: `${HALF_H - 1}px solid transparent`,
              borderLeft: `${ARROW_W - 1}px solid ${leftFillColor}`,
              marginTop: 1,
            }}
          />
        </>
      ) : null}

      <div className="relative z-30 flex items-center gap-1.5 overflow-hidden">
        {showWonIcon && <span className="text-[#475569]">{ThumbsUp}</span>}
        {showLostIcon && <span className="text-[#475569]">{ThumbsDown}</span>}
        <span className="truncate">{stage.label || stage.value}</span>
      </div>

      {/* Right arrow: border triangle behind + fill triangle on top */}
      {variant === "connected" && !isLast ? (
        <>
          {/* Border arrow */}
          <div
            className="absolute top-0 z-10 h-0 w-0"
            style={{
              right: `-${ARROW_W}px`,
              borderTop: `${HALF_H}px solid transparent`,
              borderBottom: `${HALF_H}px solid transparent`,
              borderLeft: `${ARROW_W}px solid ${arrowBorderColor}`,
            }}
          />
          {/* Fill arrow */}
          <div
            className="absolute top-0 z-20 h-0 w-0"
            style={{
              right: `-${ARROW_W - 1}px`,
              borderTop: `${HALF_H - 1}px solid transparent`,
              borderBottom: `${HALF_H - 1}px solid transparent`,
              borderLeft: `${ARROW_W - 1}px solid ${arrowFillColor}`,
            }}
          />
        </>
      ) : null}
    </button>
  );
}

