import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/** Cierra sesión: borra la cookie del JWT. */
export async function POST() {
  const out = NextResponse.json({ ok: true });
  out.cookies.set('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return out;
}
