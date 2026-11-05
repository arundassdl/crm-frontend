/**
 * CRM dashboard metrics (R57): types, the Booked Revenue summary and display formatting.
 *
 * Pure functions only (no server imports), so the route handler, the dashboard
 * component and the unit tests can all use them.
 *
 * Booked Revenue (Phase 1 definition, doc 61):
 *   sum of `deal_value` over deals whose status is a CRM Deal Status of type "Won".
 *   Open, ongoing, lost and on-hold deals are excluded. Amounts are not converted
 *   between currencies: each currency is summed separately and never invented.
 */

export type MetricErrorKind =
  | "auth"
  | "permission"
  | "not_found"
  | "validation"
  | "unavailable"
  | "failed";

export interface MetricError {
  status: "error";
  kind: MetricErrorKind;
}

export interface CountMetric {
  status: "ok";
  value: number;
}

export interface CurrencyTotal {
  currency: string | null;
  amount: number;
  deal_count: number;
}

export interface RevenueMetric extends CurrencyTotal {
  status: "ok";
  /** Totals in currencies other than `currency` (not converted, not added in). */
  other_currencies: CurrencyTotal[];
  /** Won deals with no amount recorded: counted, not valued. */
  deals_without_amount: number;
  /** True when more won deals exist than the BFF reads in one request. */
  truncated: boolean;
  /** How "won" was identified: by CRM Deal Status type, or by the status name "Won" on older CRM versions. */
  won_rule: "status_type" | "status_name";
}

export interface DashboardMetrics {
  organization: string;
  generated_at: string;
  metrics: {
    contacts: CountMetric | MetricError;
    leads: CountMetric | MetricError;
    deals: CountMetric | MetricError;
    revenue: RevenueMetric | MetricError;
  };
}

export interface WonDealRow {
  name?: unknown;
  deal_value?: unknown;
  currency?: unknown;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Sum won deals by currency. Rows are de-duplicated by `name`, so a deal is never counted twice.
 * The headline currency is the CRM's configured currency when set, otherwise the currency
 * with the most won deals.
 */
export function summariseRevenue(
  rows: WonDealRow[],
  configuredCurrency: string | null,
  opts: { truncated?: boolean; won_rule?: RevenueMetric["won_rule"] } = {},
): RevenueMetric {
  const configured =
    configuredCurrency && configuredCurrency.trim()
      ? configuredCurrency.trim()
      : null;
  const seen = new Set<string>();
  const groups = new Map<string, CurrencyTotal>();
  let withoutAmount = 0;

  for (const row of rows) {
    const name =
      typeof row?.name === "string" || typeof row?.name === "number"
        ? String(row.name)
        : "";
    if (!name || seen.has(name)) continue;
    seen.add(name);

    const value =
      typeof row.deal_value === "number"
        ? row.deal_value
        : Number(row.deal_value);
    if (
      row.deal_value === null ||
      row.deal_value === undefined ||
      row.deal_value === "" ||
      !Number.isFinite(value)
    ) {
      withoutAmount += 1;
      continue;
    }
    const currency =
      typeof row.currency === "string" && row.currency.trim()
        ? row.currency.trim()
        : configured;
    const key = currency ?? "";
    const g = groups.get(key) ?? { currency, amount: 0, deal_count: 0 };
    g.amount += value;
    g.deal_count += 1;
    groups.set(key, g);
  }

  const all = Array.from(groups.values()).map((g) => ({
    ...g,
    amount: round2(g.amount),
  }));
  let primary: CurrencyTotal | undefined;
  if (configured) primary = all.find((g) => g.currency === configured);
  if (!primary && !configured) {
    primary = [...all].sort(
      (a, b) => b.deal_count - a.deal_count || b.amount - a.amount,
    )[0];
  }
  if (!primary) primary = { currency: configured, amount: 0, deal_count: 0 };

  return {
    status: "ok",
    currency: primary.currency,
    amount: primary.amount,
    deal_count: primary.deal_count,
    other_currencies: all.filter(
      (g) => g !== primary && g.currency !== primary!.currency,
    ),
    deals_without_amount: withoutAmount,
    truncated: Boolean(opts.truncated),
    won_rule: opts.won_rule ?? "status_type",
  };
}

/** "1,75,000" for INR, "175,000" otherwise; counts use the same grouping. */
function localeFor(currency: string | null | undefined): string {
  return currency === "INR" ? "en-IN" : "en-US";
}

export function formatCount(n: number, currency: string | null = null): string {
  return new Intl.NumberFormat(localeFor(currency)).format(n);
}

/** Money in its own currency; a plain number when the currency is unknown. */
export function formatMoney(amount: number, currency: string | null): string {
  if (currency && /^[A-Z]{3}$/.test(currency)) {
    try {
      return new Intl.NumberFormat(localeFor(currency), {
        style: "currency",
        currency,
        maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
      }).format(amount);
    } catch {
      /* unknown ISO code: fall through */
    }
  }
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(
    amount,
  );
}

/** Customer-facing text for a metric that could not be loaded (no internal terms). */
export function metricErrorText(kind: MetricErrorKind): string {
  switch (kind) {
    case "auth":
      return "Your session has ended. Open CRM again from CTRL.";
    case "permission":
      return "You do not have access to this information.";
    case "unavailable":
      return "CRM is temporarily unavailable. Try again shortly.";
    default:
      return "This figure could not be loaded. Try again.";
  }
}
