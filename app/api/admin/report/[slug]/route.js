/**
 * GET /api/admin/report/[slug] — generate an audit report for a firm (admin only).
 */
import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../../lib/adminAuth';

const { getFirmBySlug, listLeads } = require('../../../../../lib/store');
const { generateReport } = require('../../../../../lib/auditReport');

export async function GET(_request, { params }) {
  const auth = await requireAdmin();
  if (auth.error) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const { slug } = await params;
  const [firm, leads] = await Promise.all([getFirmBySlug(slug), listLeads(slug)]);
  if (!firm) return NextResponse.json({ ok: false, error: 'Firm not found' }, { status: 404 });

  const report = generateReport(firm, leads);
  return NextResponse.json({ ok: true, report });
}
