const { test } = require('node:test');
const assert = require('node:assert');
const { computeStats, isConverted } = require('./proof');

const leads = [
  { band: 'high', disposition: 'signed' },
  { band: 'high', disposition: 'booked' },
  { band: 'high', disposition: 'contacted' },
  { band: 'high', disposition: 'dead' },
  { band: 'low', disposition: 'dead' },
  { band: 'low', disposition: 'dead' },
  { band: 'low', disposition: 'signed' },
  { band: 'qualified', disposition: 'new' },
];

test('isConverted covers booked and signed only', () => {
  assert.strictEqual(isConverted({ disposition: 'signed' }), true);
  assert.strictEqual(isConverted({ disposition: 'booked' }), true);
  assert.strictEqual(isConverted({ disposition: 'contacted' }), false);
  assert.strictEqual(isConverted({ disposition: 'new' }), false);
});

test('summary counts are correct', () => {
  const { summary } = computeStats(leads);
  assert.strictEqual(summary.total, 8);
  assert.strictEqual(summary.signed, 2);
  assert.strictEqual(summary.booked, 1);
  assert.strictEqual(summary.converted, 3);
  assert.strictEqual(summary.highSignal, 4);
});

test('per-band conversion rates and lift', () => {
  const { perBand, summary } = computeStats(leads);
  assert.strictEqual(perBand.high.count, 4);
  assert.strictEqual(perBand.high.converted, 2);
  assert.strictEqual(perBand.high.conversionRate, 50); // 2 of 4
  assert.strictEqual(perBand.low.conversionRate, 33.3); // 1 of 3
  // high (50%) vs low (33.3%) => ~1.5x lift
  assert.strictEqual(summary.lift, 1.5);
});

test('empty input does not divide by zero', () => {
  const { summary } = computeStats([]);
  assert.strictEqual(summary.total, 0);
  assert.strictEqual(summary.conversionRate, 0);
  assert.strictEqual(summary.lift, null);
});
