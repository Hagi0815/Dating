import { NextResponse } from 'next/server';
import db from '../../../../lib/db';
import { getSession } from '../../../../lib/auth';

export async function GET(request) {
  const session = getSession(request);
  if (!session) {
    return NextResponse.json({ session: null });
  }

  if (session.role === 'guest') {
    const row = db.prepare('SELECT * FROM submissions WHERE user_name = ? COLLATE NOCASE ORDER BY id DESC LIMIT 1').get(session.name);
    const submission = row
      ? { id: row.id, name: row.user_name, date: row.date, time: row.time, place: row.place, confirmed: !!row.confirmed, answers: JSON.parse(row.answers || '[]') }
      : null;
    return NextResponse.json({ session, submission });
  }

  return NextResponse.json({ session });
}
