'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { IdentificationBadgeIcon, PencilSimpleIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { ROL_LABEL, type Apartamento, fmtCOP } from '@/lib/api';
import { useApartamentos, useEliminarApartamento, useMe, useUsuariosTodas } from '@/lib/queries';
import { DataTable, Pagination, Select } from '@/app/components/ui';

export function ApartamentosListView() {
  const [page, setPage] = useState(1);
  const [responsableId, setResponsableId] = useState('');
  const { data: pagina, isLoading, error } = useApartamentos(page, responsableId || undefined);
  const items = pagina?.data ?? [];
  const eliminar = useEliminarApartamento();

  // El filtro por responsable solo aplica a admin/super_admin (el asesor ya ve
  // únicamente los suyos). useUsuarios requiere ese rol, así que se hace gating.
  const { data: me } = useMe();
  const esAdmin = !!me && me.rol !== 'asesor';
  const { data: usuarios = [] } = useUsuariosTodas(esAdmin);
  const responsables = usuarios.filter((u) => u.estado && (u.rol === 'asesor' || u.rol === 'admin'));

  const filtrarPor = (id: string) => {
    setResponsableId(id);
    setPage(1); // al cambiar filtro, vuelve a la primera página
  };

  const borrar = (id: string) => {
    if (!confirm('¿Eliminar apartamento? Se desactiva (no se borra).')) return;
    eliminar.mutate(id, {
      onSuccess: () => toast.success('Apartamento eliminado'),
      onError: (err) => toast.error((err as Error).message),
    });
  };

  const columns = useMemo<ColumnDef<Apartamento>[]>(
    () => [
      {
        id: 'unidad',
        header: 'Unidad',
        accessorFn: (a) => a.unidades?.nombre ?? '',
        cell: (c) => <span className="font-medium">{c.getValue<string>() || '—'}</span>,
      },
      {
        accessorKey: 'numero',
        header: 'N.º apto',
        cell: (c) => <span className="font-medium">{c.getValue<string>()}</span>,
      },
      {
        id: 'propietario',
        header: 'Propietario',
        accessorFn: (a) => a.propietarios?.nombre_completo ?? '',
        cell: (c) => c.getValue<string>() || '—',
      },
      {
        id: 'responsable',
        header: 'Responsable',
        accessorFn: (a) => a.responsable?.nombre_completo ?? '',
        cell: (c) => c.getValue<string>() || '—',
      },
      { accessorKey: 'dia_corte', header: 'Día corte' },
      { accessorKey: 'canon', header: 'Canon', cell: (c) => fmtCOP(c.getValue<number>()) },
      {
        id: 'acciones',
        header: '',
        enableSorting: false,
        cell: (c) => (
          <div className="flex justify-end gap-3">
            <Link
              href={`/apartamentos/${c.row.original.id}/editar`}
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
          <h1 className="text-2xl font-bold">Apartamentos</h1>
          <p className="text-sm text-slate-500">Unidad, propietario y canon</p>
        </div>
        <Link
          href="/apartamentos/nuevo"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          <PlusIcon size={16} weight="bold" /> Nuevo
        </Link>
      </div>

      {esAdmin && (
        <div className="w-full sm:max-w-xs">
          <Select
            label="Filtrar por responsable"
            icon={<IdentificationBadgeIcon size={16} />}
            value={responsableId}
            onChange={filtrarPor}
          >
            <option value="">Todos los responsables</option>
            {responsables.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre_completo} ({ROL_LABEL[u.rol]})
              </option>
            ))}
          </Select>
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{(error as Error).message}</p>
      )}

      <DataTable
        columns={columns}
        data={items}
        loading={isLoading}
        emptyMsg="Sin apartamentos."
        mobileCard={(a) => (
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <Link href={`/apartamentos/${a.id}/editar`} className="min-w-0 flex-1">
              <span className="text-base font-semibold text-slate-900">
                {a.unidades?.nombre ? `${a.unidades.nombre} ` : ''}
                {a.numero}
              </span>
              <p className="mt-0.5 text-sm text-slate-500">
                {a.propietarios?.nombre_completo ?? 'Sin propietario'}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                corte día {a.dia_corte} · {fmtCOP(a.canon)}
              </p>
            </Link>
            <button onClick={() => borrar(a.id)} className="ml-3 text-red-600 hover:text-red-700" title="Eliminar">
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
