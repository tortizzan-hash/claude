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
  assert.strictEqual(bandFor(85).band, 'priority');
  assert.strictEqual(bandFor(55).band, 'priority');
  assert.strictEqual(bandFor(50).band, 'qualified');
  assert.strictEqual(bandFor(40).band, 'qualified');
  assert.strictEqual(bandFor(30).band, 'review');
  assert.strictEqual(bandFor(20).band, 'review');
  assert.strictEqual(bandFor(10).band, 'low');
  assert.strictEqual(bandFor(19).band, 'low');
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

// Realistic component scores with their expected bands. Components are 0-100,
// normalized to 0-1 internally, combined multiplicatively, scaled back to 0-100.
// Band calibration (Lumen, June 2026): Priority ≥55, Qualified ≥40, Review ≥20, Low <20.
test('realistic: near-perfect inquiry reaches priority band (~73.5)', () => {
  const lqs = computeLqs({ iss: 95, cfs: 95, bis: 95, frs: 90, crs: 5 });
  assert.ok(lqs >= 55, `expected priority band, got ${lqs}`);
  assert.strictEqual(bandFor(lqs).band, 'priority');
});

test('realistic: strong auto-accident inquiry lands priority (~60.8)', () => {
  // Clear facts, right practice area, ready to hire, low friction — priority
  // under the recalibrated bands (≥55). Formula unchanged.
  const lqs = computeLqs({ iss: 92, cfs: 95, bis: 90, frs: 85, crs: 10 });
  assert.ok(lqs >= 55, `expected priority band, got ${lqs}`);
  assert.strictEqual(bandFor(lqs).band, 'priority');
});

test('realistic: decent inquiry with moderate friction lands review (~30.2)', () => {
  const lqs = computeLqs({ iss: 80, cfs: 85, bis: 75, frs: 80, crs: 35 });
  assert.ok(lqs >= 20 && lqs < 40, `expected review band, got ${lqs}`);
  assert.strictEqual(bandFor(lqs).band, 'review');
});

test('realistic: vague inquiry with high resistance lands low', () => {
  const lqs = computeLqs({ iss: 35, cfs: 40, bis: 30, frs: 60, crs: 70 });
  assert.ok(lqs < 20, `expected low band, got ${lqs}`);
  assert.strictEqual(bandFor(lqs).band, 'low');
});

test('realistic: good signal but wrong jurisdiction (low CFS) gets penalized', () => {
  // Everything strong except case fit — multiplicative model drags it down
  const lqs = computeLqs({ iss: 90, cfs: 25, bis: 85, frs: 80, crs: 20 });
  assert.ok(lqs < 40, `weak case fit should prevent qualified+, got ${lqs}`);
});
