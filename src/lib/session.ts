import crypto from 'crypto';

export const SESSION_COOKIE_NAME = 'evoq_crm_session';
export const SESSION_TTL_SECONDS = 86400; // 24 hours

export interface CrmSession {
  userId: string;
  evoqUserKey: string;
  organization: string;
  application: string;
  createdAt: number;
  expiresAt: number;
}

const DEFAULT_SECRET = 'evoq-crm-dev-session-signing-secret-key-32b';
const SECRET = process.env.SESSION_SECRET || DEFAULT_SECRET;

function sign(payload: string): string {
  return crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
}

export function serializeSession(session: CrmSession): string {
  const json = JSON.stringify(session);
  const base64 = Buffer.from(json).toString('base64url');
  const signature = sign(base64);
  return `${base64}.${signature}`;
}

export function parseSession(rawCookie: string | undefined): CrmSession | null {
  if (!rawCookie || typeof rawCookie !== 'string') return null;

  const parts = rawCookie.split('.');
  if (parts.length !== 2) return null;

  const [base64, signature] = parts;
  const expectedSig = sign(base64);

  const sigBuffer = Buffer.from(signature);
  const expBuffer = Buffer.from(expectedSig);
  if (sigBuffer.length !== expBuffer.length || !crypto.timingSafeEqual(sigBuffer, expBuffer)) {
    return null;
  }

  try {
    const json = Buffer.from(base64, 'base64url').toString('utf8');
    const session = JSON.parse(json) as CrmSession;

    if (!session.expiresAt || session.expiresAt < Date.now()) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export function getSessionCookieOptions(isProduction: boolean = process.env.NODE_ENV === 'production') {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  };
}
