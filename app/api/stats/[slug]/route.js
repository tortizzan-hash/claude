/**
 * GET /api/stats/[slug] — conversion proof for a firm: overall + by-LQS-band rates.
 * This is the data buyers ask for ("does high LQS actually convert?").
 */
import { NextResponse } from 'next/server';
import { requireFirm } from '../../../../lib/serverAuth';

const { listLeads } = require('../../../../lib/store');
const { computeStats } = require('../../../../lib/proof');

export async function GET(_request, { params }) {
  const { slug } = await params;
  const auth = await requireFirm(slug);
  if (auth.error) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  try {
    const leads = await listLeads(slug);
    return NextResponse.json({ ok: true, ...computeStats(leads) });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
