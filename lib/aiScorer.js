/**
 * AI scorer — reads a raw legal inquiry and assigns the five LQS sub-scores.
 *
 * The LLM only produces the five 0-100 sub-scores (and override flags it can infer
 * from the text). The actual LQS number is computed deterministically by lib/lqs.js,
 * so the math is never left to the model.
 */

const Anthropic = require('@anthropic-ai/sdk');
const { scoreLead } = require('./lqs');

// Latest, most capable default for this kind of structured judgment.
const MODEL = 'claude-opus-4-8';

const SYSTEM_PROMPT = `You are the intake scoring engine for a law firm. You read an incoming legal inquiry and rate it on five dimensions, each 0-100. You do NOT compute a final score — you only assign the five sub-scores and flag overrides.

Definitions:
- ISS (Inquiry Signal Score): how real, specific, urgent, and legible the inquiry is. Higher = clear facts, clear timeline, specific legal issue, detailed, coherent.
- CFS (Case Fit Score): whether the inquiry fits THIS firm's practice area and jurisdiction. Higher = correct practice area, correct jurisdiction/location, case type the firm wants.
- BIS (Buyer Intent Score): whether the person seems ready to hire/book. Higher = requests consult, asks about representation, urgency, deadline, has not already hired another attorney.
- FRS (Firm Readiness Score): whether the firm can realistically serve this lead. If firm context is unknown, assume reasonable readiness (~70) unless the inquiry reveals a clear mismatch.
- CRS (Conversion Resistance Score): friction blocking conversion. HIGHER IS WORSE. Higher = wrong jurisdiction, low budget, vague facts, hard to contact, already has an attorney, low urgency, case outside firm scope, missing critical info.

Also infer override flags from the text: urgentDeadline, courtDateSoon, highValueCaseType, severeHarm, strongMatterLowIntent.

Respond with ONLY a JSON object, no prose:
{"iss":N,"cfs":N,"bis":N,"frs":N,"crs":N,"flags":{"urgentDeadline":bool,"courtDateSoon":bool,"highValueCaseType":bool,"severeHarm":bool,"strongMatterLowIntent":bool},"reasoning":"one sentence"}`;

/**
 * Build the user-facing description of the inquiry + firm context.
 */
function buildPrompt({ firm, inquiry }) {
  const firmCtx = firm
    ? `FIRM CONTEXT:\nName: ${firm.name || 'Unknown'}\nPractice areas: ${(firm.practiceAreas || []).join(', ') || 'Unknown'}\nJurisdiction: ${firm.jurisdiction || 'Unknown'}\n\n`
    : '';
  const fields = [
    inquiry.name && `Name: ${inquiry.name}`,
    inquiry.practiceArea && `Practice area selected: ${inquiry.practiceArea}`,
    inquiry.location && `Location: ${inquiry.location}`,
    inquiry.phone && `Phone provided: yes`,
    inquiry.email && `Email provided: yes`,
    inquiry.message && `Message: ${inquiry.message}`,
  ].filter(Boolean).join('\n');
  return `${firmCtx}INCOMING INQUIRY:\n${fields}`;
}

function extractJson(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('AI scorer: no JSON found in model response');
  return JSON.parse(match[0]);
}

/**
 * Score a raw inquiry. Returns the full scoreLead() result plus AI reasoning.
 * @param {{firm?:object, inquiry:object}} input
 * @param {object} [opts] { apiKey } — defaults to ANTHROPIC_API_KEY env var
 */
async function scoreInquiry({ firm, inquiry }, opts = {}) {
  const apiKey = opts.apiKey || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('AI scorer: ANTHROPIC_API_KEY is not set');

  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: opts.model || MODEL,
    max_tokens: 400,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildPrompt({ firm, inquiry }) }],
  });

  const text = response.content.map((b) => (b.type === 'text' ? b.text : '')).join('');
  const parsed = extractJson(text);

  const subscores = {
    iss: parsed.iss, cfs: parsed.cfs, bis: parsed.bis, frs: parsed.frs, crs: parsed.crs,
  };
  const result = scoreLead(subscores, parsed.flags || {});
  return { ...result, reasoning: parsed.reasoning || '' };
}

module.exports = { scoreInquiry, buildPrompt, MODEL };
