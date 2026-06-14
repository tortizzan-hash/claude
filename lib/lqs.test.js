const { test } = require('node:test');
const assert = require('node:assert');
const { computeLqs, bandFor, scoreLead } = require('./lqs');

test('canonical example from CANON doc: 85/90/80/75/25 => 36.7', () => {
  const lqs = computeLqs({ iss: 85, cfs: 90, bis: 80, frs: 75, crs: 25 });
  assert.strictEqual(lqs, 36.7);
  assert.strictEqual(bandFor(lqs).band, 'review');
});

test('perfect signal, zero resistance => 100', () => {
  assert.strictEqual(computeLqs({ iss: 100, cfs: 100, bis: 100, frs: 100, crs: 0 }), 100);
});

test('any zero positive component tanks the score (weak link)', () => {
  assert.strictEqual(computeLqs({ iss: 0, cfs: 100, bis: 100, frs: 100, crs: 0 }), 0);
});

test('resistance divides the score down', () => {
  const noResistance = computeLqs({ iss: 80, cfs: 80, bis: 80, frs: 80, crs: 0 });
  const highResistance = computeLqs({ iss: 80, cfs: 80, bis: 80, frs: 80, crs: 100 });
  assert.ok(highResistance < noResistance);
  assert.strictEqual(highResistance, Math.round((noResistance / 2) * 10) / 10);
});

test('bands map correctly', () => {
  assert.strictEqual(bandFor(85).band, 'high');
  assert.strictEqual(bandFor(50).band, 'qualified');
  assert.strictEqual(bandFor(30).band, 'review');
  assert.strictEqual(bandFor(10).band, 'low');
});

test('override flags force review on a low-LQS lead', () => {
  const result = scoreLead(
    { iss: 20, cfs: 20, bis: 20, frs: 20, crs: 80 },
    { urgentDeadline: true }
  );
  assert.strictEqual(result.band, 'low');
  assert.strictEqual(result.forceReview, true);
  assert.deepStrictEqual(result.overrides, ['Urgent deadline']);
});

test('rejects out-of-range sub-scores', () => {
  assert.throws(() => computeLqs({ iss: 120, cfs: 50, bis: 50, frs: 50, crs: 0 }));
  assert.throws(() => computeLqs({ iss: 'x', cfs: 50, bis: 50, frs: 50, crs: 0 }));
});
