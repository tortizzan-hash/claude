import { NextResponse } from 'next/server';
import { requireFirm } from '../../../../../../lib/serverAuth';

const { addLeadNote } = require('../../../../../../lib/store');

export async function POST(request, { params }) {
  const { slug, id } = await params;
  const auth = await requireFirm(slug);
  if (auth.error) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  let body;
  try { body = await request.json(); } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const { text } = body;
  if (!text || typeof text !== 'string' || text.trim().length < 1) {
    return NextResponse.json({ ok: false, error: 'Note text is required.' }, { status: 400 });
  }

  const lead = await addLeadNote(id, slug, text.trim());
  if (!lead) return NextResponse.json({ ok: false, error: 'Lead not found' }, { status: 404 });
  return NextResponse.json({ ok: true, lead });
}
