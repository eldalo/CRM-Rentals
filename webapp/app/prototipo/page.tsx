'use client';

import { useMemo, useState } from 'react';
import {
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  CaretDownIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  ExportIcon,
  FunnelIcon,
  GearIcon,
  HouseIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  UsersIcon,
} from '@phosphor-icons/react';

// ── Datos mock (el prototipo no usa backend) ──
type Semaforo = 'pagado' | 'pendiente' | 'vencido';
interface Fila {
  id: string;
  unidad: string;
  inquilino: string;
  canon: number;
  dia_corte: number;
  semaforo: Semaforo;
}

const MOCK: Fila[] = [
  { id: '1', unidad: 'A-101', inquilino: 'Ana Gómez', canon: 1500000, dia_corte: 15, semaforo: 'pagado' },
  { id: '2', unidad: 'A-102', inquilino: 'Beto Ramírez', canon: 1800000, dia_corte: 30, semaforo: 'vencido' },
  { id: '3', unidad: 'A-103', inquilino: 'Carla Díaz', canon: 2000000, dia_corte: 5, semaforo: 'pendiente' },
  { id: '4', unidad: 'B-201', inquilino: 'Daniel Soto', canon: 1650000, dia_corte: 10, semaforo: 'pagado' },
  { id: '5', unidad: 'B-202', inquilino: 'Elena Pardo', canon: 1750000, dia_corte: 20, semaforo: 'pagado' },
  { id: '6', unidad: 'B-203', inquilino: 'Fabio León', canon: 1900000, dia_corte: 28, semaforo: 'vencido' },
  { id: '7', unidad: 'C-301', inquilino: 'Gloria Ruiz', canon: 2200000, dia_corte: 1, semaforo: 'pendiente' },
  { id: '8', unidad: 'C-302', inquilino: 'Hugo Marín', canon: 1450000, dia_corte: 15, semaforo: 'pagado' },
];

const fmtCOP = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

const badge: Record<Semaforo, string> = {
  pagado: 'bg-emerald-100 text-emerald-700',
  pendiente: 'bg-amber-100 text-amber-700',
  vencido: 'bg-rose-100 text-rose-700',
};
const dot: Record<Semaforo, string> = {
  pagado: 'bg-emerald-500',
  pendiente: 'bg-amber-500',
  vencido: 'bg-rose-500',
};
const label: Record<Semaforo, string> = { pagado: 'Pagado', pendiente: 'Pendiente', vencido: 'Vencido' };

export default function PrototipoPage() {
  const [filtro, setFiltro] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const columns = useMemo<ColumnDef<Fila>[]>(
    () => [
      {
        id: 'sel',
        enableSorting: false,
        header: ({ table }) => (
          <input
            type="checkbox"
            className="accent-brand-600"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            className="accent-brand-600"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
          />
        ),
      },
      {
        accessorKey: 'unidad',
        header: 'Unidad',
        cell: (c) => <span className="font-medium text-slate-900">{c.getValue<string>()}</span>,
      },
      { accessorKey: 'inquilino', header: 'Inquilino' },
      { accessorKey: 'dia_corte', header: 'Corte' },
      {
        accessorKey: 'canon',
        header: 'Canon',
        cell: (c) => <span className="tabular-nums">{fmtCOP(c.getValue<number>())}</span>,
      },
      {
        accessorKey: 'semaforo',
        header: 'Estado',
        cell: (c) => {
          const s = c.getValue<Semaforo>();
          return (
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${badge[s]}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${dot[s]}`} />
              {label[s]}
            </span>
          );
        },
      },
    ],
    [],
  );

  const table = useReactTable({
    data: MOCK,
    columns,
    state: { sorting, rowSelection, globalFilter: filtro },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setFiltro,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const seleccionados = table.getSelectedRowModel().rows.length;
  const visibles = table.getRowModel().rows;

  const resumen = {
    pagado: MOCK.filter((f) => f.semaforo === 'pagado').length,
    pendiente: MOCK.filter((f) => f.semaforo === 'pendiente').length,
    vencido: MOCK.filter((f) => f.semaforo === 'vencido').length,
    recaudo: MOCK.filter((f) => f.semaforo === 'pagado').reduce((s, f) => s + f.canon, 0),
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-8">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-8">
          <div className="flex items-center gap-2">
            <span className="font-bold">CRM - Activos GI</span>
            <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
              prototipo
            </span>
          </div>
          <button className="hidden rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700 md:inline-flex md:items-center md:gap-1.5">
            <PlusIcon size={16} weight="bold" /> Registrar pago
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-5 px-4 py-5 md:px-8">
        {/* KPIs */}
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Kpi titulo="Recaudo" valor={fmtCOP(resumen.recaudo)} tono="blue" />
          <Kpi titulo="Pagados" valor={`${resumen.pagado}`} tono="emerald" />
          <Kpi titulo="Pendientes" valor={`${resumen.pendiente}`} tono="amber" />
          <Kpi titulo="Vencidos" valor={`${resumen.vencido}`} tono="rose" />
        </section>

        {/* Toolbar power-table */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 md:max-w-xs">
            <MagnifyingGlassIcon
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              placeholder="Buscar unidad o inquilino…"
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            <FunnelIcon size={16} /> Filtros
          </button>
        </div>

        {/* Barra de acciones masivas (power-table) */}
        {seleccionados > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm">
            <span className="font-medium text-brand-800">{seleccionados} seleccionado(s)</span>
            <div className="flex gap-2">
              <button className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 font-medium text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-50">
                <CheckCircleIcon size={16} /> Marcar pagado
              </button>
              <button className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 font-medium text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50">
                <ExportIcon size={16} /> Exportar
              </button>
            </div>
          </div>
        )}

        {/* ── DESKTOP: power-table densa ── */}
        <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((h) => {
                    const sortable = h.column.getCanSort();
                    const dir = h.column.getIsSorted();
                    return (
                      <th
                        key={h.id}
                        onClick={sortable ? h.column.getToggleSortingHandler() : undefined}
                        className={`px-4 py-2.5 font-medium ${sortable ? 'cursor-pointer select-none hover:text-slate-700' : ''}`}
                      >
                        <span className="inline-flex items-center gap-1">
                          {flexRender(h.column.columnDef.header, h.getContext())}
                          {dir === 'asc' && '▲'}
                          {dir === 'desc' && '▼'}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibles.map((row) => (
                <tr
                  key={row.id}
                  className={`hover:bg-slate-50/70 ${row.getIsSelected() ? 'bg-brand-50/40' : ''}`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-2.5">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── MÓVIL: lista de cards grandes ── */}
        <div className="space-y-3 md:hidden">
          {visibles.map((row) => {
            const f = row.original;
            return (
              <div
                key={f.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm active:bg-slate-50"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold text-slate-900">{f.unidad}</span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${badge[f.semaforo]}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${dot[f.semaforo]}`} />
                      {label[f.semaforo]}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-slate-500">{f.inquilino}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold tabular-nums text-slate-900">{fmtCOP(f.canon)}</p>
                  <p className="text-xs text-slate-400">corte {f.dia_corte}</p>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* ── MÓVIL: FAB + bottom-nav ── */}
      <button className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg shadow-brand-300 active:scale-95 md:hidden">
        <PlusIcon size={26} weight="bold" />
      </button>

      <nav className="fixed bottom-0 left-0 right-0 z-20 flex border-t border-slate-200 bg-white md:hidden">
        {[
          { icon: HouseIcon, label: 'Inicio', activo: true },
          { icon: CurrencyDollarIcon, label: 'Pagos' },
          { icon: UsersIcon, label: 'Inquilinos' },
          { icon: GearIcon, label: 'Ajustes' },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.label}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${
                t.activo ? 'text-brand-600' : 'text-slate-400'
              }`}
            >
              <Icon size={22} weight={t.activo ? 'fill' : 'regular'} />
              {t.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function Kpi({ titulo, valor, tono }: { titulo: string; valor: string; tono: string }) {
  const tonos: Record<string, string> = {
    blue: 'text-brand-600',
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
    rose: 'text-rose-600',
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{titulo}</p>
      <p className={`mt-1 text-xl font-bold tabular-nums ${tonos[tono]}`}>{valor}</p>
    </div>
  );
}
