import { NextResponse } from 'next/server';
import db from '../../../../lib/db';
import { getSession } from '../../../../lib/auth';

function requireAdmin(request) {
  const session = getSession(request);
  return session && session.role === 'admin' ? session : null;
}

export async function DELETE(request, { params }) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });
  }
  const id = Number(params.id);
  db.prepare('DELETE FROM submissions WHERE id = ?').run(id);
  return NextResponse.json({ ok: true });
}

export async function PATCH(request, { params }) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });
  }
  const id = Number(params.id);
  const body = await request.json().catch(() => ({}));
  const confirmed = body.confirmed ? 1 : 0;
  db.prepare('UPDATE submissions SET confirmed = ? WHERE id = ?').run(confirmed, id);
  return NextResponse.json({ ok: true });
}
