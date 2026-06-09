import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
// Render free duerme tras 15 min: el primer hit paga cold start (30-60s).
export const maxDuration = 60;

/**
 * Proxy server-side hacia el backend (Render). Inyecta dos credenciales:
 *  - X-Api-Key (env API_KEY): defensa en capas, "vengo del proxy confiable".
 *  - Authorization: Bearer <JWT> (cookie httpOnly 'token'): qué usuario es.
 * Ninguna se expone al navegador. El middleware ya exige cookie para llegar
 * aquí; el backend valida la firma del JWT y el estado del usuario.
 */
const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:3001';
const API_KEY = process.env.API_KEY ?? '';

async function forward(req: NextRequest, path: string[]): Promise<NextResponse> {
  const url = `${BACKEND}/${path.join('/')}${req.nextUrl.search}`;

  const headers: Record<string, string> = { 'X-Api-Key': API_KEY };
  const token = req.cookies.get('token')?.value;
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const ct = req.headers.get('content-type');
  if (ct) headers['content-type'] = ct; // preserva boundary multipart de /pagos/ocr

  const method = req.method;
  const body =
    method === 'GET' || method === 'HEAD' ? undefined : await req.arrayBuffer();

  const res = await fetch(url, { method, headers, body, cache: 'no-store' });

  if (res.status === 204 || res.status === 304) {
    return new NextResponse(null, { status: res.status });
  }

  const buf = await res.arrayBuffer();
  return new NextResponse(buf, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
  });
}

type Ctx = { params: { path: string[] } };

export const GET = (req: NextRequest, { params }: Ctx) => forward(req, params.path);
export const POST = (req: NextRequest, { params }: Ctx) => forward(req, params.path);
export const PATCH = (req: NextRequest, { params }: Ctx) => forward(req, params.path);
export const DELETE = (req: NextRequest, { params }: Ctx) => forward(req, params.path);
