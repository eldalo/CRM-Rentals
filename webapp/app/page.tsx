'use client';

import { useMemo, useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { IdentificationBadgeIcon } from '@phosphor-icons/react';
import { ROL_LABEL, type EstadoApto, fmtCOP, periodoActual, type Semaforo } from '@/lib/api';
import { useEstado, useMe, useUsuariosTodas } from '@/lib/queries';
import { DataTable, MonthPicker, Select } from '@/app/components/ui';

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
const etiqueta: Record<Semaforo, string> = {
  pagado: 'Pagado',
  pendiente: 'Pendiente',
  vencido: 'Vencido',
};

function Badge({ s }: { s: Semaforo }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${badge[s]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot[s]}`} />
      {etiqueta[s]}
    </span>
  );
}

function Kpi({ titulo, valor, tono }: { titulo: string; valor: string; tono: string }) {
  const tonos: Record<string, string> = {
    brand: 'text-brand-600',
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

export default function Dashboard() {
  const [periodo, setPeriodo] = useState(periodoActual());
  const [responsableId, setResponsableId] = useState('');
  const { data: filas = [], isLoading, error } = useEstado(periodo, responsableId || undefined);

  // Filtro por responsable: solo admin/super_admin (el asesor ya ve solo lo suyo).
  const { data: me } = useMe();
  const esAdmin = !!me && me.rol !== 'asesor';
  const { data: usuarios = [] } = useUsuariosTodas(esAdmin);
  const responsables = usuarios.filter((u) => u.estado && (u.rol === 'asesor' || u.rol === 'admin'));

  const resumen = useMemo(
    () => ({
      pagado: filas.filter((f) => f.semaforo === 'pagado').length,
      pendiente: filas.filter((f) => f.semaforo === 'pendiente').length,
      vencido: filas.filter((f) => f.semaforo === 'vencido').length,
      recaudo: filas
        .filter((f) => f.semaforo === 'pagado')
        .reduce((s, f) => s + (f.monto ?? f.canon), 0),
    }),
    [filas],
  );

  const columns = useMemo<ColumnDef<EstadoApto>[]>(
    () => [
      {
        accessorKey: 'unidad',
        header: 'Unidad',
        cell: (c) => <span className="font-medium">{c.getValue<string>()}</span>,
      },
      { accessorKey: 'dia_corte', header: 'Corte' },
      { accessorKey: 'fecha_limite', header: 'Límite' },
      {
        id: 'monto',
        header: 'Monto',
        accessorFn: (r) => r.monto ?? r.canon,
        cell: (c) => <span className="tabular-nums">{fmtCOP(c.getValue<number>())}</span>,
      },
      {
        accessorKey: 'semaforo',
        header: 'Estado',
        cell: (c) => <Badge s={c.getValue<Semaforo>()} />,
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Estado del mes</h1>
          <p className="text-sm text-slate-500">Semáforo de pagos por unidad</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          {esAdmin && (
            <div className="w-56">
              <Select
                label="Responsable"
                icon={<IdentificationBadgeIcon size={16} />}
                value={responsableId}
                onChange={setResponsableId}
              >
                <option value="">Todos</option>
                {responsables.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nombre_completo} ({ROL_LABEL[u.rol]})
                  </option>
                ))}
              </Select>
            </div>
          )}
          <div className="w-48">
            <MonthPicker value={periodo} onChange={setPeriodo} />
          </div>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi titulo="Recaudo" valor={fmtCOP(resumen.recaudo)} tono="brand" />
        <Kpi titulo="Pagados" valor={`${resumen.pagado}`} tono="emerald" />
        <Kpi titulo="Pendientes" valor={`${resumen.pendiente}`} tono="amber" />
        <Kpi titulo="Vencidos" valor={`${resumen.vencido}`} tono="rose" />
      </section>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {(error as Error).message}
        </p>
      )}

      <DataTable
        columns={columns}
        data={filas}
        loading={isLoading}
        searchable
        searchPlaceholder="Buscar unidad…"
        emptyMsg="Sin apartamentos para este periodo."
        mobileCard={(f) => (
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-slate-900">{f.unidad}</span>
                <Badge s={f.semaforo} />
              </div>
              <p className="mt-0.5 text-sm text-slate-500">
                corte {f.dia_corte} · límite {f.fecha_limite}
              </p>
            </div>
            <p className="font-semibold tabular-nums text-slate-900">{fmtCOP(f.monto ?? f.canon)}</p>
          </div>
        )}
      />
    </div>
  );
}
