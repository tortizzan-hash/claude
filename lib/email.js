/**
 * Email notifications via Resend (resend.com).
 *
 * Set RESEND_API_KEY + EMAIL_FROM in .env to enable. When unset, emails are
 * logged to console only so the app still runs without any mail infra.
 *
 * Two notification types:
 *   1. High-signal lead alert — sent to the firm's attorney the moment a
 *      high-LQS lead lands (the ~5-minute response window).
 *   2. Daily digest — summary of new leads for the past 24 hours.
 */

const FROM = process.env.EMAIL_FROM || 'Vector Mode Legal <noreply@vectormodelegal.com>';

async function send({ to, subject, html, text }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`[email] (no RESEND_API_KEY) to=${to} subject="${subject}"`);
    return { sent: false, reason: 'no API key' };
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ from: FROM, to: Array.isArray(to) ? to : [to], subject, html, text }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || res.statusText);
    return { sent: true, id: data.id };
  } catch (err) {
    console.error('[email] send failed:', err.message);
    return { sent: false, reason: err.message };
  }
}

// ---- Templates ----

function highSignalHtml(firm, lead) {
  const who = lead.contact?.name || 'New inquiry';
  const phone = lead.contact?.phone ? `<br>📞 ${lead.contact.phone}` : '';
  const email = lead.contact?.email ? `<br>✉️ ${lead.contact.email}` : '';
  const overrides = lead.overrides?.length
    ? `<p style="color:#d98a3a"><strong>Flags:</strong> ${lead.overrides.join(', ')}</p>`
    : '';
  return `
<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;background:#0c0e12;color:#e8e6e1;padding:32px;border-radius:8px">
  <p style="color:#c9a24b;font-family:monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0 0 8px">Vector Mode Legal · High-Signal Alert</p>
  <h1 style="font-size:24px;margin:0 0 4px">${who}</h1>
  <p style="color:#9ca3af;margin:0 0 24px">${lead.practiceArea || 'Inquiry'} · ${lead.location || 'Location unknown'}</p>

  <div style="background:#151922;border:1px solid #1c2230;border-radius:6px;padding:16px;margin-bottom:16px">
    <div style="font-family:monospace;font-size:28px;color:#c9a24b">${lead.lqs} <span style="font-size:12px;color:#6b7280">LQS</span></div>
    <div style="color:#3fae6a;font-size:13px">${lead.label} · ${lead.action}</div>
  </div>

  <p style="color:#d1d5db;border-left:3px solid #1c2230;padding-left:12px;font-size:14px">${lead.message}</p>
  ${overrides}
  <p style="color:#9ca3af;font-size:13px">${phone}${email}</p>

  <a href="https://portal.vectormodelegal.com/dashboard/${lead.firmSlug}"
     style="display:inline-block;margin-top:16px;background:#c9a24b;color:#0c0e12;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600">
    Open in dashboard →
  </a>
</div>`;
}

function highSignalText(firm, lead) {
  const who = lead.contact?.name || 'New inquiry';
  return `HIGH-SIGNAL LEAD — ${firm?.name || lead.firmSlug}

${who} · LQS ${lead.lqs} (${lead.label})
Practice area: ${lead.practiceArea || 'Unknown'}
Location: ${lead.location || 'Unknown'}
${lead.contact?.phone ? `Phone: ${lead.contact.phone}` : ''}
${lead.contact?.email ? `Email: ${lead.contact.email}` : ''}

"${lead.message}"

Action: ${lead.action}
${lead.overrides?.length ? `Flags: ${lead.overrides.join(', ')}` : ''}

Dashboard: https://portal.vectormodelegal.com/dashboard/${lead.firmSlug}`;
}

function digestHtml(firm, leads) {
  const high = leads.filter((l) => l.band === 'high');
  const rows = leads
    .slice(0, 10)
    .map(
      (l) => `
    <tr>
      <td style="padding:6px 12px 6px 0;color:#e8e6e1">${l.contact?.name || 'Anonymous'}</td>
      <td style="padding:6px 12px 6px 0;color:#9ca3af;font-size:13px">${l.practiceArea || '—'}</td>
      <td style="padding:6px 0;font-family:monospace;color:#c9a24b">${l.lqs}</td>
      <td style="padding:6px 0 6px 12px;font-size:12px;color:${bandColor(l.color)}">${l.label}</td>
    </tr>`
    )
    .join('');

  return `
<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;background:#0c0e12;color:#e8e6e1;padding:32px;border-radius:8px">
  <p style="color:#c9a24b;font-family:monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0 0 8px">Vector Mode Legal · Daily Digest</p>
  <h1 style="font-size:22px;margin:0 0 4px">${firm?.name || 'Your Firm'}</h1>
  <p style="color:#9ca3af;margin:0 0 24px;font-size:13px">Last 24 hours</p>

  <div style="display:flex;gap:24px;margin-bottom:24px">
    <div><div style="font-family:monospace;font-size:28px">${leads.length}</div><div style="color:#6b7280;font-size:12px">NEW LEADS</div></div>
    <div><div style="font-family:monospace;font-size:28px;color:#3fae6a">${high.length}</div><div style="color:#6b7280;font-size:12px">HIGH SIGNAL</div></div>
  </div>

  <table style="width:100%;border-collapse:collapse">${rows}</table>

  <a href="https://portal.vectormodelegal.com/dashboard/${firm?.slug || ''}"
     style="display:inline-block;margin-top:24px;background:#c9a24b;color:#0c0e12;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600">
    Open dashboard →
  </a>
</div>`;
}

function bandColor(color) {
  return { green: '#3fae6a', yellow: '#c9a24b', orange: '#d98a3a', red: '#c4523f' }[color] || '#9ca3af';
}

// ---- Public API ----

/**
 * Send a high-signal lead alert to the firm's notification email.
 * Fire-and-forget: never throws.
 */
async function sendHighSignalAlert(firm, lead) {
  const to = firm?.notifyEmail || firm?.email;
  if (!to) return { sent: false, reason: 'no firm notify email' };
  return send({
    to,
    subject: `High-signal lead: LQS ${lead.lqs} — ${lead.contact?.name || 'New inquiry'}`,
    html: highSignalHtml(firm, lead),
    text: highSignalText(firm, lead),
  });
}

/**
 * Send a daily digest to the firm's notification email.
 * Call this from a cron/scheduled job with leads from the past 24h.
 */
async function sendDailyDigest(firm, leads) {
  const to = firm?.notifyEmail || firm?.email;
  if (!to) return { sent: false, reason: 'no firm notify email' };
  if (!leads?.length) return { sent: false, reason: 'no leads' };
  return send({
    to,
    subject: `${leads.length} new lead${leads.length !== 1 ? 's' : ''} — ${firm?.name || 'Your Firm'}`,
    html: digestHtml(firm, leads),
    text: `${leads.length} new leads in the last 24 hours. ${leads.filter((l) => l.band === 'high').length} high-signal. Open dashboard: https://portal.vectormodelegal.com/dashboard/${firm?.slug}`,
  });
}

module.exports = { sendHighSignalAlert, sendDailyDigest, send };
