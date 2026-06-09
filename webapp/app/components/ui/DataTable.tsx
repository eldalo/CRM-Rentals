'use client';

import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { CaretDownIcon, CaretUpIcon, MagnifyingGlassIcon } from '@phosphor-icons/react';
import { type ReactNode, useState } from 'react';
import { Loading } from './Loading';

interface DataTableProps<T> {
  columns: ColumnDef<T, any>[];
  data: T[];
  loading?: boolean;
  emptyMsg?: string;
  /** Muestra buscador global sobre la tabla. */
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Slot a la derecha del buscador (p.ej. botón "+ Nuevo"). */
  toolbarRight?: ReactNode;
  /**
   * Render de cada fila como card en móvil (<md). Si se provee, en móvil se
   * muestran cards en vez de la tabla (patrón power-table↔mobile del prototipo).
   */
  mobileCard?: (row: T) => ReactNode;
}

/**
 * Tabla reutilizable (TanStack Table). Escritorio = tabla densa con orden por
 * columna; móvil = cards (si se pasa mobileCard). Buscador global opcional.
 */
export function DataTable<T>({
  columns,
  data,
  loading,
  emptyMsg = 'Sin datos.',
  searchable,
  searchPlaceholder = 'Buscar…',
  toolbarRight,
  mobileCard,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const rows = table.getRowModel().rows;
  const vacio = !loading && rows.length === 0;

  return (
    <div className="space-y-4">
      {(searchable || toolbarRight) && (
        <div className="flex flex-wrap items-center gap-2">
          {searchable && (
            <div className="relative flex-1 md:max-w-xs">
              <MagnifyingGlassIcon
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full cursor-text rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>
          )}
          {toolbarRight && <div className="ml-auto">{toolbarRight}</div>}
        </div>
      )}

      {/* ── Tabla (escritorio; si hay mobileCard se oculta en móvil) ── */}
      <div
        className={`rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-900/5 ${
          mobileCard ? 'hidden overflow-hidden md:block' : 'overflow-x-auto'
        }`}
      >
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50/80 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => {
                  const sortable = header.column.getCanSort();
                  const dir = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      onClick={sortable ? header.column.getToggleSortingHandler() : undefined}
                      className={`px-4 py-3.5 font-semibold ${
                        sortable ? 'cursor-pointer select-none transition hover:text-brand-600' : ''
                      } ${dir ? 'text-brand-600' : ''}`}
                    >
                      <span className="inline-flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {dir === 'asc' && <CaretUpIcon size={12} weight="bold" />}
                        {dir === 'desc' && <CaretDownIcon size={12} weight="bold" />}
                      </span>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10">
                  <Loading />
                </td>
              </tr>
            ) : vacio ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-slate-400">
                  {emptyMsg}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-brand-50/50">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3.5 text-slate-700">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Móvil: cards (solo si se provee mobileCard) ── */}
      {mobileCard && (
        <div className="space-y-3 md:hidden">
          {loading ? (
            <Loading full />
          ) : vacio ? (
            <p className="py-8 text-center text-sm text-slate-400">{emptyMsg}</p>
          ) : (
            rows.map((row) => <div key={row.id}>{mobileCard(row.original)}</div>)
          )}
        </div>
      )}
    </div>
  );
}
