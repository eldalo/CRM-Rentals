import { SpinnerGapIcon } from '@phosphor-icons/react';

interface LoadingProps {
  /** Texto junto al spinner. */
  label?: string;
  size?: number;
  /** Centra vertical y horizontalmente con padding (para vistas vacías). */
  full?: boolean;
  className?: string;
}

/**
 * Indicador de carga reutilizable: spinner girando + texto "Cargando".
 * El icono usa animate-spin (CSS, nítido a cualquier tamaño; sin GIF).
 */
export function Loading({ label = 'Cargando', size = 18, full = false, className = '' }: LoadingProps) {
  return (
    <div
      className={`flex items-center justify-center gap-2 text-slate-400 ${
        full ? 'py-12' : ''
      } ${className}`}
      role="status"
      aria-live="polite"
    >
      <SpinnerGapIcon size={size} weight="bold" className="animate-spin text-brand-600" />
      <span className="text-sm font-medium">{label}…</span>
    </div>
  );
}
