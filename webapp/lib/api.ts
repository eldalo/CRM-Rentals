// Las llamadas pasan por el proxy server-side (app/api/backend), que inyecta
// la API key. El navegador nunca ve la key ni la URL real del backend.
const BASE = '/api/backend';

/**
 * Extrae un mensaje legible del cuerpo de error. El backend (NestJS) responde
 * { message, error, statusCode } y `message` puede ser string o string[].
 * Devuelve solo el texto útil para mostrarlo en un toast.
 */
function mensajeError(raw: string, status: number): string {
  try {
    const j = JSON.parse(raw);
    const m = j?.message ?? j?.error;
    if (Array.isArray(m)) return m.join(', ');
    if (typeof m === 'string' && m) return m;
  } catch {
    /* no era JSON */
  }
  return raw || `Error ${status}`;
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(mensajeError(await res.text(), res.status));
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

async function reqForm<T>(path: string, form: FormData): Promise<T> {
  // Sin Content-Type: el navegador pone el boundary del multipart.
  const res = await fetch(`${BASE}${path}`, { method: 'POST', body: form, cache: 'no-store' });
  if (!res.ok) {
    throw new Error(mensajeError(await res.text(), res.status));
  }
  return (await res.json()) as T;
}

export const api = {
  get: <T>(p: string) => req<T>(p),
  post: <T>(p: string, body: unknown) => req<T>(p, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(p: string, body: unknown) => req<T>(p, { method: 'PATCH', body: JSON.stringify(body) }),
  del: <T>(p: string) => req<T>(p, { method: 'DELETE' }),
  postForm: <T>(p: string, form: FormData) => reqForm<T>(p, form),
};

/** Envelope de respuesta paginada del backend (page_size fijo = 20). */
export interface Paginado<T> {
  data: T[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface SugerenciaOcr {
  monto?: number;
  fecha?: string;
  referencia?: string;
}
export interface ResultadoOcr {
  comprobante_url: string;
  sugerencia: SugerenciaOcr;
}

// ── Tipos ──
export interface Unidad {
  id: string;
  nombre: string;
  direccion: string;
  nombre_administrador: string | null;
  contacto_administrador: string | null;
  estado: boolean;
  creado_en: string;
  actualizado_en: string;
}
export interface CrearUnidad {
  nombre: string;
  direccion: string;
  nombre_administrador?: string;
  contacto_administrador?: string;
  estado?: boolean;
}
export type ActualizarUnidad = Partial<CrearUnidad>;

export interface Propietario {
  id: string;
  nombre_completo: string;
  celular: string | null;
  email: string | null;
  estado: boolean;
  creado_en: string;
  actualizado_en: string;
}
export interface CrearPropietario {
  nombre_completo: string;
  celular?: string;
  email?: string;
  estado?: boolean;
}
export type ActualizarPropietario = Partial<CrearPropietario>;

export interface Apartamento {
  id: string;
  unidad_id: string;
  numero: string;
  canon: number;
  dia_corte: number;
  propietario_id: string;
  responsable_id: string;
  asegurado: boolean;
  estado: boolean;
  // Relaciones embebidas por el backend (joins).
  unidades?: { id: string; nombre: string; direccion: string } | null;
  propietarios?: { id: string; nombre_completo: string } | null;
  responsable?: { id: string; nombre_completo: string; rol: Rol } | null;
}
export interface CrearApartamento {
  unidad_id: string;
  numero: string;
  canon: number;
  dia_corte: number;
  propietario_id: string;
  responsable_id: string;
  asegurado?: boolean;
  estado?: boolean;
}
export type ActualizarApartamento = Partial<CrearApartamento>;

/** Etiqueta visible de un apartamento: "Vivenza 2415". */
export const aptoLabel = (a: { numero: string; unidades?: { nombre: string } | null }) =>
  `${a.unidades?.nombre ?? ''} ${a.numero}`.trim();

export interface Inquilino {
  id: string;
  apartamento_id: string;
  nombre_completo: string;
  celular: string | null;
  cedula: string | null;
  email: string | null;
  nombre_referencia_personal: string | null;
  celular_referencia_personal: string | null;
  nombre_2_referencia_personal: string | null;
  celular_2_referencia_personal: string | null;
  estado: boolean;
  creado_en: string;
  actualizado_en: string;
  // Apartamento embebido por el backend (join).
  apartamentos?: { numero: string; unidades?: { nombre: string } | null } | null;
}
export interface CrearInquilino {
  apartamento_id: string;
  nombre_completo: string;
  celular?: string;
  cedula?: string;
  email?: string;
  nombre_referencia_personal?: string;
  celular_referencia_personal?: string;
  nombre_2_referencia_personal?: string;
  celular_2_referencia_personal?: string;
  estado?: boolean;
}
export type ActualizarInquilino = Partial<CrearInquilino>;

export type Semaforo = 'pagado' | 'pendiente' | 'vencido';

export interface EstadoApto {
  apartamento_id: string;
  unidad: string;
  canon: number;
  dia_corte: number;
  periodo: string;
  fecha_limite: string;
  estado_pago: 'pendiente' | 'confirmado' | 'rechazado' | null;
  monto: number | null;
  comprobante_url: string | null;
  semaforo: Semaforo;
}

export const periodoActual = () => new Date().toISOString().slice(0, 7); // 'YYYY-MM'

export const fmtCOP = (n?: number | null) =>
  n == null
    ? '—'
    : new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

// ── Auth / Usuarios ──
export type Rol = 'super_admin' | 'admin' | 'asesor';

export const ROL_LABEL: Record<Rol, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  asesor: 'Asesor',
};

export interface UsuarioActual {
  id: string;
  usuario: string;
  email: string;
  nombre_completo: string;
  rol: Rol;
}

export interface Usuario {
  id: string;
  usuario: string;
  email: string;
  nombre_completo: string;
  estado: boolean;
  ultimo_login: string | null;
  rol: Rol;
  creado_en: string;
  actualizado_en: string;
  // Bot de Telegram. El token NO se devuelve (write-only): solo tiene_bot.
  telegram_chat_id: string | null;
  recibe_todos_pagos: boolean;
  tiene_bot: boolean;
}

export interface CrearUsuario {
  usuario: string;
  email: string;
  password: string;
  nombre_completo: string;
  rol: Rol;
  estado?: boolean;
  telegram_bot_token?: string;
  telegram_chat_id?: string;
  recibe_todos_pagos?: boolean;
}
export type ActualizarUsuario = Partial<CrearUsuario>;

// Sesión
export const auth = {
  me: () => api.get<UsuarioActual>('/auth/me'),
  logout: () => fetch('/api/logout', { method: 'POST' }),
};

// CRUD usuarios (solo admin / super_admin lo verán en la UI)
export const usuariosApi = {
  listar: (page = 1) => api.get<Paginado<Usuario>>(`/usuarios?page=${page}`),
  obtener: (id: string) => api.get<Usuario>(`/usuarios/${id}`),
  crear: (dto: CrearUsuario) => api.post<Usuario>('/usuarios', dto),
  actualizar: (id: string, dto: ActualizarUsuario) => api.patch<Usuario>(`/usuarios/${id}`, dto),
  desactivar: (id: string) => api.del<Usuario>(`/usuarios/${id}`),
};

// CRUD unidades (solo admin / super_admin pueden mutar; soft-delete)
export const unidadesApi = {
  listar: (page = 1) => api.get<Paginado<Unidad>>(`/unidades?page=${page}`),
  obtener: (id: string) => api.get<Unidad>(`/unidades/${id}`),
  crear: (dto: CrearUnidad) => api.post<Unidad>('/unidades', dto),
  actualizar: (id: string, dto: ActualizarUnidad) => api.patch<Unidad>(`/unidades/${id}`, dto),
  desactivar: (id: string) => api.del<Unidad>(`/unidades/${id}`),
};

// CRUD propietarios (solo admin / super_admin pueden mutar; soft-delete)
export const propietariosApi = {
  listar: (page = 1) => api.get<Paginado<Propietario>>(`/propietarios?page=${page}`),
  obtener: (id: string) => api.get<Propietario>(`/propietarios/${id}`),
  crear: (dto: CrearPropietario) => api.post<Propietario>('/propietarios', dto),
  actualizar: (id: string, dto: ActualizarPropietario) =>
    api.patch<Propietario>(`/propietarios/${id}`, dto),
  desactivar: (id: string) => api.del<Propietario>(`/propietarios/${id}`),
};
