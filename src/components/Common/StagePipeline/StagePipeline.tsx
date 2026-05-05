"use client";

import React, { useMemo } from "react";
import type { StageProbabilityOption } from "@/services/api/general_apis/component-picklist-api";
import { StageItem } from "./StageItem";
import { Actions } from "./Actions";

export interface StagePipelineProps {
  stages: StageProbabilityOption[];
  currentStage?: string;
  onChange: (stage: StageProbabilityOption) => void;
  disabled?: boolean;
  showActions?: boolean;
  startDate?: string | Date | null;
  closingDate?: string | Date | null;
  loading?: boolean;
}

export default function StagePipeline({
  stages,
  currentStage,
  onChange,
  disabled,
  showActions = true,
  startDate,
  closingDate,
  loading,
}: StagePipelineProps) {
  const normalizedStages = useMemo(() => {
    const list = Array.isArray(stages) ? stages.slice() : [];
    // Prefer backend ordering if present
    list.sort((a, b) => (Number(a.display_order ?? 0) - Number(b.display_order ?? 0)));
    return list;
  }, [stages]);

  const activeStage = useMemo(() => {
    if (!currentStage) return null;
    return (
      normalizedStages.find((s) => s.value === currentStage || s.label === currentStage) ||
      null
    );
  }, [normalizedStages, currentStage]);

  const activeOrder = useMemo(() => {
    const o = Number(activeStage?.display_order);
    return Number.isFinite(o) ? o : null;
  }, [activeStage]);

  const [openStages, closingStages] = useMemo(() => {
    const open: StageProbabilityOption[] = [];
    const closing: StageProbabilityOption[] = [];
    for (const s of normalizedStages) {
      const rc = String(s.record_category ?? "").toLowerCase();
      if (rc.startsWith("closed")) closing.push(s);
      else open.push(s);
    }
    return [open, closing];
  }, [normalizedStages]);

  const barStages = useMemo(
    () => [...openStages, ...closingStages],
    [openStages, closingStages]
  );

  const formatShortDate = (d?: string | Date | null) => {
    if (!d) return "";
    const dt = d instanceof Date ? d : new Date(d);
    if (Number.isNaN(dt.getTime())) return "";
    return dt.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
  };

  const startText = formatShortDate(startDate);
  const closingText = formatShortDate(closingDate);

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);
  const [isOverflowing, setIsOverflowing] = React.useState(false);

  const checkScroll = React.useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
      setIsOverflowing(scrollWidth > clientWidth);
    }
  }, []);

  React.useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [checkScroll, barStages]);

  const scroll = (dir: "left" | "right") => {
    if (scrollRef.current) {
      const amount = scrollRef.current.clientWidth * 0.7;
      scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
    }
  };

  return (
    <div className="w-full">
      <div className="mb-2 flex items-end justify-between">
        <div className="text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
          START
          {startText ? <div className="text-[10px] font-medium text-gray-400">{startText}</div> : null}
        </div>
        <div className="text-right text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
          CLOSING
          {closingText ? <div className="text-[10px] font-medium text-gray-400">{closingText}</div> : null}
        </div>
      </div>

      <div className="flex w-full items-center">
        <div className="flex-1 min-w-0">
          <div className="flex w-fit max-w-full items-center rounded-md border border-gray-200 bg-white overflow-hidden h-9">
            {/* Left Arrow */}
            {isOverflowing && (
              <button
                type="button"
                onClick={() => scroll("left")}
                disabled={!canScrollLeft}
                className={[
                  "h-full w-8 flex items-center justify-center border-r border-gray-100 transition-colors shrink-0",
                  canScrollLeft ? "text-gray-600 hover:bg-gray-50" : "text-gray-200 cursor-default",
                ].join(" ")}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* Scrollable Area */}
            <div
              ref={scrollRef}
              onScroll={checkScroll}
              className="flex-1 overflow-x-auto overflow-y-hidden flex items-center scrollbar-hide"
              style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}
            >
              {/* Standard webkit hide scrollbar is handled by global CSS or inline if preferred */}
              <style dangerouslySetInnerHTML={{
                __html: `
                .scrollbar-hide::-webkit-scrollbar { display: none; }
              `}} />

              {loading ? (
                <>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-9 w-28 animate-pulse border-r border-gray-200 bg-gray-100 last:border-r-0 shrink-0"
                    />
                  ))}
                </>
              ) : (
                <>
                  {barStages.map((stage, idx) => {
                    return (
                      <StageItem
                        key={stage.option_id || stage.value || stage.label}
                        stage={stage}
                        isActive={
                          !!activeStage &&
                          (stage.value === activeStage.value || stage.label === activeStage.label)
                        }
                        isCompleted={
                          activeOrder != null
                            ? Number(stage.display_order ?? idx) < activeOrder
                            : false
                        }
                        prevIsActive={
                          idx > 0 &&
                          !!activeStage &&
                          (barStages[idx - 1]?.value === activeStage.value ||
                            barStages[idx - 1]?.label === activeStage.label)
                        }
                        onClick={disabled ? undefined : () => onChange(stage)}
                        variant="connected"
                        isFirst={idx === 0}
                        isLast={idx === barStages.length - 1}
                      />
                    );
                  })}
                </>
              )}
            </div>

            {/* Right Arrow */}
            {isOverflowing && (
              <button
                type="button"
                onClick={() => scroll("right")}
                disabled={!canScrollRight}
                className={[
                  "h-full w-8 flex items-center justify-center border-l border-gray-100 transition-colors shrink-0",
                  canScrollRight ? "text-gray-600 hover:bg-gray-50" : "text-gray-200 cursor-default",
                ].join(" ")}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {showActions ? (
          <div className="ml-4 flex-shrink-0">
            <Actions
              stages={closingStages.length ? closingStages : normalizedStages}
              disabled={disabled}
              onSelect={(s) => !disabled && onChange(s)}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

