import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '../../../lib/db';
import { getSession } from '../../../lib/auth';

function requireAdmin(request) {
  const session = getSession(request);
  return session && session.role === 'admin' ? session : null;
}

export async function GET(request) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });
  }
  const users = db.prepare('SELECT name, created_at FROM users ORDER BY created_at ASC').all();
  return NextResponse.json({ users });
}

export async function POST(request) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const name = (body.name || '').trim();
  const password = (body.password || '').trim();
  if (!name || !password) {
    return NextResponse.json({ error: 'Name und Passwort erforderlich.' }, { status: 400 });
  }
  const existing = db.prepare('SELECT id FROM users WHERE name = ? COLLATE NOCASE').get(name);
  if (existing) {
    return NextResponse.json({ error: 'Diesen Namen gibt es schon.' }, { status: 409 });
  }
  const hash = bcrypt.hashSync(password, 10);
  db.prepare('INSERT INTO users (name, password_hash) VALUES (?, ?)').run(name, hash);
  return NextResponse.json({ ok: true });
}
