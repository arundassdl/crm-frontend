/**
 * Task status / priority design tokens.
 *
 * Values come straight from the reference Tasks page
 * (crm-app-UI-Arun-Latest/app/tasks/page.tsx → STATUS_CFG / STATUS_CFG_DARK /
 * PRIORITY_CFG). The backend uses a slightly different status vocabulary
 * (Todo / Done / Canceled) than the reference (To-Do / Completed), so both
 * spellings are mapped to the same colors to keep the UI consistent.
 */

export interface StatusToken {
  bg: string;
  text: string;
  dot: string;
}

export const TASK_STATUS_CFG: Record<string, StatusToken> = {
  "To-Do": { bg: "#EFF6FF", text: "#0C2472", dot: "#3B82F6" },
  Todo: { bg: "#EFF6FF", text: "#0C2472", dot: "#3B82F6" },
  "In Progress": { bg: "#FEF3C7", text: "#92400E", dot: "#F59E0B" },
  Backlog: { bg: "#F1F5F9", text: "#475569", dot: "#94A3B8" },
  Completed: { bg: "#DCFCE7", text: "#166534", dot: "#10B981" },
  Done: { bg: "#DCFCE7", text: "#166534", dot: "#10B981" },
  Canceled: { bg: "#FEF2F2", text: "#991B1B", dot: "#EF4444" },
};

export const TASK_STATUS_CFG_DARK: Record<string, StatusToken> = {
  "To-Do": { bg: "rgba(113,113,122,0.15)", text: "#A1A1AA", dot: "#71717A" },
  Todo: { bg: "rgba(113,113,122,0.15)", text: "#A1A1AA", dot: "#71717A" },
  "In Progress": { bg: "rgba(245,158,11,0.15)", text: "#FCD34D", dot: "#F59E0B" },
  Backlog: { bg: "rgba(148,163,184,0.15)", text: "#94A3B8", dot: "#64748B" },
  Completed: { bg: "rgba(16,185,129,0.15)", text: "#34D399", dot: "#10B981" },
  Done: { bg: "rgba(16,185,129,0.15)", text: "#34D399", dot: "#10B981" },
  Canceled: { bg: "rgba(244,63,94,0.15)", text: "#F87171", dot: "#EF4444" },
};

const STATUS_FALLBACK: StatusToken = { bg: "#F1F5F9", text: "#475569", dot: "#94A3B8" };
const STATUS_FALLBACK_DARK: StatusToken = { bg: "rgba(148,163,184,0.15)", text: "#94A3B8", dot: "#64748B" };

export const getTaskStatusToken = (status?: string, isDark = false): StatusToken => {
  const key = String(status ?? "").trim();
  const table = isDark ? TASK_STATUS_CFG_DARK : TASK_STATUS_CFG;
  return table[key] ?? (isDark ? STATUS_FALLBACK_DARK : STATUS_FALLBACK);
};

export interface PriorityToken {
  bg: string;
  text: string;
}

export const TASK_PRIORITY_CFG: Record<string, PriorityToken> = {
  High: { bg: "#FEF2F2", text: "#DC2626" },
  Medium: { bg: "#FEF3C7", text: "#D97706" },
  Low: { bg: "#F0FDF4", text: "#16A34A" },
};

export const TASK_PRIORITY_CFG_DARK: Record<string, PriorityToken> = {
  High: { bg: "rgba(220,38,38,0.15)", text: "#F87171" },
  Medium: { bg: "rgba(245,158,11,0.15)", text: "#FCD34D" },
  Low: { bg: "rgba(22,163,74,0.15)", text: "#34D399" },
};

export const getTaskPriorityToken = (priority?: string, isDark = false): PriorityToken | null => {
  const key = String(priority ?? "").trim();
  if (!key) return null;
  const table = isDark ? TASK_PRIORITY_CFG_DARK : TASK_PRIORITY_CFG;
  return table[key] ?? null;
};

/**
 * Card palette for the Grid / Kanban views, mirroring the reference Deals views
 * (crm-app-UI-Arun-Latest/components/deals/DealGridView.tsx → STAGE_CFG and
 * DealKanbanView.tsx → STAGES). Each task status maps onto one of the same
 * pastel families so Tasks reads as part of the same design system.
 */
export interface StageToken {
  fill: string;
  deep: string;
  darkFill: string;
  darkDeep: string;
  headerBg: string;
}

const BLUE: StageToken = { fill: "#D6E4F9", deep: "#2F6FED", darkFill: "#1E2235", darkDeep: "#4F8EF7", headerBg: "#3B82F6" };
const SLATE: StageToken = { fill: "#D2DFF0", deep: "#5B6CB5", darkFill: "#1B1E2D", darkDeep: "#818CF8", headerBg: "#0C2472" };
const AMBER: StageToken = { fill: "#FAE3D0", deep: "#E0883F", darkFill: "#2A1F18", darkDeep: "#F59E0B", headerBg: "#B45309" };
const GREEN: StageToken = { fill: "#D0E5E0", deep: "#2E9E7B", darkFill: "#1A2820", darkDeep: "#34D399", headerBg: "#059669" };
const PINK: StageToken = { fill: "#F5D9E1", deep: "#DB5E8C", darkFill: "#28181F", darkDeep: "#F472B6", headerBg: "#9D174D" };

export const TASK_STAGE_CFG: Record<string, StageToken> = {
  Backlog: SLATE,
  Todo: BLUE,
  "To-Do": BLUE,
  "In Progress": AMBER,
  Done: GREEN,
  Completed: GREEN,
  Canceled: PINK,
  Cancelled: PINK,
};

export const getTaskStageToken = (status?: string): StageToken =>
  TASK_STAGE_CFG[String(status ?? "").trim()] ?? SLATE;

/** Completion progress (%) for the card progress bar — the task analogue of a deal's probability. */
const PROGRESS: Record<string, number> = {
  Backlog: 10,
  Todo: 30,
  "To-Do": 30,
  "In Progress": 65,
  Done: 100,
  Completed: 100,
  Canceled: 100,
  Cancelled: 100,
};

export const getTaskProgress = (status?: string): number =>
  PROGRESS[String(status ?? "").trim()] ?? 0;

/** Short due-date label, e.g. "12 May 2026". */
export const formatTaskDate = (value?: string) => {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

/** A task is overdue when its due date is in the past and it isn't finished. */
export const isTaskOverdue = (dueDate?: string, status?: string) => {
  if (!dueDate) return false;
  const d = new Date(dueDate);
  if (isNaN(d.getTime())) return false;
  const done = ["done", "completed", "canceled", "cancelled"].includes(String(status ?? "").toLowerCase());
  if (done) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
};
