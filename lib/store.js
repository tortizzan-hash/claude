/**
 * Lead/firm store.
 *
 * Uses Supabase when SUPABASE_URL + SUPABASE_SERVICE_KEY are set; otherwise falls
 * back to an in-memory store so the app runs end-to-end for demos and live audits
 * with zero infrastructure. The interface is identical either way.
 */

let supabase = null;
const mem = {
  firms: new Map(),
  leads: [], // newest first
};

function getSupabase() {
  if (supabase) return supabase;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  const { createClient } = require('@supabase/supabase-js');
  supabase = createClient(url, key, { auth: { persistSession: false } });
  return supabase;
}

// Seed a demo firm so a fresh in-memory boot has something to score against.
function seedDemoFirm() {
  if (mem.firms.size > 0) return;
  mem.firms.set('demo', {
    slug: 'demo',
    name: 'Demo Personal Injury Firm',
    practiceAreas: ['Personal Injury', 'Auto Accident'],
    jurisdiction: 'California',
  });
}

async function getFirmBySlug(slug) {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from('firms').select('*').eq('slug', slug).single();
    if (error) return null;
    return data;
  }
  seedDemoFirm();
  return mem.firms.get(slug) || null;
}

async function insertLead(lead) {
  const record = { ...lead, id: lead.id || cryptoId(), createdAt: new Date().toISOString() };
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from('leads').insert(record).select().single();
    if (error) throw new Error(`store.insertLead: ${error.message}`);
    return data;
  }
  mem.leads.unshift(record);
  return record;
}

async function listLeads(firmSlug) {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb
      .from('leads')
      .select('*')
      .eq('firmSlug', firmSlug)
      .order('createdAt', { ascending: false });
    if (error) throw new Error(`store.listLeads: ${error.message}`);
    return data || [];
  }
  return mem.leads.filter((l) => l.firmSlug === firmSlug);
}

/**
 * Update a lead's disposition (the proof-engine signal): how it actually resolved.
 * Valid statuses: new | contacted | booked | signed | dead.
 * @param {string} id lead id
 * @param {string} firmSlug owning firm (guards cross-firm writes)
 * @param {string} disposition new status
 */
async function updateLeadDisposition(id, firmSlug, disposition) {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb
      .from('leads')
      .update({ disposition, dispositionAt: new Date().toISOString() })
      .eq('id', id)
      .eq('firmSlug', firmSlug)
      .select()
      .single();
    if (error) throw new Error(`store.updateLeadDisposition: ${error.message}`);
    return data;
  }
  const lead = mem.leads.find((l) => l.id === id && l.firmSlug === firmSlug);
  if (!lead) return null;
  lead.disposition = disposition;
  lead.dispositionAt = new Date().toISOString();
  return lead;
}

function cryptoId() {
  return 'lead_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

module.exports = { getFirmBySlug, insertLead, listLeads, updateLeadDisposition };
