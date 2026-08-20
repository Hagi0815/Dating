import { NextResponse } from 'next/server';
import db from '../../../../lib/db';
import { getSession } from '../../../../lib/auth';

export async function DELETE(request, { params }) {
  const session = getSession(request);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });
  }
  const name = decodeURIComponent(params.name);
  db.prepare('DELETE FROM users WHERE name = ?').run(name);
  return NextResponse.json({ ok: true });
}
