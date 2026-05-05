"use client";

import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import type { StageProbabilityOption } from "@/services/api/general_apis/component-picklist-api";

interface ActionsProps {
  stages: StageProbabilityOption[];
  disabled?: boolean;
  onSelect: (stage: StageProbabilityOption) => void;
}

interface SplitDropdownButtonProps {
  label: string;
  icon: React.ReactNode;
  options: StageProbabilityOption[];
  disabled?: boolean;
  onSelect: (stage: StageProbabilityOption) => void;
  colorScheme: "green" | "red";
}

interface DropdownPos {
  top: number;
  left: number;
  width: number;
}

function SplitDropdownButton({
  label,
  icon,
  options,
  disabled,
  onSelect,
  colorScheme,
}: SplitDropdownButtonProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<DropdownPos | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isDisabled = disabled || options.length === 0;

  const colors =
    colorScheme === "green"
      ? {
        border: "border-emerald-200",
        bg: "bg-[#ECFDF5]",
        iconText: "text-emerald-500",
        divider: "bg-emerald-200",
        chevronHover: "hover:bg-emerald-100/60",
        mainHover: "hover:bg-emerald-100/60",
        dropdownItem: "hover:bg-emerald-50 text-gray-700",
        disabledIcon: "text-emerald-300",
      }
      : {
        border: "border-rose-200",
        bg: "bg-[#FFF1F2]",
        iconText: "text-rose-500",
        divider: "bg-rose-200",
        chevronHover: "hover:bg-rose-100/60",
        mainHover: "hover:bg-rose-100/60",
        dropdownItem: "hover:bg-rose-50 text-gray-700",
        disabledIcon: "text-rose-300",
      };

  const calcPos = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setPos({
      top: rect.bottom + 4,
      left: rect.right,
      width: Math.max(rect.width, 160),
    });
  }, []);

  const openDropdown = useCallback(() => {
    if (isDisabled) return;
    calcPos();
    setOpen(true);
  }, [isDisabled, calcPos]);

  // Close on outside click or scroll
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onScroll = () => setOpen(false);
    document.addEventListener("mousedown", close);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open]);

  const handleMainClick = () => {
    if (isDisabled) return;
    if (options.length === 1) {
      onSelect(options[0]);
    } else {
      if (open) setOpen(false);
      else openDropdown();
    }
  };

  const toggleDropdown = () => {
    if (isDisabled) return;
    if (open) setOpen(false);
    else openDropdown();
  };

  return (
    <div ref={containerRef} className="relative inline-flex">
      <div
        className={[
          "inline-flex items-center rounded-md border text-sm font-medium transition-colors select-none",
          colors.border,
          colors.bg,
          isDisabled ? "opacity-50" : "",
        ].join(" ")}
      >
        {/* Main: icon */}
        <button
          type="button"
          disabled={isDisabled}
          onClick={handleMainClick}
          className={[
            "flex items-center px-2 py-1.5 rounded-l-md transition-colors bg-transparent",
            isDisabled ? "cursor-not-allowed" : `${colors.mainHover} cursor-pointer`,
          ].join(" ")}
        >
          <span className={isDisabled ? colors.disabledIcon : colors.iconText}>{icon}</span>
        </button>

        {/* Divider */}
        <span className={`w-px self-stretch ${colors.divider}`} />

        {/* Chevron toggle */}
        <button
          type="button"
          disabled={isDisabled}
          onClick={toggleDropdown}
          className={[
            "flex items-center px-1.5 py-1.5 rounded-r-md transition-colors bg-transparent",
            isDisabled ? "cursor-not-allowed" : `${colors.chevronHover} cursor-pointer`,
          ].join(" ")}
          aria-label={`Open ${label} stages`}
        >
          <svg
            className={[
              "h-3 w-3 transition-transform",
              isDisabled ? "text-gray-300" : "text-gray-500",
              open ? "rotate-180" : "",
            ].join(" ")}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {/* Portal dropdown — renders at body to escape overflow clipping */}
      {open && pos &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              minWidth: pos.width,
              transform: "translateX(-100%)",
              zIndex: 9999,
            }}
            className="rounded-md border border-gray-200 bg-white py-1 shadow-lg"
          >
            {options.map((opt) => (
              <button
                key={opt.option_id || opt.value || opt.label}
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => {
                  onSelect(opt);
                  setOpen(false);
                }}
                className="w-full px-3 py-1.5 text-left text-sm bg-white hover:bg-white"
              >
                {opt.label || opt.value}
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}

export function Actions({ stages, disabled, onSelect }: ActionsProps) {
  const wonStages = useMemo(
    () => stages.filter((s) => String(s.record_category).toLowerCase() === "closed won"),
    [stages]
  );
  const lostStages = useMemo(
    () => stages.filter((s) => String(s.record_category).toLowerCase() === "closed lost"),
    [stages]
  );

  const ThumbsUpIcon = (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M2 20h2a1 1 0 001-1v-8a1 1 0 00-1-1H2v10zm19.83-7.12c.11-.25.17-.52.17-.88v-2a2 2 0 00-2-2h-6.31l.95-4.57.03-.32a1.5 1.5 0 00-.44-1.06L13.17 2 7.59 7.59A2 2 0 007 9v10a2 2 0 002 2h9a2 2 0 001.84-1.22l2-5.12z" />
    </svg>
  );

  const ThumbsDownIcon = (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22 4h-2a1 1 0 00-1 1v8a1 1 0 001 1h2V4zM2.17 11.12A2 2 0 002 12v2a2 2 0 002 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L10.83 22l5.59-5.59A2 2 0 0017 15V5a2 2 0 00-2-2H6a2 2 0 00-1.84 1.22l-2 5.12z" />
    </svg>
  );

  return (
    <div className="flex items-center gap-2">
      <SplitDropdownButton
        label="Won"
        icon={ThumbsUpIcon}
        options={wonStages}
        disabled={disabled}
        onSelect={onSelect}
        colorScheme="green"
      />
      <SplitDropdownButton
        label="Lost"
        icon={ThumbsDownIcon}
        options={lostStages}
        disabled={disabled}
        onSelect={onSelect}
        colorScheme="red"
      />
    </div>
  );
}
