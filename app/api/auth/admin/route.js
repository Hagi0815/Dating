import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '../../../../lib/db';
import { signToken, SESSION_COOKIE_OPTIONS } from '../../../../lib/auth';
import { checkRateLimit, clientIp } from '../../../../lib/rateLimit';

export async function POST(request) {
  const ip = clientIp(request);
  if (!checkRateLimit('admin:' + ip)) {
    return NextResponse.json({ error: 'Zu viele Versuche. Bitte später erneut versuchen.' }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const password = body.password || '';

  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('admin_password_hash');
  if (!row || !bcrypt.compareSync(password, row.value)) {
    return NextResponse.json({ error: 'Falsches Admin-Passwort.' }, { status: 401 });
  }

  const token = signToken({ name: 'admin', role: 'admin' });
  const res = NextResponse.json({ ok: true });
  res.cookies.set('session', token, SESSION_COOKIE_OPTIONS);
  return res;
}
