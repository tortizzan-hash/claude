const { test } = require('node:test');
const assert = require('node:assert');
const { hashPassword, verifyPassword, signSession, verifySession } = require('./auth');

test('password hash verifies correct password and rejects wrong', () => {
  const stored = hashPassword('correct horse battery staple');
  assert.ok(stored.startsWith('scrypt$'));
  assert.strictEqual(verifyPassword('correct horse battery staple', stored), true);
  assert.strictEqual(verifyPassword('wrong password', stored), false);
});

test('session token round-trips payload', () => {
  const token = signSession({ userId: 'u1', firmSlug: 'demo', email: 'a@b.com' });
  const payload = verifySession(token);
  assert.strictEqual(payload.userId, 'u1');
  assert.strictEqual(payload.firmSlug, 'demo');
  assert.strictEqual(payload.email, 'a@b.com');
});

test('tampered token is rejected', () => {
  const token = signSession({ userId: 'u1', firmSlug: 'demo' });
  const [data] = token.split('.');
  const forged = `${data}.deadbeef`;
  assert.strictEqual(verifySession(forged), null);
});

test('garbage tokens are rejected, not thrown', () => {
  assert.strictEqual(verifySession(''), null);
  assert.strictEqual(verifySession('nope'), null);
  assert.strictEqual(verifySession(null), null);
});
