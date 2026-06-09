import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

/** Tamaño de página fijo en todo el API. */
export const PAGE_SIZE = 15;

/** Query string de paginación: ?page=N (1-based, default 1). */
export class PaginacionQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;
}

/** Envelope de respuesta paginada. */
export interface Paginado<T> {
  data: T[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

/** Calcula el rango [from, to] de Supabase .range() para una página. */
export function rango(page?: number): { from: number; to: number; page: number } {
  const p = Math.max(1, Math.floor(page ?? 1) || 1);
  const from = (p - 1) * PAGE_SIZE;
  return { from, to: from + PAGE_SIZE - 1, page: p };
}

/** Arma el envelope a partir de los datos y el total (count exacto). */
export function paginado<T>(data: T[], total: number, page: number): Paginado<T> {
  return {
    data,
    page,
    page_size: PAGE_SIZE,
    total,
    total_pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

/**
 * Ejecuta una consulta paginada de forma segura.
 *
 * `make(head)` debe devolver un builder ya filtrado:
 *   - head=true  → select con { count: 'exact', head: true } (solo cuenta, sin filas)
 *   - head=false → select con las columnas a traer
 *
 * Primero pide el total con el head-count (nunca falla por rango), y solo si la
 * página cae dentro del total aplica .order().range() — así evita el error 416
 * (PGRST103 "range not satisfiable") cuando se pide una página vacía.
 */
// `make` devuelve un query builder de Supabase; se tipa laxo (any) para no
// acoplar a los genéricos internos de postgrest-js.
export async function listarPaginado<T>(
  make: (head: boolean) => any,
  orden: { columna: string; ascending?: boolean },
  page?: number,
): Promise<Paginado<T>> {
  const { from, to, page: p } = rango(page);

  const head = await make(true);
  if (head.error) throw new Error(head.error.message);
  const total: number = head.count ?? 0;

  if (from >= total) return paginado<T>([], total, p);

  const { data, error } = await make(false)
    .order(orden.columna, { ascending: orden.ascending ?? true })
    .range(from, to);
  if (error) throw new Error(error.message);
  return paginado<T>((data ?? []) as T[], total, p);
}
