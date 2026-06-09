import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
// Render free duerme tras 15 min: el primer hit paga cold start (30-60s).
// Subimos el límite de la función para que no expire esperando al backend.
export const maxDuration = 60;

/**
 * Proxy de cron: Vercel Cron pega aquí 1x/día y reenvía al backend
 * /jobs/daily-check con el header secreto. Mantiene vivo el backend
 * y la DB de Supabase, y dispara las alertas de morosos.
 *
 * Vercel protege /api/cron automáticamente: solo el cron de Vercel
 * puede invocarlo (header Authorization con CRON_SECRET si se define).
 */
export async function GET() {
  const backend = process.env.BACKEND_URL;
  const secret = process.env.DAILY_CHECK_SECRET;
  if (!backend || !secret) {
    return NextResponse.json({ ok: false, error: 'Faltan BACKEND_URL/DAILY_CHECK_SECRET' }, { status: 500 });
  }

  const res = await fetch(`${backend}/jobs/daily-check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Daily-Check-Secret': secret,
    },
    body: '{}',
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json({ ok: res.ok, backend: data }, { status: res.ok ? 200 : 502 });
}
