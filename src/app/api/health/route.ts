export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  return NextResponse.json(
    { status: 'ok' },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Content-Type': 'application/json',
      },
    }
  );
}

export async function HEAD(_request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Content-Type': 'application/json',
    },
  });
}

export async function POST(_request: NextRequest) {
  return NextResponse.json(
    { error: 'Method Not Allowed' },
    {
      status: 405,
      headers: {
        'Allow': 'GET, HEAD',
        'Content-Type': 'application/json',
      },
    }
  );
}
