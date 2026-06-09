import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:3001';
const API_KEY = process.env.API_KEY ?? '';

/**
 * Login multi-usuario. Reenvía credenciales al backend (/auth/login) y, si son
 * válidas, guarda el JWT en una cookie httpOnly. El navegador nunca ve ni
 * manipula el token.
 */
export async function POST(req: Request) {
  const { identificador, password } = await req
    .json()
    .catch(() => ({ identificador: '', password: '' }));

  if (!identificador || !password) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  let res: Response;
  try {
    res = await fetch(`${BACKEND}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': API_KEY },
      body: JSON.stringify({ identificador, password }),
      cache: 'no-store',
    });
  } catch {
    // Backend caído / inalcanzable: respuesta clara en vez de 500 crudo.
    return NextResponse.json(
      { ok: false, error: 'No se pudo conectar con el servidor. Intenta más tarde.' },
      { status: 502 },
    );
  }

  if (!res.ok) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const data = await res.json();
  const out = NextResponse.json({ ok: true, usuario: data.usuario });
  out.cookies.set('token', data.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8, // 8h, alineado con JWT_EXPIRES
  });
  return out;
}
