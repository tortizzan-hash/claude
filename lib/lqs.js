/**
 * LQS — Legal Qualification Score
 * Canonical scoring engine for Vector Mode Legal.
 *
 * Attorney-facing name: "Legal Qualification Score". Underlying method: a
 * signal-based score that ranks a legal inquiry across five dimensions —
 * urgency/signal, case fit, buyer intent, firm readiness, and conversion
 * resistance. ("Qualification" is the product language; "signal" is the method.)
 *
 * Source of truth: "Vector Mode Legal Scoring Architecture — CANON" (May 17, 2026).
 * The formula is multiplicative with resistance as a divisor — a weak link in any
 * positive component tanks the whole score, which is the intended behavior.
 *
 *   Signal × Fit × Intent × Readiness ÷ Resistance
 *
 * Components are 0-100. They are normalized to 0-1 (÷100), combined, then the
 * result is scaled back to 0-100. Do NOT replace this with a weighted average.
 * Band calibration is allowed; changing the core formula is not.
 */

/** Attorney-facing label + one-line description for UI reuse. */
const LQS_NAME = 'Legal Qualification Score';
const LQS_DESCRIPTION =
  'A signal-based score that helps your firm prioritize new inquiries by urgency, case fit, buyer intent, firm readiness, and conversion resistance.';

/**
 * Tooltip explaining the nonlinear nature of LQS — shown near the score pill.
 * A 55+ can represent a genuinely strong lead because the formula is multiplicative,
 * not an average, so high scores require strength across all five dimensions.
 */
const LQS_NONLINEAR_NOTE =
  'LQS is nonlinear. A score above 55 can represent a strong lead because the system weighs multiple factors together rather than averaging them.';

/** The five sub-scores, each 0-100. CRS is resistance (higher = worse). */
const SUBSCORES = ['iss', 'cfs', 'bis', 'frs', 'crs'];

/**
 * Compute the normalized 0-100 LQS from the five sub-scores.
 * @param {{iss:number,cfs:number,bis:number,frs:number,crs:number}} s
 * @returns {number} LQS on a 0-100 scale, rounded to 1 decimal.
 */
function computeLqs(s) {
  for (const key of SUBSCORES) {
    const v = s[key];
    if (typeof v !== 'number' || Number.isNaN(v) || v < 0 || v > 100) {
      throw new Error(`LQS: sub-score "${key}" must be a number 0-100, got ${v}`);
    }
  }
  const issn = s.iss / 100;
  const cfsn = s.cfs / 100;
  const bisn = s.bis / 100;
  const frsn = s.frs / 100;
  const crsn = s.crs / 100;

  const lqsNorm = (issn * cfsn * bisn * frsn) / (1 + crsn);
  return Math.round(lqsNorm * 100 * 10) / 10;
}

/**
 * Map an LQS value to its band + recommended action.
 * Bands are calibrated per the canon doc and may be tuned without touching the formula.
 * @param {number} lqs
 */
function bandFor(lqs) {
  if (lqs >= 55) {
    return { band: 'priority', label: 'Priority', action: 'Call or text immediately — this is a priority lead', color: 'green' };
  }
  if (lqs >= 40) {
    return { band: 'qualified', label: 'Qualified', action: 'Follow up quickly / ask clarifying questions', color: 'yellow' };
  }
  if (lqs >= 20) {
    return { band: 'review', label: 'Needs Review', action: 'Attorney or intake review', color: 'orange' };
  }
  return { band: 'low', label: 'Low Priority', action: 'Nurture, refer out, decline, or archive', color: 'red' };
}

/**
 * Override flags force a lead into review even when LQS is low, so the system
 * never mistakes high resistance for low truth.
 * @param {object} flags
 * @returns {string[]} active override reasons
 */
function activeOverrides(flags = {}) {
  const reasons = [];
  if (flags.urgentDeadline) reasons.push('Urgent deadline');
  if (flags.courtDateSoon) reasons.push('Court date soon');
  if (flags.highValueCaseType) reasons.push('High-value case type');
  if (flags.severeHarm) reasons.push('Severe harm');
  if (flags.strongMatterLowIntent) reasons.push('Strong matter, low buyer intent');
  return reasons;
}

/**
 * Full scoring result: LQS, band/action, and any override flags.
 * @param {object} subscores five 0-100 sub-scores
 * @param {object} [flags] override flags
 */
function scoreLead(subscores, flags = {}) {
  const lqs = computeLqs(subscores);
  const band = bandFor(lqs);
  const overrides = activeOverrides(flags);
  return {
    lqs,
    ...band,
    overrides,
    forceReview: overrides.length > 0 && band.band === 'low',
    subscores: { ...subscores },
  };
}

module.exports = { computeLqs, bandFor, activeOverrides, scoreLead, SUBSCORES, LQS_NAME, LQS_DESCRIPTION, LQS_NONLINEAR_NOTE };
