/**
 * Auth — password hashing + signed session cookies, using only Node crypto so the
 * app needs no external auth service. Sessions are stateless: a signed token carries
 * the user id, firm slug, and expiry; we verify the HMAC on each request.
 *
 * Set SESSION_SECRET in production. A dev fallback is used when it's unset so the
 * app still boots locally (clearly not for real deployments).
 */

const crypto = require('crypto');

const COOKIE_NAME = 'vml_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

function secret() {
  return process.env.SESSION_SECRET || 'dev-insecure-secret-change-me';
}

// ---- Password hashing (scrypt) ----

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

function verifyPassword(password, stored) {
  if (typeof stored !== 'string' || !stored.startsWith('scrypt$')) return false;
  const [, saltHex, hashHex] = stored.split('$');
  const salt = Buffer.from(saltHex, 'hex');
  const expected = Buffer.from(hashHex, 'hex');
  const actual = crypto.scryptSync(password, salt, 64);
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

// ---- Session tokens (HMAC-signed) ----

function b64url(buf) {
  return Buffer.from(buf).toString('base64url');
}

function signSession(payload) {
  const body = { ...payload, exp: Date.now() + SESSION_TTL_MS };
  const data = b64url(JSON.stringify(body));
  const sig = crypto.createHmac('sha256', secret()).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verifySession(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [data, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', secret()).update(data).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  let payload;
  try {
    payload = JSON.parse(Buffer.from(data, 'base64url').toString());
  } catch {
    return null;
  }
  if (!payload.exp || payload.exp < Date.now()) return null;
  return payload;
}

// ---- Access decisions (pure, testable) ----

/**
 * Decide whether a session may access a firm-scoped resource.
 * @returns {{ok:true}|{error:string,status:number}}
 */
function firmAccessDecision(session, firmSlug) {
  if (!session) return { error: 'Not authenticated', status: 401 };
  if (session.adminSession) return { error: 'Forbidden', status: 403 }; // admin tokens are not firm tokens
  if (session.firmSlug !== firmSlug) return { error: 'Forbidden', status: 403 };
  return { ok: true };
}

/**
 * Decide whether a session may access an admin-only resource.
 * @returns {{ok:true}|{error:string,status:number}}
 */
function adminAccessDecision(session) {
  if (!session) return { error: 'Admin authentication required', status: 401 };
  if (!session.adminSession) return { error: 'Admin authentication required', status: 401 };
  return { ok: true };
}

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: SESSION_TTL_MS / 1000,
};

module.exports = {
  COOKIE_NAME,
  hashPassword,
  verifyPassword,
  signSession,
  verifySession,
  firmAccessDecision,
  adminAccessDecision,
  cookieOptions,
};
