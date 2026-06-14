import { NextResponse } from 'next/server';
import { verifyAdminLogin, setAdminSession } from '../../../../lib/adminAuth';

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }
  const { email, password } = body;
  const ok = await verifyAdminLogin(email || '', password || '');
  if (!ok) return NextResponse.json({ ok: false, error: 'Invalid credentials' }, { status: 401 });
  await setAdminSession(email);
  return NextResponse.json({ ok: true });
}
