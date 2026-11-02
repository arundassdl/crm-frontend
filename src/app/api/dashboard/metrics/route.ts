export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { BffError, bffErrorResponse, frappeCall, sessionFromRequest } from '@/lib/tenant-fetch';
import {
  CountMetric,
  DashboardMetrics,
  MetricError,
  RevenueMetric,
  WonDealRow,
  summariseRevenue,
} from '@/lib/dashboard-metrics';

/**
 * Dashboard figures for the signed-in organization (R57, doc 61).
 *
 * The tenant comes from the signed session cookie only; an `org` query value is
 * checked against it, never used to pick a backend. Every figure is read as the
 * signed-in user through the delegated session, so Frappe applies their permissions.
 * A figure that fails is returned as an error, never as a substitute number.
 */

const PAGE = 500;
const MAX_WON_DEALS = 10_000;

async function count(req: Request, doctype: string): Promise<CountMetric> {
  const res = await frappeCall(req, 'frappe.desk.reportview.get_count', { doctype, filters: [] });
  const n = Number(res?.message);
  if (!Number.isFinite(n)) throw new BffError(502, 'BAD_COUNT', 'unavailable', 'Unexpected count response.');
  return { status: 'ok', value: n };
}

function isUnknownField(err: unknown): boolean {
  return (
    err instanceof BffError &&
    err.kind === 'validation' &&
    /(Field not permitted in query|Unknown column|does not exist)/i.test(err.message)
  );
}

/** Names of the deal statuses that mean "won". */
async function wonStatuses(req: Request): Promise<{ names: string[]; rule: RevenueMetric['won_rule'] }> {
  try {
    const res = await frappeCall(req, 'frappe.client.get_list', {
      doctype: 'CRM Deal Status',
      fields: ['name'],
      filters: [['CRM Deal Status', 'type', '=', 'Won']],
      limit_page_length: 100,
    });
    const names = (Array.isArray(res?.message) ? res.message : [])
      .map((r: any) => r?.name)
      .filter((n: unknown): n is string => typeof n === 'string' && n.length > 0);
    return { names, rule: 'status_type' };
  } catch (err) {
    // Older Frappe CRM versions have no status `type`; there the status is literally "Won".
    if (isUnknownField(err)) return { names: ['Won'], rule: 'status_name' };
    throw err;
  }
}

async function configuredCurrency(req: Request): Promise<string | null> {
  try {
    const res = await frappeCall(req, 'frappe.client.get_single_value', { doctype: 'FCRM Settings', field: 'currency' });
    return typeof res?.message === 'string' && res.message.trim() ? res.message.trim() : null;
  } catch {
    return null; // Optional setting: each deal still carries its own currency.
  }
}

async function bookedRevenue(req: Request): Promise<RevenueMetric> {
  const [{ names, rule }, currency] = await Promise.all([wonStatuses(req), configuredCurrency(req)]);
  if (names.length === 0) return summariseRevenue([], currency, { won_rule: rule });

  const rows: WonDealRow[] = [];
  let truncated = false;
  for (let start = 0; ; start += PAGE) {
    const res = await frappeCall(req, 'frappe.client.get_list', {
      doctype: 'CRM Deal',
      fields: ['name', 'deal_value', 'currency'],
      filters: [['CRM Deal', 'status', 'in', names]],
      order_by: 'name asc',
      limit_start: start,
      limit_page_length: PAGE,
    });
    const page = Array.isArray(res?.message) ? res.message : [];
    rows.push(...page);
    if (page.length < PAGE) break;
    if (rows.length >= MAX_WON_DEALS) {
      truncated = true;
      break;
    }
  }
  return summariseRevenue(rows, currency, { truncated, won_rule: rule });
}

function asMetricError(err: unknown, tag: string): MetricError {
  if (err instanceof BffError) return { status: 'error', kind: err.kind };
  console.error(`[dashboard-metrics] ${tag}:`, (err as any)?.message || err);
  return { status: 'error', kind: 'failed' };
}

export async function GET(req: Request) {
  const session = sessionFromRequest(req);
  if (!session) {
    return bffErrorResponse(new BffError(401, 'UNAUTHORIZED', 'auth', 'Your session has expired. Open CRM again from CTRL.'));
  }
  const requested = new URL(req.url).searchParams.get('org');
  if (requested && requested.trim() !== session.organization) {
    return bffErrorResponse(
      new BffError(403, 'ORGANIZATION_FORBIDDEN', 'permission', 'You do not have access to this organization.'),
    );
  }

  const tasks = {
    contacts: count(req, 'Contact'),
    leads: count(req, 'CRM Lead'),
    deals: count(req, 'CRM Deal'),
    revenue: bookedRevenue(req),
  };
  const keys = Object.keys(tasks) as Array<keyof typeof tasks>;
  const settled = await Promise.allSettled(keys.map((k) => tasks[k]));

  // Session or organization access failed for everything: report that, not four broken cards.
  const failures = settled.filter((s): s is PromiseRejectedResult => s.status === 'rejected');
  if (failures.length === keys.length) {
    const first = failures[0].reason;
    if (first instanceof BffError && (first.kind === 'auth' || first.code === 'ORGANIZATION_FORBIDDEN' || first.status === 402)) {
      return bffErrorResponse(first);
    }
  }

  const metrics: any = {};
  keys.forEach((k, i) => {
    const s = settled[i];
    metrics[k] = s.status === 'fulfilled' ? s.value : asMetricError(s.reason, k);
  });

  const body: DashboardMetrics = {
    organization: session.organization,
    generated_at: new Date().toISOString(),
    metrics,
  };
  return NextResponse.json(body, { headers: { 'Cache-Control': 'no-store' } });
}
