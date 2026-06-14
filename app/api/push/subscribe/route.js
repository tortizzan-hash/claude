/**
 * POST /api/push/subscribe — store a browser push subscription for a firm user.
 * The subscription object (endpoint + keys) is persisted so the server can send
 * push notifications when high-signal leads arrive.
 *
 * Uses the Web Push Protocol (RFC 8030). Requires VAPID keys in env:
 *   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:you@domain.com)
 * Generate keys: npx web-push generate-vapid-keys
 */
import { NextResponse } from 'next/server';
import { getSession } from '../../../../lib/serverAuth';

const { updateFirm, getFirmBySlug } = require('../../../../lib/store');

export async function POST(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 });

  let body;
  try { body = await request.json(); } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const { subscription } = body;
  if (!subscription?.endpoint) {
    return NextResponse.json({ ok: false, error: 'Invalid push subscription' }, { status: 400 });
  }

  // Merge this subscription into the firm's push_subscriptions list.
  const firm = await getFirmBySlug(session.firmSlug);
  const existing = firm?.pushSubscriptions || [];
  const deduped = existing.filter((s) => s.endpoint !== subscription.endpoint);
  await updateFirm(session.firmSlug, { pushSubscriptions: [...deduped, subscription] });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 });

  let body;
  try { body = await request.json(); } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const { endpoint } = body;
  const firm = await getFirmBySlug(session.firmSlug);
  const filtered = (firm?.pushSubscriptions || []).filter((s) => s.endpoint !== endpoint);
  await updateFirm(session.firmSlug, { pushSubscriptions: filtered });

  return NextResponse.json({ ok: true });
}
