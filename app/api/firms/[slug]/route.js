/**
 * PATCH /api/firms/[slug] — update firm settings (authenticated firm owner only).
 */
import { NextResponse } from 'next/server';
import { requireFirm } from '../../../../lib/serverAuth';

const { updateFirm } = require('../../../../lib/store');

export async function PATCH(request, { params }) {
  const { slug } = await params;
  const auth = await requireFirm(slug);
  if (auth.error) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  let body;
  try { body = await request.json(); } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const firm = await updateFirm(slug, body);
  if (!firm) return NextResponse.json({ ok: false, error: 'Firm not found' }, { status: 404 });
  return NextResponse.json({ ok: true, firm });
}
