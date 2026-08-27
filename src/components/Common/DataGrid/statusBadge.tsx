import React from "react";

/**
 * Shared, configuration-driven status badge used by the data grid listings
 * (and the Leads card view).
 *
 * The set of statuses is NEVER hardcoded here — it always comes from the
 * Component Pick List API (see `useComponentPicklist`), so statuses that are
 * added, renamed, recoloured or removed in the module configuration are
 * reflected automatically. This module only decides how a given status is
 * *painted*, in this order:
 *
 *   1. the `color` configured on the pick list option (authoritative),
 *   2. a curated tint for well-known status names (design-approved defaults
 *      for modules whose pick list has no colour configured yet),
 *   3. a deterministic colour derived from the label, so a brand-new status
 *      still gets a stable, distinct badge instead of falling back to plain text.
 */

/** A status option as returned by the Component Pick List API. */
export type StatusOption = { value: string; label?: string; color?: string };

export interface StatusTokens {
  /** Pill background. */
  bg: string;
  /** Label colour. */
  text: string;
  /** Leading dot colour. */
  dot: string;
}

/** Normalised lookup key so backend casing/whitespace never breaks matching. */
const norm = (v: unknown) => String(v ?? "").trim().toLowerCase();

const isHex6 = (hex: string) => /^#[0-9a-fA-F]{6}$/.test(hex);

/** Append an alpha channel to a 7-char hex colour, e.g. "#0C2472" + 0.1 -> "#0C24721A". */
const hexWithAlpha = (hex: string, alpha: number): string => {
  if (!isHex6(hex)) return "#F1F5F9";
  const a = Math.round(Math.min(Math.max(alpha, 0), 1) * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex}${a}`;
};

/** Mix a hex colour towards black (amount > 0) or white (amount < 0). */
const shade = (hex: string, amount: number): string => {
  if (!isHex6(hex)) return "#475569";
  const target = amount >= 0 ? 0 : 255;
  const t = Math.abs(amount);
  const ch = (i: number) => {
    const c = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
    return Math.round(c + (target - c) * t)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${ch(0)}${ch(1)}${ch(2)}`;
};

/**
 * Design-approved tints for common status names. This is a *styling* fallback
 * only — it never determines which statuses exist, and a colour configured on
 * the pick list option always wins over it.
 */
const CURATED: Record<string, { bg: string; text: string; dot: string; bgDark: string; textDark: string }> = {
  "new": { bg: "#F1F5F9", text: "#475569", dot: "#94A3B8", bgDark: "rgba(148, 163, 184, 0.15)", textDark: "#94A3B8" },
  "contacted": { bg: "#E3ECFC", text: "#0C2472", dot: "#3B82F6", bgDark: "rgba(96, 165, 250, 0.15)", textDark: "#60A5FA" },
  "nurture": { bg: "#EFF6FF", text: "#007adb", dot: "#007adb", bgDark: "rgba(0, 122, 219, 0.15)", textDark: "#60A5FA" },
  "qualified": { bg: "#DCFCE7", text: "#166534", dot: "#16A34A", bgDark: "rgba(16, 185, 129, 0.15)", textDark: "#34D399" },
  "unqualified": { bg: "#F1F5F9", text: "#475569", dot: "#94A3B8", bgDark: "rgba(148, 163, 184, 0.15)", textDark: "#94A3B8" },
  "junk": { bg: "#FEF2F2", text: "#991B1B", dot: "#EF4444", bgDark: "rgba(244, 63, 94, 0.15)", textDark: "#F87171" },
  "in progress": { bg: "#E3ECFC", text: "#0C2472", dot: "#1D4ED8", bgDark: "rgba(251, 191, 36, 0.15)", textDark: "#FBBF24" },
  "lost": { bg: "#FEF2F2", text: "#991B1B", dot: "#EF4444", bgDark: "rgba(244, 63, 94, 0.15)", textDark: "#F87171" },
  // Deal stages
  "qualification": { bg: "#F1F5F9", text: "#334155", dot: "#64748B", bgDark: "rgba(148, 163, 184, 0.15)", textDark: "#94A3B8" },
  "demo/making": { bg: "#FFF7ED", text: "#9A3412", dot: "#EA580C", bgDark: "rgba(251, 146, 60, 0.15)", textDark: "#FB923C" },
  "proposal/quotation": { bg: "#EFF6FF", text: "#0C2472", dot: "#007BE0", bgDark: "rgba(0, 123, 224, 0.15)", textDark: "#60A5FA" },
  "negotiation": { bg: "#FEFCE8", text: "#854D0E", dot: "#CA8A04", bgDark: "rgba(234, 179, 8, 0.15)", textDark: "#FBBF24" },
  "ready to close": { bg: "#F5F3FF", text: "#5B21B6", dot: "#8642C2", bgDark: "rgba(167, 139, 250, 0.15)", textDark: "#A78BFA" },
  "won": { bg: "#DCFCE7", text: "#166534", dot: "#16A34A", bgDark: "rgba(16, 185, 129, 0.15)", textDark: "#34D399" },
};

/**
 * Meaning-based accents for custom status names ("Junk Lead", "Not Contacted",
 * …). These match on words, not on a fixed list of statuses, so a renamed or
 * newly added status still lands on a sensible colour. Order matters: negative
 * wording is checked first so "Not Contacted" reads as neutral rather than
 * active. Configuring a colour on the pick list overrides all of this.
 */
const SEMANTIC_ACCENTS: Array<{ test: RegExp; accent: string }> = [
  { test: /\b(lost|junk|spam|dead|rejected|cancell?ed|disqualified|failed)\b/, accent: "#EF4444" },
  { test: /\b(not|no|none|unqualified|inactive|pending|hold|open)\b/, accent: "#64748B" },
  { test: /\b(won|converted|success|completed|closed|qualified)\b/, accent: "#16A34A" },
  { test: /\b(contact|contacted|progress|working|nurture|followup|follow-up|attempted)\b/, accent: "#3B82F6" },
];

/**
 * Stable palette for statuses that match none of the above. Picked by label
 * hash so the same status always renders in the same colour across sessions,
 * users and views.
 */
const FALLBACK_ACCENTS = [
  "#3B82F6", "#16A34A", "#EA580C", "#8B5CF6", "#0EA5E9",
  "#DB2777", "#CA8A04", "#0D9488", "#64748B",
];

const accentForLabel = (label: string): string => {
  const semantic = SEMANTIC_ACCENTS.find((s) => s.test.test(label));
  if (semantic) return semantic.accent;

  let hash = 0;
  for (let i = 0; i < label.length; i++) hash = (hash * 31 + label.charCodeAt(i)) >>> 0;
  return FALLBACK_ACCENTS[hash % FALLBACK_ACCENTS.length];
};

/** Derive pill tokens from a single accent colour. */
const tokensFromAccent = (accent: string, isDark: boolean): StatusTokens =>
  isDark
    ? { bg: hexWithAlpha(accent, 0.15), text: shade(accent, -0.3), dot: shade(accent, -0.3) }
    : { bg: hexWithAlpha(accent, 0.12), text: shade(accent, 0.45), dot: accent };

/**
 * Resolve the pill colours for a status value.
 *
 * @param value           the raw status value stored on the record
 * @param configuredColor the colour configured on the matching pick list option
 */
export const getStatusTokens = (
  value: string,
  configuredColor: string | undefined,
  isDark: boolean
): StatusTokens => {
  const accent = (configuredColor || "").trim();
  if (isHex6(accent)) return tokensFromAccent(accent, isDark);

  const curated = CURATED[norm(value)];
  if (curated) {
    return isDark
      ? { bg: curated.bgDark, text: curated.textDark, dot: curated.textDark }
      : { bg: curated.bg, text: curated.text, dot: curated.dot };
  }

  return tokensFromAccent(accentForLabel(norm(value)), isDark);
};

/** Fast lookup of configured label/colour, keyed by normalised status value. */
export type StatusStyleMap = Map<string, { label: string; color?: string }>;

/** Build a lookup map from the pick list options returned by the backend. */
export const buildStatusStyleMap = (options?: StatusOption[]): StatusStyleMap => {
  const map: StatusStyleMap = new Map();
  (options ?? []).forEach((o) => {
    if (!o?.value) return;
    map.set(norm(o.value), { label: o.label || o.value, color: o.color });
  });
  return map;
};

interface StatusBadgeProps {
  /** Raw status value from the record. */
  value: string;
  /** Configured options, used for the display label and colour. */
  statusMap?: StatusStyleMap;
  isDark: boolean;
  className?: string;
}

/**
 * Pill badge for a status value. Falls back to rendering the raw value when the
 * pick list has no matching option, so an unexpected value is still visible.
 */
export const StatusBadge = ({ value, statusMap, isDark, className }: StatusBadgeProps) => {
  const configured = statusMap?.get(norm(value));
  const label = configured?.label || value;
  const { bg, text, dot } = getStatusTokens(value, configured?.color, isDark);

  return (
    <div
      style={{ backgroundColor: bg, color: text }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-[4px] rounded-full text-[13px] font-medium leading-none transition-colors ${className ?? ""}`}
    >
      <span className="w-[5px] h-[5px] rounded-full flex-shrink-0" style={{ backgroundColor: dot }} />
      {label}
    </div>
  );
};

export default StatusBadge;
