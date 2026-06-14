import { NextResponse } from 'next/server';

const { createFirm, createUser, getUserByEmail, getFirmBySlug } = require('../../../../lib/store');
const { hashPassword } = require('../../../../lib/auth');
import { setSessionCookie } from '../../../../lib/serverAuth';

/** Slugify a firm name into a URL-safe identifier. */
function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const { firmName, name, email, password } = body;
  const jurisdiction = body.jurisdiction || '';
  const practiceAreas = Array.isArray(body.practiceAreas)
    ? body.practiceAreas
    : String(body.practiceAreas || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

  if (!firmName || !email || !password) {
    return NextResponse.json(
      { ok: false, error: 'firmName, email, and password are required.' },
      { status: 400 }
    );
  }
  if (String(password).length < 8) {
    return NextResponse.json(
      { ok: false, error: 'Password must be at least 8 characters.' },
      { status: 400 }
    );
  }
  if (await getUserByEmail(email)) {
    return NextResponse.json(
      { ok: false, error: 'An account with that email already exists.' },
      { status: 409 }
    );
  }

  // Derive a unique firm slug.
  let slug = slugify(firmName) || 'firm';
  if (await getFirmBySlug(slug)) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

  try {
    await createFirm({ slug, name: firmName, practiceAreas, jurisdiction });
    const user = await createUser({
      email,
      name: name || firmName,
      firmSlug: slug,
      passwordHash: hashPassword(password),
    });
    await setSessionCookie(user);
    return NextResponse.json({ ok: true, firmSlug: slug });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
