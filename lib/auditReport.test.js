const { test } = require('node:test');
const assert = require('node:assert');
const { generateReport } = require('./auditReport');

const firm = { slug: 'test', name: 'Test Firm', practiceAreas: ['Auto Accident'], jurisdiction: 'CA' };

const leads = [
  { lqs: 72, band: 'priority', label: 'Priority', disposition: 'signed', contact: { phone: '555-1111' }, overrides: [], forceReview: false, createdAt: new Date(Date.now() - 10000).toISOString(), message: 'rear-ended last week' },
  { lqs: 68, band: 'priority', label: 'Priority', disposition: 'dead', contact: { phone: '555-2222' }, overrides: [], forceReview: false, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), message: 'slipped and fell' },
  { lqs: 50, band: 'qualified', label: 'Qualified', disposition: 'booked', contact: { email: 'a@b.com' }, overrides: [], forceReview: false, createdAt: new Date().toISOString(), message: 'dog bite' },
  { lqs: 10, band: 'low', label: 'Low Priority', disposition: 'new', contact: {}, overrides: [], forceReview: false, createdAt: new Date().toISOString(), message: 'just wondering' },
];

test('generates report without throwing', () => {
  const report = generateReport(firm, leads);
  assert.strictEqual(report.firm.name, 'Test Firm');
  assert.strictEqual(report.summary.totalLeads, 4);
});

test('band distribution counts are correct', () => {
  const { bandDistribution: bd } = generateReport(firm, leads);
  assert.strictEqual(bd.priority.count, 2);
  assert.strictEqual(bd.qualified.count, 1);
  assert.strictEqual(bd.low.count, 1);
});

test('conversion rates compute per band', () => {
  const { conversionByBand: cv } = generateReport(firm, leads);
  assert.strictEqual(cv.priority.total, 2);
  assert.strictEqual(cv.priority.converted, 1); // only signed counts
  assert.strictEqual(cv.priority.rate, 50);
  assert.strictEqual(cv.qualified.converted, 1);
});

test('missed opportunities catches dead priority + stale', () => {
  const { missedOpportunities: mo } = generateReport(firm, leads);
  // lead[1]: priority-band, dead = missed. lead[3]: low-band, excluded.
  assert.ok(mo.some((m) => m.lqs === 68));
  assert.ok(!mo.some((m) => m.lqs === 10));
});

test('recommendations are non-empty and have priority fields', () => {
  const { recommendations: recs } = generateReport(firm, leads);
  assert.ok(recs.length > 0);
  assert.ok(recs.every((r) => r.priority && r.title && r.detail));
});

test('handles empty leads without throwing', () => {
  const report = generateReport(firm, []);
  assert.strictEqual(report.summary.totalLeads, 0);
  assert.strictEqual(report.intakeHealth.score, 0);
});
