'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  BuildingsIcon,
  LockIcon,
  ReceiptIcon,
  SignInIcon,
  UserIcon,
  UsersThreeIcon,
} from '@phosphor-icons/react';
import { Button, Input } from '@/app/components/ui';

const FEATURES = [
  { Icon: BuildingsIcon, texto: 'Unidades, propietarios y apartamentos' },
  { Icon: UsersThreeIcon, texto: 'Inquilinos y responsables a cargo' },
  { Icon: ReceiptIcon, texto: 'Pagos del mes con avisos por Telegram' },
];

export default function LoginPage() {
  const [identificador, setIdentificador] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identificador, password }),
    });
    setCargando(false);
    if (res.ok) {
      window.location.href = '/';
      return;
    }
    if (res.status === 502) {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? 'No se pudo conectar con el servidor.');
    } else {
      toast.error('Usuario o contraseña incorrectos');
    }
  }

  return (
    <main className="flex min-h-screen">
      {/* ── Panel de marca (solo desktop) ── */}
      <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900 p-12 text-white lg:flex">
        {/* Decoración */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500 shadow-lg">
            <BuildingsIcon size={24} weight="fill" />
          </span>
          <span className="text-lg font-bold tracking-tight">CRM · Activos GI</span>
        </div>

        <div className="relative space-y-7">
          <h2 className="text-4xl font-bold leading-tight">
            Gestiona tus arriendos
            <br />
            en un solo lugar
          </h2>
          <ul className="space-y-4">
            {FEATURES.map(({ Icon, texto }) => (
              <li key={texto} className="flex items-center gap-3 text-brand-100">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Icon size={18} weight="fill" />
                </span>
                <span className="text-sm">{texto}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-brand-200/70">© Activos GI · Gestión Inmobiliaria</p>
      </aside>

      {/* ── Lado del formulario ── */}
      <div className="flex w-full flex-col bg-slate-50 lg:w-1/2">
        {/* Hero de marca (solo móvil/tablet) */}
        <div className="relative overflow-hidden rounded-b-[2rem] bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900 px-6 pb-10 pt-14 text-center text-white shadow-lg lg:hidden">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-brand-500/25 blur-3xl" />
          <span className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 shadow-lg backdrop-blur">
            <BuildingsIcon size={32} weight="fill" />
          </span>
          <h1 className="relative text-2xl font-bold tracking-tight">CRM · Activos GI</h1>
          <p className="relative mt-1 text-sm text-brand-100">Gestión de arriendos</p>
        </div>

        {/* Formulario */}
        <div className="flex flex-1 items-center justify-center px-4 py-8 sm:py-10">
          <div className="w-full max-w-sm">
            <div className="mb-6 text-center lg:text-left">
              <h2 className="text-2xl font-bold text-slate-900">Bienvenido</h2>
              <p className="text-sm text-slate-500">Ingresa a tu panel de gestión</p>
            </div>

            <form
              onSubmit={entrar}
              className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-300/40 sm:p-8"
            >
            <Input
              label="Usuario o email"
              type="text"
              icon={<UserIcon size={16} />}
              value={identificador}
              onChange={(e) => setIdentificador(e.target.value)}
              placeholder="usuario o correo@ejemplo.com"
              autoComplete="username"
              autoFocus
            />

            <Input
              label="Contraseña"
              type="password"
              icon={<LockIcon size={16} />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />

            <Button
              type="submit"
              loading={cargando}
              loadingText="Ingresando…"
              disabled={!identificador || !password}
              icon={<SignInIcon size={16} />}
              className="w-full"
            >
              Entrar
            </Button>
          </form>
          </div>
        </div>
      </div>
    </main>
  );
}
