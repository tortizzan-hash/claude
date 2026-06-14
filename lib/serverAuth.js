/**
 * Server-only auth helpers for route handlers: read the current session from the
 * cookie, and guard firm-scoped resources so one firm can never read another's leads.
 */

import { cookies } from 'next/headers';

const { COOKIE_NAME, verifySession, signSession, cookieOptions, firmAccessDecision } = require('./auth');

/** Return the verified session payload, or null. */
export async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return verifySession(token);
}

/** Set the session cookie for a user. */
export async function setSessionCookie(user) {
  const store = await cookies();
  const token = signSession({ userId: user.id, firmSlug: user.firmSlug, email: user.email });
  store.set(COOKIE_NAME, token, cookieOptions);
}

/** Clear the session cookie. */
export async function clearSessionCookie() {
  const store = await cookies();
  store.set(COOKIE_NAME, '', { ...cookieOptions, maxAge: 0 });
}

/**
 * Require a session that owns `firmSlug`. Returns { session } on success, or
 * { error, status } describing why access is denied.
 */
export async function requireFirm(firmSlug) {
  const session = await getSession();
  const decision = firmAccessDecision(session, firmSlug);
  if (decision.error) return { error: decision.error, status: decision.status };
  return { session };
}
