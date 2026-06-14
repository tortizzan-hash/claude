/**
 * PATCH /api/leads/[slug]/[id] — update a lead's disposition (proof-engine signal).
 * Body: { disposition: "new"|"contacted"|"booked"|"signed"|"dead" }
 */
import { NextResponse } from 'next/server';
import { requireFirm } from '../../../../../lib/serverAuth';

const { updateLeadDisposition } = require('../../../../../lib/store');
const { DISPOSITIONS } = require('../../../../../lib/proof');

export async function PATCH(request, { params }) {
  const { slug, id } = await params;
  const auth = await requireFirm(slug);
  if (auth.error) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const { disposition } = body;
  if (!DISPOSITIONS.includes(disposition)) {
    return NextResponse.json(
      { ok: false, error: `disposition must be one of: ${DISPOSITIONS.join(', ')}` },
      { status: 400 }
    );
  }

  const lead = await updateLeadDisposition(id, slug, disposition);
  if (!lead) {
    return NextResponse.json({ ok: false, error: 'Lead not found' }, { status: 404 });
  }
  return NextResponse.json({ ok: true, lead });
}
