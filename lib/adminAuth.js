/**
 * Admin auth — separate from firm auth. Only VML (you) can log in here.
 *
 * Credentials: ADMIN_EMAIL + ADMIN_PASSWORD_HASH env vars.
 * Generate a hash with: node -e "const {hashPassword}=require('./lib/auth');console.log(hashPassword('yourpassword'))"
 *
 * Session cookie is the same HMAC mechanism as firm auth but carries role:'admin'.
 */

import { cookies } from 'next/headers';

const { verifySession, signSession, cookieOptions, verifyPassword, adminAccessDecision } = require('./auth'); // eslint-disable-line

const ADMIN_COOKIE = 'vml_admin_session';

export async function verifyAdminLogin(email, password) {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminHash = process.env.ADMIN_PASSWORD_HASH;
  if (!adminEmail || !adminHash) return false;
  if (email.toLowerCase() !== adminEmail.toLowerCase()) return false;
  return verifyPassword(password, adminHash);
}

export async function setAdminSession(email) {
  const store = await cookies();
  const token = signSession({ role: 'admin', email, adminSession: true });
  store.set(ADMIN_COOKIE, token, cookieOptions);
}

export async function clearAdminSession() {
  const store = await cookies();
  store.set(ADMIN_COOKIE, '', { ...cookieOptions, maxAge: 0 });
}

export async function getAdminSession() {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  const payload = verifySession(token);
  if (!payload?.adminSession) return null;
  return payload;
}

export async function requireAdmin() {
  const session = await getAdminSession();
  const decision = adminAccessDecision(session);
  if (decision.error) return { error: decision.error, status: decision.status };
  return { session };
}
