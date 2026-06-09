import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { SpinnerGapIcon } from '@phosphor-icons/react';

type Variant = 'primary' | 'ghost' | 'danger';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  /** Icono a la izquierda del texto. Se oculta mientras loading. */
  icon?: ReactNode;
  /** Estado de envío: deshabilita, muestra spinner y texto "Enviando…". */
  loading?: boolean;
  /** Texto mostrado mientras loading (default "Enviando…"). */
  loadingText?: string;
}

const estilos: Record<Variant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700',
  ghost: 'text-slate-600 hover:bg-slate-100',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};

/** Botón reutilizable con variantes, icono y estado de carga. */
export function Button({
  variant = 'primary',
  className = '',
  icon,
  loading = false,
  loadingText = 'Enviando…',
  disabled,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
        loading ? '' : 'cursor-pointer'
      } ${estilos[variant]} ${className}`}
      {...rest}
    >
      {loading ? (
        <>
          <SpinnerGapIcon size={16} weight="bold" className="animate-spin" />
          {loadingText}
        </>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
}
