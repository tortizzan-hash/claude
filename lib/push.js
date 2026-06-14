/**
 * Web Push sender — fires browser push notifications for high-signal leads.
 *
 * Uses the VAPID protocol (no third-party push service needed beyond the browser's
 * own push gateway). Generate keys once:
 *   npx web-push generate-vapid-keys
 * Then set VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT in .env.
 *
 * When VAPID keys are not set, push is a no-op (logged) so the app still runs.
 */

async function sendPushToFirm(firm, payload) {
  const subs = firm?.pushSubscriptions;
  if (!subs?.length) return { sent: 0, reason: 'no subscriptions' };

  const vapidPublic = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:hello@vectormodelegal.com';

  if (!vapidPublic || !vapidPrivate) {
    console.log('[push] VAPID keys not set — skipping push for', firm.slug);
    return { sent: 0, reason: 'no VAPID keys' };
  }

  // Lazy-load web-push only when keys are present (optional dependency)
  let webpush;
  try {
    webpush = require('web-push');
  } catch {
    console.warn('[push] web-push package not installed. Run: npm install web-push');
    return { sent: 0, reason: 'web-push not installed' };
  }

  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

  const body = JSON.stringify(payload);
  let sent = 0;
  const stale = [];

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(sub, body);
        sent++;
      } catch (err) {
        // 410 Gone = subscription expired, remove it
        if (err.statusCode === 410) stale.push(sub.endpoint);
        else console.error('[push] send failed:', err.message);
      }
    })
  );

  // Clean up expired subscriptions
  if (stale.length) {
    const { updateFirm } = require('./store');
    const fresh = subs.filter((s) => !stale.includes(s.endpoint));
    await updateFirm(firm.slug, { pushSubscriptions: fresh }).catch(() => {});
  }

  return { sent };
}

/**
 * Build the push notification payload for a high-signal lead.
 */
function highSignalPushPayload(lead) {
  const who = lead.contact?.name || 'New inquiry';
  return {
    title: `High-signal lead — LQS ${lead.lqs}`,
    body: `${who} · ${lead.label} · ${lead.action}`,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: `/dashboard/${lead.firmSlug}` },
    tag: `lead-${lead.id}`,        // replaces prior notification for same lead
    renotify: false,
  };
}

module.exports = { sendPushToFirm, highSignalPushPayload };
