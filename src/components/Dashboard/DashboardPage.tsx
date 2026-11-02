"use client";

/**
 * CRM dashboard cards (R57, doc 61): real figures for the signed-in organization,
 * read through the BFF (`/api/dashboard/metrics`). While loading, cards show a
 * placeholder; when a figure fails, the card says so. No sample numbers.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Box, Button, Grid, IconButton, Tooltip, Typography } from "@mui/material";
import WidgetCard from "@/components/Dashboard/Widgets/WidgetCard";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import HandshakeIcon from "@mui/icons-material/Handshake";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import PortraitIcon from "@mui/icons-material/Portrait";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useCrmSession } from "@/components/CrmSessionContext";
import {
  CountMetric,
  DashboardMetrics,
  MetricError,
  RevenueMetric,
  formatCount,
  formatMoney,
  metricErrorText,
} from "@/lib/dashboard-metrics";

/** Re-read when the tab regains focus, but not more often than this. */
const MIN_REFRESH_MS = 15_000;

type LoadState =
  | { phase: "loading" }
  | { phase: "ready"; data: DashboardMetrics }
  | { phase: "failed"; kind: string; message: string };

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

function revenueCaption(r: RevenueMetric): string {
  const parts = [plural(r.deal_count, "won deal", "won deals")];
  for (const o of r.other_currencies) {
    parts.push(`plus ${formatMoney(o.amount, o.currency)} (${plural(o.deal_count, "deal", "deals")})`);
  }
  if (r.deals_without_amount > 0) {
    parts.push(`${plural(r.deals_without_amount, "won deal has", "won deals have")} no amount`);
  }
  if (r.truncated) parts.push("first 10,000 won deals only");
  return parts.join(" · ");
}

export default function DashboardPage() {
  const session = useCrmSession();
  const [state, setState] = useState<LoadState>({ phase: "loading" });
  const [refreshing, setRefreshing] = useState(false);
  const lastLoad = useRef(0);
  const inFlight = useRef(false);

  const load = useCallback(
    async (background = false) => {
      if (inFlight.current) return;
      inFlight.current = true;
      lastLoad.current = Date.now();
      if (background) setRefreshing(true);
      try {
        const q = session?.organization ? `?org=${encodeURIComponent(session.organization)}` : "";
        const res = await fetch(`/api/dashboard/metrics${q}`, { cache: "no-store", credentials: "same-origin" });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          setState({
            phase: "failed",
            kind: body?.kind || "failed",
            message: body?.message || "The dashboard could not be loaded. Try again.",
          });
        } else {
          setState({ phase: "ready", data: body as DashboardMetrics });
        }
      } catch {
        setState({ phase: "failed", kind: "unavailable", message: "CRM could not be reached. Check your connection and try again." });
      } finally {
        inFlight.current = false;
        setRefreshing(false);
      }
    },
    [session?.organization],
  );

  useEffect(() => {
    load();
    // Pick up changes made in other tabs or modules when the user comes back.
    const onFocus = () => {
      if (document.visibilityState === "visible" && Date.now() - lastLoad.current > MIN_REFRESH_MS) load(true);
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [load]);

  if (state.phase === "failed") {
    return (
      <Grid item xs={12}>
        <Alert
          severity={state.kind === "auth" || state.kind === "permission" ? "warning" : "error"}
          data-testid="dashboard-error"
          action={
            state.kind === "auth" || state.kind === "permission" ? (
              <Button color="inherit" size="small" href="/api/auth/switch-org">
                Open CTRL
              </Button>
            ) : (
              <Button color="inherit" size="small" onClick={() => { setState({ phase: "loading" }); load(); }}>
                Retry
              </Button>
            )
          }
        >
          {state.message}
        </Alert>
      </Grid>
    );
  }

  const loading = state.phase === "loading";
  const m = state.phase === "ready" ? state.data.metrics : null;
  const revenue = m?.revenue;
  const moneyCurrency = revenue && revenue.status === "ok" ? revenue.currency : null;

  const countProps = (metric: CountMetric | MetricError | undefined) =>
    loading || !metric
      ? { loading: true }
      : metric.status === "ok"
        ? { value: formatCount(metric.value, moneyCurrency) }
        : { error: metricErrorText(metric.kind) };

  const revenueProps =
    loading || !revenue
      ? { loading: true }
      : revenue.status === "ok"
        ? { value: formatMoney(revenue.amount, revenue.currency), caption: revenueCaption(revenue) }
        : { error: metricErrorText(revenue.kind) };

  return (
    <Grid item xs={12} data-testid="crm-dashboard">
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h5" fontWeight={600}>
          Dashboard
        </Typography>
        <Tooltip title="Refresh">
          <span>
            <IconButton
              aria-label="Refresh dashboard"
              data-testid="dashboard-refresh"
              disabled={loading || refreshing}
              onClick={() => load(true)}
            >
              <RefreshIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <WidgetCard title="Contacts" icon={<PortraitIcon color="primary" />} testId="metric-contacts" {...countProps(m?.contacts)} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <WidgetCard title="Leads" icon={<PeopleAltIcon color="success" />} testId="metric-leads" {...countProps(m?.leads)} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <WidgetCard title="Deals" icon={<HandshakeIcon color="info" />} testId="metric-deals" {...countProps(m?.deals)} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <WidgetCard title="Booked Revenue" icon={<AttachMoneyIcon color="secondary" />} testId="metric-revenue" {...revenueProps} />
        </Grid>
      </Grid>
    </Grid>
  );
}
