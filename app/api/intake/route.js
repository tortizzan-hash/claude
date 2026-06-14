/**
 * POST /api/intake
 *
 * The public integration point. Manus's marketing site (or the hosted VML intake
 * form) sends a lead here; we score it with Claude + the canon LQS engine and store it.
 *
 * Request JSON:
 *   { firmSlug, name?, email?, phone?, practiceArea?, location?, message }
 * Response JSON:
 *   { ok, lead: { id, lqs, band, action, ... } }
 */

import { NextResponse } from 'next/server';

const { getFirmBySlug, insertLead } = require('../../../lib/store');
const { scoreInquiry } = require('../../../lib/aiScorer');
const { scoreLead } = require('../../../lib/lqs');
const { maybeAlert } = require('../../../lib/alerts');
const { syncToCrm } = require('../../../lib/crm');
const { sendHighSignalAlert } = require('../../../lib/email');

// CORS so the marketing site on another origin can POST here.
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400, headers: CORS });
  }

  const { firmSlug = 'demo', message } = body;
  if (!message || typeof message !== 'string' || message.trim().length < 3) {
    return NextResponse.json(
      { ok: false, error: 'A "message" describing the inquiry is required.' },
      { status: 400, headers: CORS }
    );
  }

  const firm = await getFirmBySlug(firmSlug);
  if (!firm) {
    return NextResponse.json(
      { ok: false, error: `Unknown firm "${firmSlug}".` },
      { status: 404, headers: CORS }
    );
  }

  const inquiry = {
    name: body.name, email: body.email, phone: body.phone,
    practiceArea: body.practiceArea, location: body.location, message,
  };

  // Score with Claude when a key is present; otherwise fall back to a transparent
  // heuristic so demos run with zero secrets. Either way LQS math is deterministic.
  let scored;
  try {
    if (process.env.ANTHROPIC_API_KEY) {
      scored = await scoreInquiry({ firm, inquiry });
    } else {
      scored = heuristicScore(inquiry);
    }
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: `Scoring failed: ${err.message}` },
      { status: 502, headers: CORS }
    );
  }

  const lead = await insertLead({
    firmSlug,
    contact: { name: inquiry.name, email: inquiry.email, phone: inquiry.phone },
    practiceArea: inquiry.practiceArea,
    location: inquiry.location,
    message,
    disposition: 'new', // proof-engine starting state
    ...scored,
  });

  // Fire-and-forget: instant alert for high-signal leads + CRM sync. Neither
  // should block or fail the intake response, so we don't await their outcome.
  Promise.allSettled([maybeAlert(firm, lead), syncToCrm(firm, lead), sendHighSignalAlert(firm, lead)]);

  return NextResponse.json({ ok: true, lead }, { headers: CORS });
}

/**
 * Heuristic fallback scorer — keyword/length signals only. Clearly marked so a
 * demo without an API key still produces a believable, deterministic score.
 */
function heuristicScore(inquiry) {
  const msg = (inquiry.message || '').toLowerCase();
  const len = msg.length;
  const has = (words) => words.some((w) => msg.includes(w));

  const iss = clamp(40 + Math.min(40, len / 4) + (has(['date', 'when', 'yesterday', 'last week']) ? 10 : 0));
  const cfs = inquiry.practiceArea ? 80 : 55;
  const bis = 40 + (has(['hire', 'represent', 'consultation', 'attorney', 'lawyer', 'asap', 'urgent']) ? 35 : 0);
  const frs = 70;
  const crs = (has(['already have', 'just curious', 'no money', "can't afford", 'not sure']) ? 60 : 20)
    + (len < 30 ? 20 : 0);

  const flags = {
    urgentDeadline: has(['deadline', 'asap', 'urgent', 'soon']),
    courtDateSoon: has(['court date', 'hearing', 'trial']),
    highValueCaseType: has(['accident', 'injury', 'wrongful', 'malpractice']),
    severeHarm: has(['hospital', 'surgery', 'died', 'death', 'permanent']),
    strongMatterLowIntent: false,
  };

  return {
    ...scoreLead(
      { iss: clamp(iss), cfs: clamp(cfs), bis: clamp(bis), frs: clamp(frs), crs: clamp(crs) },
      flags
    ),
    reasoning: 'Heuristic score (no AI key configured).',
  };
}

function clamp(n) {
  return Math.max(0, Math.min(100, Math.round(n)));
}
