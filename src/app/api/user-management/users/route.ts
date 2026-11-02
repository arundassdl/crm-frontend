export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { bffErrorResponse } from '@/lib/tenant-fetch';
import { umCall } from '@/lib/user-management';

/** R63: organization users (CRM managers only — enforced by the tenant). */
export async function GET(req: Request) {
  try {
    const q = new URL(req.url).searchParams;
    const status = q.get('status');
    const args = {
      search: (q.get('search') || '').slice(0, 100) || undefined,
      start: Math.max(0, Number(q.get('start') || 0) | 0),
      page_length: Math.min(100, Math.max(1, Number(q.get('page_length') || 20) | 0)),
      status: status === 'active' || status === 'suspended' ? status : undefined,
    };
    return NextResponse.json(await umCall(req, 'list_users', args), { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return bffErrorResponse(err, 'um-users');
  }
}
