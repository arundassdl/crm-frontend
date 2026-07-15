/**
 * Deal stage design tokens.
 *
 * Values come straight from the reference Deals views
 * (crm-app-UI-Arun-Latest/components/deals/DealGridView.tsx → STAGE_CFG and
 * DealKanbanView.tsx → STAGES). Deal stages are backend-driven, so any stage not
 * in the table falls back to a deterministic colour from the same palette rather
 * than rendering colourless.
 */
export interface StageToken {
  fill: string;
  deep: string;
  darkFill: string;
  darkDeep: string;
  headerBg: string;
}

const BLUE: StageToken = { fill: "#D6E4F9", deep: "#2F6FED", darkFill: "#1E2235", darkDeep: "#4F8EF7", headerBg: "#0C2472" };
const GREEN: StageToken = { fill: "#D0E5E0", deep: "#2E9E7B", darkFill: "#1A2820", darkDeep: "#34D399", headerBg: "#2E9E7B" };
const AMBER: StageToken = { fill: "#FAE3D0", deep: "#E0883F", darkFill: "#2A1F18", darkDeep: "#F59E0B", headerBg: "#B45309" };
const PINK: StageToken = { fill: "#F5D9E1", deep: "#DB5E8C", darkFill: "#28181F", darkDeep: "#F472B6", headerBg: "#9D174D" };
const INDIGO: StageToken = { fill: "#D2DFF0", deep: "#5B6CB5", darkFill: "#1B1E2D", darkDeep: "#818CF8", headerBg: "#0C2472" };

/** Fallback families, cycled deterministically for backend stages not listed below. */
const PALETTE: StageToken[] = [BLUE, GREEN, AMBER, PINK, INDIGO];

export const DEAL_STAGE_CFG: Record<string, StageToken> = {
  Qualification: BLUE,
  "Needs Analysis": GREEN,
  "Value Proposition": { ...AMBER, headerBg: "#3B82F6" },
  "Identify Decision Makers": PINK,
  "Proposal/Price Quote": INDIGO,
  "Proposal/Quotation": INDIGO,
  "Negotiation/Review": AMBER,
  Negotiation: AMBER,
  "Demo/Making": AMBER,
  "Ready to Close": INDIGO,
  "Closed Won": { ...GREEN, headerBg: "#059669" },
  Won: { ...GREEN, headerBg: "#059669" },
  "Closed Lost": PINK,
  Lost: PINK,
};

export const getDealStageToken = (stage?: string): StageToken => {
  const key = String(stage ?? "").trim();
  if (!key) return BLUE;
  const known = DEAL_STAGE_CFG[key];
  if (known) return known;
  const sum = key.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return PALETTE[sum % PALETTE.length];
};

/**
 * Read a field off a datagrid row.
 *
 * The listing endpoint qualifies column names when the query JOINs tables, so a
 * value can arrive as `annual_revenue`, `CRM Deal.annual_revenue` or
 * `tabCRM Deal.annual_revenue`. Check every shape before giving up.
 */
const readField = (row: any, key: string): any => {
  if (!row) return undefined;
  const v = row[key] ?? row[`CRM Deal.${key}`] ?? row[`tabCRM Deal.${key}`];
  return v === "" ? undefined : v;
};

/** First numeric value found across the candidate field names (values may be strings). */
const readNumber = (row: any, keys: string[]): number => {
  for (const k of keys) {
    const v = readField(row, k);
    if (v === undefined || v === null) continue;
    const n = Number(v);
    if (!Number.isNaN(n)) return n;
  }
  return 0;
};

/**
 * Deal amount.
 *
 * The amount field is layout-driven and its name varies per backend, so callers
 * should pass the field resolved from the layout (the `type: "currency"` field).
 * That is tried first; the known aliases are only a fallback.
 */
export const resolveAmount = (row: any, amountField?: string): number => {
  const candidates = [
    ...(amountField ? [amountField] : []),
    "annual_revenue",
    "amount",
    "deal_value",
    "expected_deal_value",
    "opportunity_amount",
    "value",
  ];
  return readNumber(row, candidates);
};

/** Deal probability (%) — 0 when absent. */
export const resolveProbability = (row: any): number => readNumber(row, ["probability"]);

/** Full amount, e.g. "₹29,999". */
export const fmtAmount = (v: any) => {
  const n = Number(v);
  if (!n || Number.isNaN(n)) return "₹0";
  return `₹${n.toLocaleString("en-IN")}`;
};

/** Compact amount for kanban cards, e.g. "₹30k". */
export const fmtCompact = (v: any) => {
  const n = Number(v);
  if (!n || Number.isNaN(n)) return "₹0";
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}k`;
  return `₹${n}`;
};

/** Compact column total, e.g. "₹32.4L". */
export const fmtTotal = (v: number) => fmtCompact(v);

/** Short date label, e.g. "15 Jul 2026". */
export const fmtDate = (value?: string) => {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};
