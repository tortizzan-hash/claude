/**
 * Alerts — fire an instant notification when a high-signal lead lands.
 *
 * The data says responding within ~5 minutes is the single biggest conversion
 * lever, so a high-LQS lead should reach the attorney immediately, not on the next
 * dashboard refresh. This module is transport-agnostic: it posts a compact payload
 * to whatever webhook the firm configures (SMS gateway, Slack, email relay, etc.).
 *
 * Configure per firm via firm.alertWebhook, or globally via ALERT_WEBHOOK_URL.
 * If no webhook is set, alerting is a no-op (logged) so the app still runs.
 */

/** Only high-band leads, or anything force-flagged for review, trigger an alert. */
function shouldAlert(lead) {
  return lead.band === 'high' || lead.forceReview === true;
}

function buildAlertPayload(firm, lead) {
  const who = lead.contact?.name || 'New inquiry';
  const reasons = lead.overrides?.length ? ` [${lead.overrides.join(', ')}]` : '';
  return {
    type: 'high_signal_lead',
    firm: firm?.name || lead.firmSlug,
    leadId: lead.id,
    lqs: lead.lqs,
    band: lead.label,
    summary: `${who} · LQS ${lead.lqs} (${lead.label})${reasons}`,
    action: lead.action,
    contact: lead.contact || {},
    message: lead.message,
    dashboardUrl: `/dashboard/${lead.firmSlug}`,
  };
}

/**
 * Send an alert for a lead if it qualifies. Never throws — alerting must not block
 * or fail the intake response.
 * @returns {Promise<{sent:boolean, reason?:string}>}
 */
async function maybeAlert(firm, lead, opts = {}) {
  if (!shouldAlert(lead)) return { sent: false, reason: 'below threshold' };

  const url = opts.webhook || firm?.alertWebhook || process.env.ALERT_WEBHOOK_URL;
  const payload = buildAlertPayload(firm, lead);

  if (!url) {
    console.log('[alert] (no webhook configured)', payload.summary);
    return { sent: false, reason: 'no webhook configured' };
  }

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return { sent: true };
  } catch (err) {
    console.error('[alert] failed:', err.message);
    return { sent: false, reason: err.message };
  }
}

module.exports = { shouldAlert, buildAlertPayload, maybeAlert };
