'use client';

import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}

/**
 * Controles de paginación: rango mostrado + anterior/siguiente.
 * Se oculta solo si hay una única página y nada que paginar.
 */
export function Pagination({ page, totalPages, total, pageSize, onChange }: PaginationProps) {
  if (total === 0) return null;
  const desde = (page - 1) * pageSize + 1;
  const hasta = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between gap-3 text-sm text-slate-500">
      <span>
        Mostrando <span className="font-medium text-slate-700">{desde}</span>–
        <span className="font-medium text-slate-700">{hasta}</span> de{' '}
        <span className="font-medium text-slate-700">{total}</span>
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 font-medium transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <CaretLeftIcon size={14} weight="bold" /> Anterior
        </button>
        <span className="tabular-nums">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 font-medium transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Siguiente <CaretRightIcon size={14} weight="bold" />
        </button>
      </div>
    </div>
  );
}
