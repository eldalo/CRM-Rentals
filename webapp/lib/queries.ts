'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  api,
  auth,
  unidadesApi,
  propietariosApi,
  usuariosApi,
  type UsuarioActual,
  type Apartamento,
  type ActualizarApartamento,
  type CrearApartamento,
  type CrearUnidad,
  type ActualizarUnidad,
  type CrearPropietario,
  type ActualizarPropietario,
  type EstadoApto,
  type Inquilino,
  type CrearInquilino,
  type ActualizarInquilino,
  type Paginado,
  type Propietario,
  type Unidad,
  type ActualizarUsuario,
  type Usuario,
} from './api';

/** Recorre todas las páginas de un endpoint paginado y junta los registros. */
async function traerTodo<T>(fetchPage: (page: number) => Promise<Paginado<T>>): Promise<T[]> {
  const primera = await fetchPage(1);
  const todo = [...primera.data];
  for (let p = 2; p <= primera.total_pages; p++) {
    const r = await fetchPage(p);
    todo.push(...r.data);
  }
  return todo;
}

// Claves centralizadas: evita strings sueltos y facilita invalidar.
export const qk = {
  estado: (periodo: string) => ['estado', periodo] as const,
  apartamentos: () => ['apartamentos'] as const,
  unidades: () => ['unidades'] as const,
  propietarios: () => ['propietarios'] as const,
  inquilinos: () => ['inquilinos'] as const,
  usuarios: () => ['usuarios'] as const,
};

// ── Queries ──
export function useEstado(periodo: string, responsableId?: string) {
  return useQuery({
    queryKey: [...qk.estado(periodo), responsableId ?? null],
    queryFn: () =>
      api.get<EstadoApto[]>(
        `/estado?periodo=${periodo}${responsableId ? `&responsable_id=${responsableId}` : ''}`,
      ),
  });
}

// Sesión actual (rol del usuario) — para gating de UI (p.ej. filtros admin).
export function useMe() {
  return useQuery<UsuarioActual>({ queryKey: ['me'], queryFn: () => auth.me() });
}

// Apartamentos: helper de fetch paginado (joins unidad+propietario+responsable),
// con filtro opcional por responsable.
const fetchApartamentos = (page: number, responsableId?: string) =>
  api.get<Paginado<Apartamento>>(
    `/apartamentos?page=${page}${responsableId ? `&responsable_id=${responsableId}` : ''}`,
  );

// ── Paginadas (listas) ──
export function useApartamentos(page = 1, responsableId?: string) {
  return useQuery({
    queryKey: [...qk.apartamentos(), 'pagina', page, responsableId ?? null],
    queryFn: () => fetchApartamentos(page, responsableId),
    placeholderData: keepPreviousData,
  });
}

export function useUnidades(page = 1) {
  return useQuery({
    queryKey: [...qk.unidades(), 'pagina', page],
    queryFn: () => unidadesApi.listar(page),
    placeholderData: keepPreviousData,
  });
}

export function usePropietarios(page = 1) {
  return useQuery({
    queryKey: [...qk.propietarios(), 'pagina', page],
    queryFn: () => propietariosApi.listar(page),
    placeholderData: keepPreviousData,
  });
}

// ── Todas (para selects/desplegables que necesitan el catálogo completo) ──
export function useUnidadesTodas() {
  return useQuery<Unidad[]>({
    queryKey: [...qk.unidades(), 'todas'],
    queryFn: () => traerTodo(unidadesApi.listar),
  });
}

export function usePropietariosTodas() {
  return useQuery<Propietario[]>({
    queryKey: [...qk.propietarios(), 'todas'],
    queryFn: () => traerTodo(propietariosApi.listar),
  });
}

export function useApartamentosTodos() {
  return useQuery<Apartamento[]>({
    queryKey: [...qk.apartamentos(), 'todas'],
    queryFn: () => traerTodo(fetchApartamentos),
  });
}

export function useInquilinos() {
  return useQuery({
    queryKey: qk.inquilinos(),
    queryFn: () => api.get<Inquilino[]>('/inquilinos'),
  });
}

// Lista paginada (página de la sección Usuarios).
export function useUsuarios(page = 1) {
  return useQuery({
    queryKey: [...qk.usuarios(), 'pagina', page],
    queryFn: () => usuariosApi.listar(page),
    placeholderData: keepPreviousData,
  });
}

// Todos los usuarios (para selects/filtros: responsable, etc.). enabled: la
// lista /usuarios es legible por admin/superadmin; un rol 'user' pasa
// enabled=false (evita 403).
export function useUsuariosTodas(enabled = true) {
  return useQuery<Usuario[]>({
    queryKey: [...qk.usuarios(), 'todas'],
    queryFn: () => traerTodo(usuariosApi.listar),
    enabled,
  });
}

// ── Mutations (invalidan la query relevante al terminar) ──
export function useCrearApartamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CrearApartamento) => api.post<Apartamento>('/apartamentos', dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.apartamentos() }),
  });
}

export function useActualizarApartamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; dto: ActualizarApartamento }) =>
      api.patch<Apartamento>(`/apartamentos/${v.id}`, v.dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.apartamentos() }),
  });
}

export function useEliminarApartamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/apartamentos/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.apartamentos() }),
  });
}

// Unidades: una mutation por acción, todas invalidan la lista.
export function useUnidadMutations() {
  const qc = useQueryClient();
  const inval = () => qc.invalidateQueries({ queryKey: qk.unidades() });
  return {
    crear: useMutation({ mutationFn: (dto: CrearUnidad) => unidadesApi.crear(dto), onSuccess: inval }),
    actualizar: useMutation({
      mutationFn: (v: { id: string; dto: ActualizarUnidad }) => unidadesApi.actualizar(v.id, v.dto),
      onSuccess: inval,
    }),
    desactivar: useMutation({ mutationFn: (id: string) => unidadesApi.desactivar(id), onSuccess: inval }),
  };
}

// Propietarios: misma estructura.
export function usePropietarioMutations() {
  const qc = useQueryClient();
  const inval = () => qc.invalidateQueries({ queryKey: qk.propietarios() });
  return {
    crear: useMutation({ mutationFn: (dto: CrearPropietario) => propietariosApi.crear(dto), onSuccess: inval }),
    actualizar: useMutation({
      mutationFn: (v: { id: string; dto: ActualizarPropietario }) =>
        propietariosApi.actualizar(v.id, v.dto),
      onSuccess: inval,
    }),
    desactivar: useMutation({ mutationFn: (id: string) => propietariosApi.desactivar(id), onSuccess: inval }),
  };
}

export function useActualizarInquilino() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; dto: ActualizarInquilino }) =>
      api.patch<Inquilino>(`/inquilinos/${v.id}`, v.dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.inquilinos() }),
  });
}

export function useCrearInquilino() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CrearInquilino) => api.post<Inquilino>('/inquilinos', dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.inquilinos() }),
  });
}

export function useEliminarInquilino() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/inquilinos/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.inquilinos() }),
  });
}

// Usuarios: una mutation por acción, todas invalidan la lista.
export function useUsuarioMutations() {
  const qc = useQueryClient();
  const inval = () => qc.invalidateQueries({ queryKey: qk.usuarios() });
  return {
    crear: useMutation({ mutationFn: usuariosApi.crear, onSuccess: inval }),
    actualizar: useMutation({
      mutationFn: (v: { id: string; dto: ActualizarUsuario }) =>
        usuariosApi.actualizar(v.id, v.dto),
      onSuccess: inval,
    }),
    desactivar: useMutation({ mutationFn: usuariosApi.desactivar, onSuccess: inval }),
  };
}
