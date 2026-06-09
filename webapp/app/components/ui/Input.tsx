import { forwardRef, type ChangeEvent, type InputHTMLAttributes, type ReactNode } from 'react';

export type FormatoInput = 'celular' | 'moneda';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  /** Icono mostrado antes del texto del label. */
  icon?: ReactNode;
  /**
   * Formato especial:
   *  - 'celular': solo dígitos, mínimo 10 (validación nativa).
   *  - 'moneda': muestra pesos colombianos (1.500.000); el value sigue siendo
   *    el número en crudo (string de dígitos) que recibe onChange.
   */
  formato?: FormatoInput;
}

// Tipos donde el usuario escribe → cursor de texto. El resto (date, month,
// file, checkbox, etc.) → cursor pointer.
const TIPOS_TEXTO = ['text', 'password', 'number', 'email', 'tel', 'search', 'url'];

const soloDigitos = (s: string) => s.replace(/\D/g, '');
/** Miles con punto (es-CO): "1500000" → "1.500.000". */
const fmtMiles = (digits: string) => (digits ? Number(digits).toLocaleString('es-CO') : '');

/**
 * Input reutilizable: label + campo + error/hint, con el estilo del panel.
 * Soporta `formato` celular/moneda (ver arriba). En esos casos el value en
 * crudo son solo dígitos; el componente sanea la entrada y, para moneda,
 * muestra el valor formateado.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, icon, className = '', id, name, type = 'text', formato, value, onChange, ...rest },
  ref,
) {
  const inputId = id ?? name;
  const cursor = TIPOS_TEXTO.includes(type) ? 'cursor-text' : 'cursor-pointer';

  // Valor a mostrar: moneda → formateado; resto → tal cual.
  const display =
    formato === 'moneda' ? fmtMiles(soloDigitos(String(value ?? ''))) : (value as string | number | undefined);

  // Saneo de entrada para formatos: muta el value del evento antes de propagar
  // (así el padre sigue leyendo e.target.value, ahora en crudo de dígitos).
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (formato === 'celular') e.target.value = soloDigitos(e.target.value).slice(0, 15);
    else if (formato === 'moneda') e.target.value = soloDigitos(e.target.value);
    onChange?.(e);
  };

  // Props nativas según formato.
  const propsFormato: InputHTMLAttributes<HTMLInputElement> =
    formato === 'celular'
      ? { inputMode: 'numeric', minLength: 10, maxLength: 15, pattern: '\\d{10,15}' }
      : formato === 'moneda'
        ? { inputMode: 'numeric' }
        : { type };

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
          {icon && <span className="text-slate-400">{icon}</span>}
          {label}
        </label>
      )}
      <input
        id={inputId}
        name={name}
        ref={ref}
        value={display}
        onChange={formato ? handleChange : onChange}
        className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 ${cursor} ${
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
            : 'border-slate-300 focus:border-brand-500 focus:ring-brand-100'
        } ${className}`}
        {...propsFormato}
        {...rest}
      />
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
});
