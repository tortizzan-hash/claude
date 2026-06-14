import { NextResponse } from 'next/server';

const { getUserByEmail } = require('../../../../lib/store');
const { verifyPassword } = require('../../../../lib/auth');
import { setSessionCookie } from '../../../../lib/serverAuth';

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const { email, password } = body;
  const user = await getUserByEmail(email);
  // Constant-ish response: same error whether the user exists or the password is wrong.
  if (!user || !verifyPassword(password || '', user.passwordHash)) {
    return NextResponse.json({ ok: false, error: 'Invalid email or password' }, { status: 401 });
  }

  await setSessionCookie(user);
  return NextResponse.json({ ok: true, firmSlug: user.firmSlug });
}
