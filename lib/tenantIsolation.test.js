/**
 * Tenant isolation + auth boundary tests.
 *
 * These assert, using REAL signed session tokens verified through the actual HMAC
 * path, that:
 *   - Firm A cannot access Firm B's resources
 *   - Admin tokens cannot pass as firm tokens
 *   - Firm tokens cannot pass admin guards
 *   - Tampered / missing tokens are rejected
 */

const { test } = require('node:test');
const assert = require('node:assert');
const {
  signSession,
  verifySession,
  firmAccessDecision,
  adminAccessDecision,
} = require('./auth');

// Helper: simulate a guard by verifying a token then running the decision.
function firmGuard(token, firmSlug) {
  return firmAccessDecision(verifySession(token), firmSlug);
}
function adminGuard(token) {
  return adminAccessDecision(verifySession(token));
}

const firmAToken = signSession({ userId: 'a1', firmSlug: 'firm-a', email: 'a@a.com' });
const firmBToken = signSession({ userId: 'b1', firmSlug: 'firm-b', email: 'b@b.com' });
const adminToken = signSession({ role: 'admin', adminSession: true, email: 'admin@vml.com' });

test('firm A can access its own resources', () => {
  assert.deepStrictEqual(firmGuard(firmAToken, 'firm-a'), { ok: true });
});

test('firm A CANNOT access firm B resources (403)', () => {
  const d = firmGuard(firmAToken, 'firm-b');
  assert.strictEqual(d.status, 403);
});

test('firm B CANNOT access firm A resources (403)', () => {
  const d = firmGuard(firmBToken, 'firm-a');
  assert.strictEqual(d.status, 403);
});

test('no token is rejected from firm resources (401)', () => {
  const d = firmGuard('', 'firm-a');
  assert.strictEqual(d.status, 401);
});

test('tampered firm token is rejected (401)', () => {
  const [data] = firmAToken.split('.');
  const d = firmGuard(`${data}.forgedsignature`, 'firm-a');
  assert.strictEqual(d.status, 401);
});

test('admin token CANNOT pass as a firm token (403)', () => {
  // Even though the admin is "authenticated", they are not a firm user.
  const d = firmGuard(adminToken, 'firm-a');
  assert.strictEqual(d.status, 403);
});

test('admin token passes admin guard', () => {
  assert.deepStrictEqual(adminGuard(adminToken), { ok: true });
});

test('firm token CANNOT pass admin guard (401)', () => {
  const d = adminGuard(firmAToken);
  assert.strictEqual(d.status, 401);
});

test('no token is rejected from admin guard (401)', () => {
  assert.strictEqual(adminGuard('').status, 401);
});
