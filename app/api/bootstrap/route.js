import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '../../../lib/db';

export async function GET() {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('admin_password_hash');
  return NextResponse.json({ initialized: !!row });
}

export async function POST(request) {
  const existing = db.prepare('SELECT value FROM settings WHERE key = ?').get('admin_password_hash');
  if (existing) {
    return NextResponse.json({ error: 'Admin-Zugang existiert bereits.' }, { status: 400 });
  }
  const body = await request.json().catch(() => ({}));
  const password = (body.password || '').trim();
  if (password.length < 4) {
    return NextResponse.json({ error: 'Passwort zu kurz (mind. 4 Zeichen).' }, { status: 400 });
  }
  const hash = bcrypt.hashSync(password, 10);
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('admin_password_hash', hash);
  return NextResponse.json({ ok: true });
}
