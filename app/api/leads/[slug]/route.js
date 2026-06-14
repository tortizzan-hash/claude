/**
 * GET /api/leads/[slug] — list scored leads for a firm, newest first.
 * (Auth is added in the next milestone; for now scoped by firm slug.)
 */
import { NextResponse } from 'next/server';

const { listLeads } = require('../../../../lib/store');

export async function GET(_request, { params }) {
  const { slug } = await params;
  try {
    const leads = await listLeads(slug);
    return NextResponse.json({ ok: true, leads });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
