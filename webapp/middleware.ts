import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Gate de acceso. Exige cookie 'token' (JWT) para entrar al panel.
 * Solo verifica PRESENCIA: la firma/validez la comprueba el backend en cada
 * request (así no duplicamos JWT_SECRET en el frontend). Si el token es
 * inválido o expiró, el backend responde 401 y el cliente vuelve a /login.
 * Excluye /login y las rutas internas (/api/login, /api/cron, assets).
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const esPublico =
    pathname.startsWith('/login') ||
    pathname.startsWith('/prototipo') || // demo de diseño, sin datos reales
    pathname.startsWith('/api/login') ||
    pathname.startsWith('/api/cron') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname === '/manifest.webmanifest';

  if (esPublico) return NextResponse.next();

  const token = req.cookies.get('token')?.value;
  if (token) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = '/login';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
