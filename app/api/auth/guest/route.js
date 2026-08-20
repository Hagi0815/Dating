import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '../../../../lib/db';
import { signToken, SESSION_COOKIE_OPTIONS } from '../../../../lib/auth';
import { checkRateLimit, clientIp } from '../../../../lib/rateLimit';

export async function POST(request) {
  const ip = clientIp(request);
  if (!checkRateLimit('guest:' + ip)) {
    return NextResponse.json({ error: 'Zu viele Versuche. Bitte später erneut versuchen.' }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const name = (body.name || '').trim();
  const password = body.password || '';
  if (!name || !password) {
    return NextResponse.json({ error: 'Name und Passwort erforderlich.' }, { status: 400 });
  }

  const user = db.prepare('SELECT * FROM users WHERE name = ? COLLATE NOCASE').get(name);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return NextResponse.json({ error: 'Unbekannter Name oder falsches Passwort.' }, { status: 401 });
  }

  const row = db.prepare('SELECT * FROM submissions WHERE user_name = ? COLLATE NOCASE ORDER BY id DESC LIMIT 1').get(user.name);
  const submission = row
    ? { id: row.id, name: row.user_name, date: row.date, time: row.time, place: row.place, confirmed: !!row.confirmed, answers: JSON.parse(row.answers || '[]') }
    : null;

  const token = signToken({ name: user.name, role: 'guest' });
  const res = NextResponse.json({ ok: true, name: user.name, submission });
  res.cookies.set('session', token, SESSION_COOKIE_OPTIONS);
  return res;
}
