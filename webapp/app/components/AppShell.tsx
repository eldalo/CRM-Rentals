'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  AddressBookIcon,
  BuildingsIcon,
  BuildingOfficeIcon,
  CaretDoubleLeftIcon,
  CaretDoubleRightIcon,
  CaretRightIcon,
  DotsThreeIcon,
  type Icon,
  KeyIcon,
  ReceiptIcon,
  SignOutIcon,
  SquaresFourIcon,
  UsersIcon,
  XIcon,
} from '@phosphor-icons/react';
import { auth, ROL_LABEL, type UsuarioActual } from '@/lib/api';

type Item = { href: string; label: string; Icon: Icon; soloSuper?: boolean };

const NAV: Item[] = [
  { href: '/', label: 'Dashboard', Icon: SquaresFourIcon },
  { href: '/ingreso', label: 'Registrar pago', Icon: ReceiptIcon },
  { href: '/unidades', label: 'Unidades', Icon: BuildingOfficeIcon },
  { href: '/propietarios', label: 'Propietarios', Icon: AddressBookIcon },
  { href: '/apartamentos', label: 'Apartamentos', Icon: BuildingsIcon },
  { href: '/inquilinos', label: 'Inquilinos', Icon: UsersIcon },
  { href: '/usuarios', label: 'Usuarios', Icon: KeyIcon, soloSuper: true },
];

// Ítems que van directo en el bottom-nav móvil; el resto entra en "Más".
const PRIMARIOS = ['/', '/ingreso', '/apartamentos', '/inquilinos'];

const COLAPSO_KEY = 'sidebar-colapsado';

const iniciales = (nombre: string) =>
  nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UsuarioActual | null>(null);
  const [colapsado, setColapsado] = useState(false);
  const [menuMas, setMenuMas] = useState(false);

  // Rutas sin el chrome del panel (login y demo de diseño).
  const sinChrome = pathname === '/login' || pathname.startsWith('/prototipo');

  useEffect(() => {
    if (sinChrome) return;
    auth.me().then(setUser).catch(() => router.push('/login'));
  }, [sinChrome, router]);

  // Estado de colapso persistido (evita parpadeo entre navegaciones).
  useEffect(() => {
    setColapsado(localStorage.getItem(COLAPSO_KEY) === '1');
  }, []);

  // Cierra la hoja "Más" al navegar.
  useEffect(() => {
    setMenuMas(false);
  }, [pathname]);

  const toggleColapso = () =>
    setColapsado((c) => {
      const next = !c;
      localStorage.setItem(COLAPSO_KEY, next ? '1' : '0');
      return next;
    });

  if (sinChrome) return <>{children}</>;

  // Usuarios solo lo ve el super_admin.
  const esSuper = user?.rol === 'superadmin';
  const items = NAV.filter((i) => !i.soloSuper || esSuper);

  const esActivo = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  // Bottom-nav móvil: principales directos + el resto bajo "Más".
  const principales = items.filter((i) => PRIMARIOS.includes(i.href));
  const extras = items.filter((i) => !PRIMARIOS.includes(i.href));
  const extraActivo = extras.some((i) => esActivo(i.href));

  async function salir() {
    await auth.logout();
    router.push('/login');
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* ── Sidebar (desktop) ── */}
      <aside
        className={`hidden shrink-0 flex-col bg-gradient-to-b from-brand-800 via-brand-900 to-brand-900 text-brand-50 shadow-xl transition-[width] duration-200 md:flex ${
          colapsado ? 'w-[76px]' : 'w-64'
        }`}
      >
        {/* Encabezado: marca + toggle */}
        <div className="flex items-center gap-2.5 px-3 py-4">
          {!colapsado && (
            <>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white shadow-inner">
                <BuildingsIcon size={20} weight="fill" />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-bold tracking-tight">
                CRM · Activos GI
              </span>
            </>
          )}
          <button
            onClick={toggleColapso}
            className={`flex h-8 w-8 items-center justify-center rounded-lg text-brand-200 transition hover:bg-white/10 hover:text-white ${
              colapsado ? 'mx-auto' : ''
            }`}
            aria-label={colapsado ? 'Expandir menú' : 'Colapsar menú'}
            title={colapsado ? 'Expandir' : 'Colapsar'}
          >
            {colapsado ? <CaretDoubleRightIcon size={18} /> : <CaretDoubleLeftIcon size={18} />}
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-2.5 py-2">
          {items.map(({ href, label, Icon }) => {
            const activo = esActivo(href);
            return (
              <Link
                key={href}
                href={href}
                title={colapsado ? label : undefined}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  colapsado ? 'justify-center' : ''
                } ${
                  activo
                    ? 'bg-white/15 text-white shadow-sm ring-1 ring-white/10'
                    : 'text-brand-100/90 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon size={21} weight={activo ? 'fill' : 'regular'} className="shrink-0" />
                {!colapsado && <span className="truncate">{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Pie: usuario + salir */}
        <div className="border-t border-white/10 p-2.5">
          {user && (
            <div className={`mb-2 flex items-center gap-2.5 px-1.5 py-1 ${colapsado ? 'justify-center' : ''}`}>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500/90 text-xs font-bold text-white">
                {iniciales(user.nombre_completo)}
              </span>
              {!colapsado && (
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{user.nombre_completo}</p>
                  <p className="truncate text-xs text-brand-200">{ROL_LABEL[user.rol]}</p>
                </div>
              )}
            </div>
          )}
          <button
            onClick={salir}
            title={colapsado ? 'Cerrar sesión' : undefined}
            className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-brand-100/90 transition hover:bg-white/10 hover:text-white ${
              colapsado ? 'justify-center' : ''
            }`}
          >
            <SignOutIcon size={20} className="shrink-0" />
            {!colapsado && 'Cerrar sesión'}
          </button>
        </div>
      </aside>

      {/* ── Contenido ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 bg-gradient-to-r from-brand-800 to-brand-900 px-4 py-3 text-white shadow-md md:hidden">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-white">
              <BuildingsIcon size={18} weight="fill" />
            </span>
            <span className="truncate text-sm font-bold tracking-tight">CRM · Activos GI</span>
          </div>
          {user && (
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="min-w-0 text-right leading-tight">
                <p className="truncate text-sm font-semibold">{user.nombre_completo}</p>
                <p className="truncate text-xs text-brand-200">{ROL_LABEL[user.rol]}</p>
              </div>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500/90 text-xs font-bold">
                {iniciales(user.nombre_completo)}
              </span>
            </div>
          )}
        </header>

        <main className="flex-1 px-4 py-6 pb-28 md:px-8 md:pb-8">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>

        {/* ── Bottom nav (móvil): 4 principales + "Más" ── */}
        <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-white/10 bg-gradient-to-t from-brand-900 to-brand-800 px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(15,23,42,0.25)] md:hidden">
          {principales.map(({ href, label, Icon }) => {
            const activo = esActivo(href);
            return (
              <Link key={href} href={href} className="flex flex-1 flex-col items-center gap-1 py-2">
                <span
                  className={`flex h-8 w-12 items-center justify-center rounded-full transition ${
                    activo ? 'bg-white/15 text-white' : 'text-brand-200'
                  }`}
                >
                  <Icon size={22} weight={activo ? 'fill' : 'regular'} />
                </span>
                <span className={`text-[10.5px] font-medium ${activo ? 'text-white' : 'text-brand-200'}`}>
                  {label}
                </span>
              </Link>
            );
          })}
          {extras.length > 0 && (
            <button onClick={() => setMenuMas(true)} className="flex flex-1 flex-col items-center gap-1 py-2">
              <span
                className={`flex h-8 w-12 items-center justify-center rounded-full transition ${
                  menuMas || extraActivo ? 'bg-white/15 text-white' : 'text-brand-200'
                }`}
              >
                <DotsThreeIcon size={22} weight="bold" />
              </span>
              <span
                className={`text-[10.5px] font-medium ${
                  menuMas || extraActivo ? 'text-white' : 'text-brand-200'
                }`}
              >
                Más
              </span>
            </button>
          )}
        </nav>

        {/* ── Hoja "Más" (móvil): resto de secciones + cerrar sesión ── */}
        {menuMas && (
          <div className="fixed inset-0 z-30 md:hidden" role="dialog" aria-modal="true">
            <div
              className="absolute inset-0 bg-black/40 animate-in fade-in-0"
              onClick={() => setMenuMas(false)}
            />
            <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-2xl animate-in slide-in-from-bottom duration-200">
              <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-200" />
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">Menú</span>
                <button
                  onClick={() => setMenuMas(false)}
                  className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100"
                  aria-label="Cerrar"
                >
                  <XIcon size={18} />
                </button>
              </div>
              <div className="space-y-1">
                {extras.map(({ href, label, Icon }) => {
                  const activo = esActivo(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium transition ${
                        activo ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <Icon size={22} weight={activo ? 'fill' : 'regular'} />
                        {label}
                      </span>
                      <CaretRightIcon size={16} className="text-slate-300" />
                    </Link>
                  );
                })}
                <button
                  onClick={salir}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
                >
                  <SignOutIcon size={22} /> Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
