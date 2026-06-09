'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { PencilSimpleIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { type Unidad } from '@/lib/api';
import { useUnidades, useUnidadMutations } from '@/lib/queries';
import { DataTable, Pagination } from '@/app/components/ui';

export function UnidadesListView() {
  const [page, setPage] = useState(1);
  const { data: pagina, isLoading, error } = useUnidades(page);
  const items = pagina?.data ?? [];
  const { desactivar } = useUnidadMutations();

  const borrar = (id: string) => {
    if (!confirm('¿Eliminar unidad? Se desactiva (no se borra).')) return;
    desactivar.mutate(id, {
      onSuccess: () => toast.success('Unidad eliminada'),
      onError: (err) => toast.error((err as Error).message),
    });
  };

  const columns = useMemo<ColumnDef<Unidad>[]>(
    () => [
      {
        accessorKey: 'nombre',
        header: 'Nombre',
        cell: (c) => <span className="font-medium">{c.getValue<string>()}</span>,
      },
      { accessorKey: 'direccion', header: 'Dirección' },
      {
        accessorKey: 'nombre_administrador',
        header: 'Administrador',
        cell: (c) => c.getValue<string | null>() ?? '—',
      },
      {
        accessorKey: 'contacto_administrador',
        header: 'Contacto',
        cell: (c) => c.getValue<string | null>() ?? '—',
      },
      {
        id: 'acciones',
        header: '',
        enableSorting: false,
        cell: (c) => (
          <div className="flex justify-end gap-3">
            <Link
              href={`/unidades/${c.row.original.id}/editar`}
              className="text-brand-600 hover:text-brand-700"
              title="Editar"
            >
              <PencilSimpleIcon size={18} />
            </Link>
            <button onClick={() => borrar(c.row.original.id)} className="text-red-600 hover:text-red-700" title="Eliminar">
              <TrashIcon size={18} />
            </button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Unidades</h1>
          <p className="text-sm text-slate-500">Edificios y conjuntos</p>
        </div>
        <Link
          href="/unidades/nuevo"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          <PlusIcon size={16} weight="bold" /> Nueva
        </Link>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{(error as Error).message}</p>
      )}

      <DataTable
        columns={columns}
        data={items}
        loading={isLoading}
        emptyMsg="Sin unidades."
        mobileCard={(u) => (
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <Link href={`/unidades/${u.id}/editar`} className="min-w-0 flex-1">
              <span className="text-base font-semibold text-slate-900">{u.nombre}</span>
              <p className="mt-0.5 text-sm text-slate-500">{u.direccion}</p>
              {u.nombre_administrador && (
                <p className="mt-0.5 text-xs text-slate-400">
                  {u.nombre_administrador}
                  {u.contacto_administrador ? ` · ${u.contacto_administrador}` : ''}
                </p>
              )}
            </Link>
            <button onClick={() => borrar(u.id)} className="ml-3 text-red-600 hover:text-red-700" title="Eliminar">
              <TrashIcon size={20} />
            </button>
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
