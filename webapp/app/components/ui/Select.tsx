'use client';

import { Children, isValidElement, useState, type ReactNode } from 'react';
import { Popover } from 'radix-ui';
import { CaretDownIcon, CheckIcon } from '@phosphor-icons/react';

export interface SelectProps {
  label?: string;
  error?: string;
  /** Icono antes del texto del label. */
  icon?: ReactNode;
  value: string;
  /** Recibe el value seleccionado (string), no un evento. */
  onChange: (value: string) => void;
  /** Opciones como <option value=…>texto</option> (se parsean). */
  children?: ReactNode;
  disabled?: boolean;
  /** Aceptado por compatibilidad; la validación real la hace el backend. */
  required?: boolean;
}

interface Opcion {
  value: string;
  label: string;
  disabled: boolean;
}

/** Extrae el texto plano de los children de un <option>. */
function textoDe(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textoDe).join('');
  return '';
}

/**
 * Select con apariencia de Input y lista en panel blanco (Radix Popover),
 * en vez del <select> nativo. Mantiene la API de <option> como children:
 * cada <option value>texto</option> se convierte en un ítem.
 * Las opciones `disabled` (p.ej. placeholder "Selecciona…") no se listan;
 * su texto se usa como placeholder cuando no hay selección.
 */
export function Select({ label, error, icon, value, onChange, children, disabled }: SelectProps) {
  const [abierto, setAbierto] = useState(false);

  const opciones: Opcion[] = Children.toArray(children)
    .filter(isValidElement)
    .map((c) => {
      const props = (c as { props: { value?: unknown; children?: ReactNode; disabled?: boolean } }).props;
      return {
        value: String(props.value ?? ''),
        label: textoDe(props.children),
        disabled: !!props.disabled,
      };
    });

  const sel = opciones.find((o) => o.value === String(value));
  const placeholder = opciones.find((o) => o.disabled)?.label ?? 'Selecciona…';
  const vacio = !sel || sel.disabled;
  const triggerText = vacio ? sel?.label ?? placeholder : sel!.label;
  const seleccionables = opciones.filter((o) => !o.disabled);

  return (
    <div className="space-y-1">
      {label && (
        <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
          {icon && <span className="text-slate-400">{icon}</span>}
          {label}
        </label>
      )}
      <Popover.Root open={abierto} onOpenChange={setAbierto}>
        <Popover.Trigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2 text-left text-sm outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${
              error
                ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                : 'border-slate-300 focus:border-brand-500 focus:ring-brand-100'
            }`}
          >
            <span className={`truncate ${vacio ? 'text-slate-400' : 'text-slate-900'}`}>{triggerText}</span>
            <CaretDownIcon size={16} weight="bold" className="shrink-0 text-slate-400" />
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            sideOffset={6}
            align="start"
            className="z-50 max-h-72 w-[var(--radix-popover-trigger-width)] overflow-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
          >
            {seleccionables.length === 0 ? (
              <p className="px-3 py-2 text-sm text-slate-400">Sin opciones</p>
            ) : (
              seleccionables.map((o) => {
                const activo = o.value === String(value);
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => {
                      onChange(o.value);
                      setAbierto(false);
                    }}
                    className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                      activo ? 'bg-brand-50 font-medium text-brand-700' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="truncate">{o.label}</span>
                    {activo && <CheckIcon size={16} weight="bold" className="shrink-0 text-brand-600" />}
                  </button>
                );
              })
            )}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
