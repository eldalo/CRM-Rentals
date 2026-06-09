'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { PencilSimpleIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { aptoLabel, type Inquilino } from '@/lib/api';
import { useInquilinos, useEliminarInquilino } from '@/lib/queries';
import { DataTable } from '@/app/components/ui';

export function InquilinosListView() {
  const { data: items = [], isLoading, error } = useInquilinos();
  const eliminar = useEliminarInquilino();

  const borrar = (id: string) => {
    if (!confirm('¿Eliminar inquilino?')) return;
    eliminar.mutate(id, {
      onSuccess: () => toast.success('Inquilino eliminado'),
      onError: (err) => toast.error((err as Error).message),
    });
  };

  const columns = useMemo<ColumnDef<Inquilino>[]>(
    () => [
      {
        accessorKey: 'nombre_completo',
        header: 'Nombre',
        cell: (c) => <span className="font-medium">{c.getValue<string>()}</span>,
      },
      {
        id: 'apartamento',
        header: 'Apartamento',
        accessorFn: (r) => (r.apartamentos ? aptoLabel(r.apartamentos) : '—'),
      },
      { accessorKey: 'cedula', header: 'Cédula', cell: (c) => c.getValue<string | null>() ?? '—' },
      { accessorKey: 'celular', header: 'Celular', cell: (c) => c.getValue<string | null>() ?? '—' },
      { accessorKey: 'email', header: 'Email', cell: (c) => c.getValue<string | null>() ?? '—' },
      {
        id: 'acciones',
        header: '',
        enableSorting: false,
        cell: (c) => (
          <div className="flex justify-end gap-3">
            <Link
              href={`/inquilinos/${c.row.original.id}/editar`}
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
          <h1 className="text-2xl font-bold">Inquilinos</h1>
          <p className="text-sm text-slate-500">Registro de inquilinos</p>
        </div>
        <Link
          href="/inquilinos/nuevo"
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
        searchable
        searchPlaceholder="Buscar nombre, cédula o celular…"
        emptyMsg="Sin inquilinos."
        mobileCard={(i) => (
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <Link href={`/inquilinos/${i.id}/editar`} className="min-w-0 flex-1">
              <p className="text-base font-semibold text-slate-900">{i.nombre_completo}</p>
              {i.apartamentos && (
                <p className="mt-0.5 text-sm text-brand-700">{aptoLabel(i.apartamentos)}</p>
              )}
              <p className="mt-0.5 text-sm text-slate-500">
                {i.celular ?? '—'}
                {i.cedula ? ` · CC ${i.cedula}` : ''}
              </p>
            </Link>
            <button onClick={() => borrar(i.id)} className="ml-3 text-red-600 hover:text-red-700" title="Eliminar">
              <TrashIcon size={20} />
            </button>
          </div>
        )}
      />
    </div>
  );
}
