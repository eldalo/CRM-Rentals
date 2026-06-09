'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { PencilSimpleIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { type Propietario } from '@/lib/api';
import { usePropietarios, usePropietarioMutations } from '@/lib/queries';
import { DataTable, Pagination } from '@/app/components/ui';

export function PropietariosListView() {
  const [page, setPage] = useState(1);
  const { data: pagina, isLoading, error } = usePropietarios(page);
  const items = pagina?.data ?? [];
  const { desactivar } = usePropietarioMutations();

  const borrar = (id: string) => {
    if (!confirm('¿Eliminar propietario? Se desactiva (no se borra).')) return;
    desactivar.mutate(id, {
      onSuccess: () => toast.success('Propietario eliminado'),
      onError: (err) => toast.error((err as Error).message),
    });
  };

  const columns = useMemo<ColumnDef<Propietario>[]>(
    () => [
      {
        accessorKey: 'nombre_completo',
        header: 'Nombre completo',
        cell: (c) => <span className="font-medium">{c.getValue<string>()}</span>,
      },
      { accessorKey: 'celular', header: 'Celular', cell: (c) => c.getValue<string | null>() ?? '—' },
      { accessorKey: 'email', header: 'Email', cell: (c) => c.getValue<string | null>() ?? '—' },
      {
        id: 'acciones',
        header: '',
        enableSorting: false,
        cell: (c) => (
          <div className="flex justify-end gap-3">
            <Link
              href={`/propietarios/${c.row.original.id}/editar`}
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
          <h1 className="text-2xl font-bold">Propietarios</h1>
          <p className="text-sm text-slate-500">Dueños de los apartamentos</p>
        </div>
        <Link
          href="/propietarios/nuevo"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          <PlusIcon size={16} weight="bold" /> Nuevo
        </Link>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{(error as Error).message}</p>
      )}

      <DataTable
        columns={columns}
        data={items}
        loading={isLoading}
        emptyMsg="Sin propietarios."
        mobileCard={(p) => (
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <Link href={`/propietarios/${p.id}/editar`} className="min-w-0 flex-1">
              <span className="text-base font-semibold text-slate-900">{p.nombre_completo}</span>
              <p className="mt-0.5 text-sm text-slate-500">
                {p.celular ?? '—'}
                {p.email ? ` · ${p.email}` : ''}
              </p>
            </Link>
            <button onClick={() => borrar(p.id)} className="ml-3 text-red-600 hover:text-red-700" title="Eliminar">
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
