"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ClockCounterClockwise,
  Paperclip,
  PencilSimple,
  Plus,
} from "@phosphor-icons/react";

import DealSkeleton from "@/components/Common/Skeletons/DealSkeleton";
import { SettingCard } from "@/components/Users/Users/Detail/ProfileCards";
import { get_role_timeline } from "@/services/api/roles/roles-api";

const SDL_ROLE_DOCTYPE = "SDL Role";

interface TimelineCommentEntry {
  name: string;
  creation: string;
  owner?: string;
  owner_name?: string;
  content?: string;
  subject?: string;
  comment_type?: string;
}

const EXCLUDED_TIMELINE_COMMENT_TYPES = new Set(
  ["Links", "Status change log", "Stage History"].map((t) => t.toLowerCase())
);

/**
 * Frappe `creation` is `"YYYY-MM-DD HH:MM:SS.ffffff"` — not valid ISO 8601.
 * Chrome's `new Date()` tolerates it, but Firefox/Safari return Invalid Date, and a later
 * `.toISOString()` then throws inside render (blank Timeline). Parse defensively:
 * try native first (keeps Chrome behaviour), then fall back to explicit field parsing.
 */
const parseFrappeDate = (value?: string): Date | null => {
  if (!value) return null;
  const s = String(value).trim();
  if (!s) return null;
  const native = new Date(s);
  if (!Number.isNaN(native.getTime())) return native;
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?/.exec(s);
  if (m) {
    const [, y, mo, da, h, mi, se, frac] = m;
    const ms = frac ? Number(frac.slice(0, 3).padEnd(3, "0")) : 0;
    const d = new Date(
      Number(y),
      Number(mo) - 1,
      Number(da),
      Number(h),
      Number(mi),
      Number(se),
      ms
    );
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
};

const isTimelineCommentExcluded = (entry: TimelineCommentEntry) => {
  const ct = String(entry.comment_type ?? "")
    .trim()
    .toLowerCase();
  return ct.length > 0 && EXCLUDED_TIMELINE_COMMENT_TYPES.has(ct);
};

/** Plain text from a Frappe comment `content` (HTML or raw dump), collapsed. */
const stripToText = (raw: string): string =>
  String(raw ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Frappe stores raw HTML / Python-repr change dumps in `Comment.content` (e.g. a
 * `permission: [{...datetime.datetime(...)...}]` snapshot). Render a readable
 * "Subject: verb" action + creation icon instead of the raw dump, matching the reference.
 */
const deriveActivity = (
  entry: TimelineCommentEntry
): { subject: string; detail: string; kind: "created" | "attachment" | "edit" } => {
  const ct = String(entry.comment_type ?? "").toLowerCase();
  const text = stripToText(entry.content || entry.subject || "");
  const lower = text.toLowerCase();

  if (ct === "attachment") {
    return { subject: "Attachment", detail: "added", kind: "attachment" };
  }

  /** Field-change / child-table dumps: long, or carrying repr/JSON markers. */
  const looksLikeDump =
    /[[{]/.test(text) &&
    (text.length > 120 ||
      /datetime\.datetime|'name'|"name"|chkview|chkcreate|frontend_module/i.test(text));

  if (looksLikeDump) {
    if (/permission/i.test(lower)) {
      return { subject: "Permissions", detail: "modified", kind: "edit" };
    }
    return { subject: "Role", detail: "updated", kind: "edit" };
  }

  if (ct === "created" || /\bcreated\b/.test(lower)) {
    return { subject: "Role", detail: "created", kind: "created" };
  }

  if (!text) {
    return { subject: "Role", detail: "updated", kind: "edit" };
  }

  /** Readable comment: bold the leading word (matches reference "Subject: rest"). */
  const [first, ...rest] = text.split(" ");
  return { subject: first, detail: rest.join(" "), kind: "edit" };
};

export type RoleDetailTimelineProps = {
  /** Frappe document name for SDL Role (Comment.reference_name) */
  recordName?: string;
  /** Load comments only when the Timeline tab is visible */
  active: boolean;
};

const RoleDetailTimeline: React.FC<RoleDetailTimelineProps> = ({
  recordName,
  active,
}) => {
  const [timelineComments, setTimelineComments] = useState<
    TimelineCommentEntry[]
  >([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

  const loadTimeline = useCallback(async () => {
    if (!recordName) {
      setTimelineComments([]);
      return;
    }
    try {
      setTimelineLoading(true);
      const res: any = await get_role_timeline(recordName);
      const commentsArray = Array.isArray(res) ? res : res?.data || [];
      setTimelineComments(commentsArray);
    } catch {
      setTimelineComments([]);
    } finally {
      setTimelineLoading(false);
    }
  }, [recordName]);

  useEffect(() => {
    if (!active || !recordName) return;
    loadTimeline();
  }, [active, recordName, loadTimeline]);

  const groupedTimeline = useMemo(() => {
    const groups: Record<string, { date: Date; items: TimelineCommentEntry[] }> = {};

    timelineComments.forEach((entry) => {
      const dt = parseFrappeDate(entry?.creation);
      if (!dt) return;
      if (isTimelineCommentExcluded(entry)) return;
      const key = `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`;
      if (!groups[key]) groups[key] = { date: dt, items: [] };
      groups[key].items.push(entry);
    });

    return Object.values(groups)
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .map(({ date, items }) => ({
        date,
        items: items.sort(
          (a, b) =>
            (parseFrappeDate(b.creation)?.getTime() ?? 0) -
            (parseFrappeDate(a.creation)?.getTime() ?? 0)
        ),
      }));
  }, [timelineComments]);

  const formatDisplayDate = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const formatTime = (creation: string) => {
    const d = parseFrappeDate(creation);
    if (!d) return "";
    return d
      .toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })
      .toLowerCase();
  };

  if (!recordName) {
    return (
      <SettingCard icon={ClockCounterClockwise} title="History" color="#1D4ED8">
        <div className="py-4 text-[13px] text-slate-400">
          Save the role or open a valid role to view history.
        </div>
      </SettingCard>
    );
  }

  return (
    <SettingCard icon={ClockCounterClockwise} title="History" color="#1D4ED8">
      {timelineLoading ? (
        <div className="py-2">
          <DealSkeleton />
        </div>
      ) : groupedTimeline.length === 0 ? (
        <div className="py-8 text-center text-[14px] text-slate-400">
          No activity recorded for this role.
        </div>
      ) : (
        <div className="space-y-5 py-2">
          {groupedTimeline.map((group) => (
            <div key={group.date.getTime()}>
              <div className="mb-4 flex items-center gap-3">
                <span className="whitespace-nowrap text-[12px] font-semibold text-slate-400">
                  {formatDisplayDate(group.date)}
                </span>
                <div className="h-px flex-1 bg-[#E3ECFC] dark:bg-[#27272A]" />
              </div>
              <div className="space-y-4">
                {group.items.map((entry) => {
                  const { subject, detail, kind } = deriveActivity(entry);
                  const Icon = kind === "created" ? Plus : kind === "attachment" ? Paperclip : PencilSimple;
                  const author = entry.owner_name || entry.owner;
                  return (
                    <div key={entry.name} className="flex items-start gap-4">
                      <span className="w-[64px] flex-shrink-0 pt-0.5 text-[12px] font-medium text-slate-400">
                        {formatTime(entry.creation)}
                      </span>
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] dark:bg-[#27272A]">
                        <Icon size={13} color="#1D4ED8" weight="duotone" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[14px] leading-snug text-slate-700 dark:text-[#D4D4D8]">
                          <span className="font-bold">{subject}:</span>{" "}
                          <span className="font-medium">{detail}</span>
                        </div>
                        {author ? (
                          <div className="mt-0.5 break-all text-[11.5px] text-[#1D4ED8] dark:text-[#A1A1AA]">
                            by {author}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </SettingCard>
  );
};

export default RoleDetailTimeline;
