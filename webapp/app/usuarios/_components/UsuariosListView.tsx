'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { PlusIcon } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { ROL_LABEL, type Rol, type Usuario } from '@/lib/api';
import { useUsuarios, useUsuarioMutations } from '@/lib/queries';
import { DataTable, Pagination } from '@/app/components/ui';

const fmtFecha = (s: string | null) =>
  s ? new Date(s).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

export function UsuariosListView() {
  const [page, setPage] = useState(1);
  const { data: pagina, isLoading, error } = useUsuarios(page);
  const usuarios = pagina?.data ?? [];
  const { actualizar, desactivar } = useUsuarioMutations();

  const desactivarUsuario = (u: Usuario) => {
    if (!confirm(`¿Desactivar a ${u.nombre_completo}? No se borra, queda inactivo.`)) return;
    desactivar.mutate(u.id, {
      onSuccess: () => toast.success('Usuario desactivado'),
      onError: (err) => toast.error((err as Error).message),
    });
  };
  const reactivarUsuario = (u: Usuario) =>
    actualizar.mutate(
      { id: u.id, dto: { estado: true } },
      {
        onSuccess: () => toast.success('Usuario reactivado'),
        onError: (err) => toast.error((err as Error).message),
      },
    );

  const columns = useMemo<ColumnDef<Usuario>[]>(
    () => [
      {
        accessorKey: 'nombre_completo',
        header: 'Nombre',
        cell: (c) => <span className="font-medium">{c.getValue<string>()}</span>,
      },
      {
        id: 'identidad',
        header: 'Usuario / Email',
        accessorFn: (r) => r.usuario,
        cell: (c) => (
          <div>
            <div>{c.row.original.usuario}</div>
            <div className="text-xs text-slate-500">{c.row.original.email}</div>
          </div>
        ),
      },
      {
        accessorKey: 'rol',
        header: 'Rol',
        cell: (c) => (
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
            {ROL_LABEL[c.getValue<Rol>()]}
          </span>
        ),
      },
      {
        accessorKey: 'estado',
        header: 'Estado',
        cell: (c) =>
          c.getValue<boolean>() ? (
            <span className="text-xs font-medium text-green-700">● Activo</span>
          ) : (
            <span className="text-xs font-medium text-slate-400">● Inactivo</span>
          ),
      },
      {
        accessorKey: 'ultimo_login',
        header: 'Último login',
        cell: (c) => <span className="text-xs">{fmtFecha(c.getValue<string | null>())}</span>,
      },
      {
        id: 'acciones',
        header: '',
        enableSorting: false,
        cell: (c) => {
          const u = c.row.original;
          return (
            <div className="flex justify-end gap-3 text-xs font-medium">
              <Link href={`/usuarios/${u.id}/editar`} className="text-brand-600 hover:underline">
                Editar
              </Link>
              {u.estado ? (
                <button onClick={() => desactivarUsuario(u)} className="text-red-600 hover:underline">
                  Desactivar
                </button>
              ) : (
                <button onClick={() => reactivarUsuario(u)} className="text-green-600 hover:underline">
                  Reactivar
                </button>
              )}
            </div>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-sm text-slate-500">Quiénes pueden ingresar al sistema</p>
        </div>
        <Link
          href="/usuarios/nuevo"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          <PlusIcon size={16} weight="bold" /> Nuevo usuario
        </Link>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{(error as Error).message}</p>
      )}

      <DataTable
        columns={columns}
        data={usuarios}
        loading={isLoading}
        emptyMsg="Sin usuarios."
        mobileCard={(u) => (
          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-base font-semibold text-slate-900">{u.nombre_completo}</p>
                <p className="text-sm text-slate-500">{u.usuario}</p>
                <p className="text-xs text-slate-400">{u.email}</p>
              </div>
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                {ROL_LABEL[u.rol]}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-2">
              {u.estado ? (
                <span className="text-xs font-medium text-green-700">● Activo</span>
              ) : (
                <span className="text-xs font-medium text-slate-400">● Inactivo</span>
              )}
              <div className="flex gap-3 text-xs font-medium">
                <Link href={`/usuarios/${u.id}/editar`} className="text-brand-600">
                  Editar
                </Link>
                {u.estado ? (
                  <button onClick={() => desactivarUsuario(u)} className="text-red-600">
                    Desactivar
                  </button>
                ) : (
                  <button onClick={() => reactivarUsuario(u)} className="text-green-600">
                    Reactivar
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      />

      {pagina && (
        <Pagination
          page={pagina.page}
          totalPages={pagina.total_pages}
          total={pagina.total}
          pageSize={pagina.page_size}
          onChange={setPage}
        />
      )}
    </div>
  );
}
