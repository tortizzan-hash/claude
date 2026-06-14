/**
 * Proof engine — turns lead dispositions into the conversion evidence that buyers
 * demand ("does a high LQS actually convert?").
 *
 * This is the passive sales asset: as a firm works leads in the dashboard, the
 * system accumulates conversion-by-band data automatically. No manual reporting.
 */

const DISPOSITIONS = ['new', 'contacted', 'booked', 'signed', 'dead'];
const BANDS = ['priority', 'qualified', 'review', 'low'];

/** A disposition counts as "converted" once the firm books or signs the lead. */
function isConverted(lead) {
  return lead.disposition === 'booked' || lead.disposition === 'signed';
}

function isSigned(lead) {
  return lead.disposition === 'signed';
}

/**
 * Compute conversion stats overall and broken down by LQS band.
 * @param {object[]} leads
 * @returns {object} summary + perBand rates
 */
function computeStats(leads = []) {
  const summary = {
    total: leads.length,
    booked: leads.filter((l) => l.disposition === 'booked').length,
    signed: leads.filter(isSigned).length,
    converted: leads.filter(isConverted).length,
    highSignal: leads.filter((l) => l.band === 'priority').length,
  };
  summary.conversionRate = pct(summary.converted, summary.total);
  summary.signRate = pct(summary.signed, summary.total);

  const perBand = {};
  for (const band of BANDS) {
    const inBand = leads.filter((l) => l.band === band);
    perBand[band] = {
      count: inBand.length,
      converted: inBand.filter(isConverted).length,
      signed: inBand.filter(isSigned).length,
      conversionRate: pct(inBand.filter(isConverted).length, inBand.length),
    };
  }

  // The headline proof line: do priority-band leads convert better than low-band?
  const high = perBand.priority.conversionRate;
  const low = perBand.low.conversionRate;
  summary.lift =
    low > 0 ? Math.round((high / low) * 10) / 10 : high > 0 ? Infinity : null;

  return { summary, perBand };
}

/** Percentage 0-100, rounded to 1 decimal. 0/0 => 0. */
function pct(n, d) {
  if (!d) return 0;
  return Math.round((n / d) * 100 * 10) / 10;
}

module.exports = { computeStats, isConverted, isSigned, DISPOSITIONS, BANDS };
