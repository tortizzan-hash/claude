/**
 * CRM sync — push scored leads into the firm's existing practice-management system.
 *
 * Integration is table stakes in legal tech: a standalone scorer dies, but a scorer
 * that drops qualified leads straight into Clio / Lawmatics is sticky. This module
 * normalizes a lead into a generic contact payload and forwards it to the firm's
 * configured CRM webhook. Provider-specific adapters can map this shape to each API.
 *
 * Configure per firm via firm.crm = { provider, webhook }.
 */

const SUPPORTED = ['clio', 'lawmatics', 'generic'];

/** Map our internal lead to a CRM-neutral contact + matter payload. */
function toCrmPayload(lead) {
  return {
    contact: {
      name: lead.contact?.name || null,
      email: lead.contact?.email || null,
      phone: lead.contact?.phone || null,
    },
    matter: {
      practiceArea: lead.practiceArea || null,
      location: lead.location || null,
      description: lead.message || null,
    },
    scoring: {
      lqs: lead.lqs,
      band: lead.band,
      subscores: lead.subscores,
      overrides: lead.overrides || [],
    },
    source: 'Vector Mode Legal',
    receivedAt: lead.createdAt,
  };
}

/**
 * Forward a lead to the firm's CRM. Never throws — CRM sync must not block intake.
 * @returns {Promise<{synced:boolean, provider?:string, reason?:string}>}
 */
async function syncToCrm(firm, lead) {
  const crm = firm?.crm;
  if (!crm || !crm.webhook) return { synced: false, reason: 'no CRM configured' };
  if (crm.provider && !SUPPORTED.includes(crm.provider)) {
    return { synced: false, reason: `unsupported provider "${crm.provider}"` };
  }

  try {
    await fetch(crm.webhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(crm.apiKey ? { Authorization: `Bearer ${crm.apiKey}` } : {}),
      },
      body: JSON.stringify({ provider: crm.provider || 'generic', ...toCrmPayload(lead) }),
    });
    return { synced: true, provider: crm.provider || 'generic' };
  } catch (err) {
    console.error('[crm] sync failed:', err.message);
    return { synced: false, reason: err.message };
  }
}

module.exports = { toCrmPayload, syncToCrm, SUPPORTED };
