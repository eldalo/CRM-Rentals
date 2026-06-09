'use client';

import { useState, type ReactNode } from 'react';
import { Popover } from 'radix-ui';
import { CalendarBlankIcon, CaretDownIcon, CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';

const MESES_LARGO = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const MESES_CORTO = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

interface MonthPickerProps {
  /** Valor en formato 'YYYY-MM'. */
  value: string;
  onChange: (value: string) => void;
  label?: string;
  /** Icono antes del texto del label. */
  icon?: ReactNode;
}

/** Parsea 'YYYY-MM' → { year, month(0-11) }. Cae al mes actual si es inválido. */
function parse(value: string): { year: number; month: number } {
  const [y, m] = value.split('-').map(Number);
  if (y && m && m >= 1 && m <= 12) return { year: y, month: m - 1 };
  // Sin Date.now disponible en SSR-safe? Usamos new Date solo en cliente ('use client').
  const hoy = new Date();
  return { year: hoy.getFullYear(), month: hoy.getMonth() };
}

/**
 * Selector de mes/año sobre Radix Popover. Reemplaza al <input type="month">
 * nativo: misma caja que Input/Select, navegación de año y grilla de 12 meses.
 * Valor controlado en formato 'YYYY-MM'.
 */
export function MonthPicker({ value, onChange, label, icon }: MonthPickerProps) {
  const sel = parse(value);
  const [abierto, setAbierto] = useState(false);
  // Año en vista (se puede navegar sin seleccionar todavía).
  const [anioVista, setAnioVista] = useState(sel.year);

  const elegir = (mes: number) => {
    onChange(`${anioVista}-${String(mes + 1).padStart(2, '0')}`);
    setAbierto(false);
  };

  return (
    <div className="space-y-1">
      {label && (
        <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
          {icon && <span className="text-slate-400">{icon}</span>}
          {label}
        </label>
      )}
      <Popover.Root
        open={abierto}
        onOpenChange={(o) => {
          setAbierto(o);
          if (o) setAnioVista(sel.year); // al abrir, parte del año seleccionado
        }}
      >
        <Popover.Trigger asChild>
          <button
            type="button"
            className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          >
            <span className="flex items-center gap-2">
              <CalendarBlankIcon size={16} className="text-slate-400" />
              {MESES_LARGO[sel.month]} {sel.year}
            </span>
            <CaretDownIcon size={16} weight="bold" className="text-slate-400" />
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            sideOffset={6}
            align="start"
            className="z-50 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
          >
            {/* Navegación de año */}
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setAnioVista((a) => a - 1)}
                className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100"
                aria-label="Año anterior"
              >
                <CaretLeftIcon size={16} weight="bold" />
              </button>
              <span className="text-sm font-semibold tabular-nums">{anioVista}</span>
              <button
                type="button"
                onClick={() => setAnioVista((a) => a + 1)}
                className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100"
                aria-label="Año siguiente"
              >
                <CaretRightIcon size={16} weight="bold" />
              </button>
            </div>

            {/* Grilla de 12 meses */}
            <div className="grid grid-cols-3 gap-1.5">
              {MESES_CORTO.map((m, i) => {
                const activo = i === sel.month && anioVista === sel.year;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => elegir(i)}
                    className={`cursor-pointer rounded-lg px-2 py-2 text-sm font-medium transition ${
                      activo
                        ? 'bg-brand-600 text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
