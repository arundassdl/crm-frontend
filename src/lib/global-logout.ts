/**
 * R59 (doc 63): global sign-out, server side only.
 *
 * Asks Central to sign the user out everywhere: it records a cutoff that makes every older
 * Authentik token, CRM session and launch ticket of this user stop working, and ends their
 * sessions at the identity provider. Called with the internal service secret; the user comes
 * from the verified CRM session cookie, never from the browser.
 */
import { centralRequestHeaders, getCentralBaseUrl } from '@/lib/central';
import { getCtrlUrl } from '@/lib/ctrl';
import { DEFAULT_ONE_URL } from '@/lib/one';

export type GlobalSignOutOutcome = 'signed_out' | 'refused' | 'unavailable';

export const SIGN_OUT_TIMEOUT_MS = 5000;

export async function signOutEverywhere(userId: string): Promise<GlobalSignOutOutcome> {
  const url = `${getCentralBaseUrl()}/api/method/evoq_saas_package_layer.api.internal_session.global_logout`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: centralRequestHeaders(),
      body: JSON.stringify({ user_id: userId, reason: 'crm_logout' }),
      cache: 'no-store',
      redirect: 'manual',
      // R60: answer the person promptly; a slow Central is reported, never waited out.
      signal: AbortSignal.timeout(SIGN_OUT_TIMEOUT_MS),
    });
    const data = await res.json().catch(() => null);
    const payload = data && typeof data.message === 'object' && data.message !== null ? data.message : data;
    return res.ok && payload?.status === 'success' ? 'signed_out' : 'refused';
  } catch {
    return 'unavailable';
  }
}

/**
 * The next stop after CRM has ended its own session: CTRL clears its session cookie and sends the
 * browser on to Evoq One, which clears its own and shows its homepage. Fixed URLs only.
 */
export function getCtrlLogoutContinueUrl(): string {
  const url = new URL('api/auth/logout', getCtrlUrl());
  url.searchParams.set('continue', 'one');
  return url.toString();
}

/** Evoq One's CRM product page: where every logout ends (R60). Fixed, https only. */
export function getOneCrmProductUrl(): string {
  return getOneUrl('/products/crm');
}

/** Endpoints that only clear that site's own sign-in cookies, called from the logout page (R60). */
export function getSignInClearUrls(): { ctrl: string; one: string } {
  const ctrl = new URL('api/auth/logout', getCtrlUrl());
  ctrl.searchParams.set('continue', 'none');
  const one = new URL(getOneUrl('/logout'));
  one.searchParams.set('mode', 'fetch');
  return { ctrl: ctrl.toString(), one: one.toString() };
}

function getOneUrl(path: string): string {
  const raw = process.env.NEXT_PUBLIC_EVOQ_ONE_URL || DEFAULT_ONE_URL;
  let origin = DEFAULT_ONE_URL;
  try {
    const u = new URL(raw);
    if (u.protocol === 'https:') origin = u.origin;
  } catch {
    /* keep default */
  }
  return new URL(path, origin).toString();
}
