/**
 * Centralized UPL-safe disclaimer copy, reused across the intake form, thank-you
 * screen, dashboard, and email alerts so the language stays consistent.
 *
 * These are operational safeguards, not legal advice. Firms remain responsible
 * for their own UPL compliance; this copy reduces the most common exposures.
 */

// Shown on the public intake form (before submission).
const INTAKE_FORM_DISCLAIMER =
  'Submitting this form does not create an attorney-client relationship. An attorney-client relationship is formed only if the firm agrees in writing to represent you. Do not share time-sensitive or confidential details until representation is confirmed.';

// Shown on the thank-you screen (after submission).
const THANK_YOU_DISCLAIMER =
  'Your inquiry has been received, but this does not mean the firm has agreed to represent you. No attorney-client relationship exists unless and until the firm confirms representation in writing. If your matter is urgent or has an upcoming deadline, contact the firm or another attorney directly.';

// Shown in the attorney dashboard (operational scoring context).
const DASHBOARD_DISCLAIMER =
  'Legal Qualification Scores are operational prioritization signals, not legal judgments. Every lead requires attorney review. Scores rank inquiry signal quality — they do not assess the legal merits of a matter.';

// Appended to email alerts.
const EMAIL_DISCLAIMER =
  'This is an automated operational alert. The Legal Qualification Score is a prioritization signal, not legal advice or a merits assessment. Attorney review is required before any action.';

module.exports = {
  INTAKE_FORM_DISCLAIMER,
  THANK_YOU_DISCLAIMER,
  DASHBOARD_DISCLAIMER,
  EMAIL_DISCLAIMER,
};
