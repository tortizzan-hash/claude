/**
 * GET /api/admin/firms — list all firms with aggregate stats (admin only).
 */
import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/adminAuth';

const { listAllFirms } = require('../../../../lib/store');
const { computeStats } = require('../../../../lib/proof');

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const firms = await listAllFirms();
  return NextResponse.json({ ok: true, firms });
}
