import { NextResponse } from 'next/server';
import db from '../../../lib/db';
import { getSession } from '../../../lib/auth';

export async function GET(request) {
  const session = getSession(request);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });
  }
  const rows = db.prepare('SELECT * FROM submissions ORDER BY id DESC').all();
  const submissions = rows.map(r => ({
    name: r.user_name,
    date: r.date,
    time: r.time,
    place: r.place,
    submittedAt: r.submitted_at
  }));
  return NextResponse.json({ submissions });
}

export async function POST(request) {
  const session = getSession(request);
  if (!session || session.role !== 'guest') {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const date = (body.date || '').trim();
  const time = (body.time || '').trim();
  const place = (body.place || '').trim();
  const answers = Array.isArray(body.answers) ? body.answers : [];

  if (!date) {
    return NextResponse.json({ error: 'Bitte ein Datum auswählen.' }, { status: 400 });
  }

  db.prepare('DELETE FROM submissions WHERE user_name = ? COLLATE NOCASE').run(session.name);
  db.prepare(
    'INSERT INTO submissions (user_name, date, time, place, answers) VALUES (?, ?, ?, ?, ?)'
  ).run(session.name, date, time || null, place || null, JSON.stringify(answers));

  return NextResponse.json({ ok: true });
}
