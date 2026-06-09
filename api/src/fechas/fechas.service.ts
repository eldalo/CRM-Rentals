import { Injectable } from '@nestjs/common';

export type TipoAlerta = 'moroso_diego' | 'moroso_admin';

/**
 * FechasService — fuente de verdad de la lógica de fechas de corte.
 * Todas las operaciones se hacen en UTC sobre strings 'YYYY-MM-DD' para
 * evitar corrimientos por zona horaria. El "día" del negocio lo decide
 * quien dispara el job (ver JobsService / cron).
 *
 * Reglas:
 *   - fecha_corte(periodo) = día 'diaCorte' del mes del periodo,
 *     con clamp al último día si el mes no tiene ese día.
 *   - fecha_limite = fecha_corte + 5 días calendario.
 *   - moroso_diego: hoy === fecha_limite - 1 día.
 *   - moroso_admin: hoy === fecha_limite.
 */
@Injectable()
export class FechasService {
  /** 'YYYY-MM' + diaCorte → 'YYYY-MM-DD' del corte (clamp a fin de mes). */
  fechaCorte(periodo: string, diaCorte: number): string {
    const { y, m } = this.parsePeriodo(periodo);
    const diasEnMes = new Date(Date.UTC(y, m, 0)).getUTCDate(); // m 1-based → último día
    const day = Math.min(diaCorte, diasEnMes);
    return this.fmt(y, m, day);
  }

  /** fecha_limite = fecha_corte + 5 días. */
  fechaLimite(periodo: string, diaCorte: number): string {
    return this.addDays(this.fechaCorte(periodo, diaCorte), 5);
  }

  /**
   * Tipos de alerta pendientes para 'hoy' en un periodo dado.
   * Usa umbrales (>=) en vez de igualdad exacta: si un día el cron no corrió,
   * la alerta se recupera en el siguiente run. La no-duplicación la garantiza
   * la tabla alertas_enviadas (idempotencia), no la fecha exacta.
   *
   *   hoy >= (limite - 1) → 'moroso_diego'  (aviso a Diego, corte+4)
   *   hoy >= limite        → 'moroso_admin' (aviso a la admin, corte+5)
   *
   * Devuelve [] si aún no toca, ['moroso_diego'] el día corte+4, y
   * ['moroso_diego','moroso_admin'] desde corte+5 (cada uno se envía 1 sola
   * vez gracias a alertas_enviadas).
   */
  debeAlertar(hoy: string, periodo: string, diaCorte: number): TipoAlerta[] {
    const limite = this.fechaLimite(periodo, diaCorte);
    const tipos: TipoAlerta[] = [];
    if (hoy >= this.addDays(limite, -1)) tipos.push('moroso_diego');
    if (hoy >= limite) tipos.push('moroso_admin');
    return tipos;
  }

  /**
   * Periodos candidatos a evaluar para el día 'hoy': el mes de hoy y el mes
   * anterior. Un corte alto (29/30/31) + 5 días puede caer en el mes siguiente,
   * por lo que el periodo "vencido" puede ser el del mes anterior.
   */
  periodosCandidatos(hoy: string): string[] {
    const periodoHoy = hoy.slice(0, 7); // 'YYYY-MM'
    return [periodoHoy, this.periodoAnterior(periodoHoy)];
  }

  /** 'YYYY-MM' del mes anterior. */
  periodoAnterior(periodo: string): string {
    const { y, m } = this.parsePeriodo(periodo);
    const prev = new Date(Date.UTC(y, m - 2, 1)); // m-1 → 0-based; -1 mes más
    return `${prev.getUTCFullYear()}-${String(prev.getUTCMonth() + 1).padStart(2, '0')}`;
  }

  /** Suma (o resta) días a 'YYYY-MM-DD'. */
  addDays(dateStr: string, n: number): string {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    dt.setUTCDate(dt.getUTCDate() + n);
    return this.fmt(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
  }

  /**
   * Fecha de "hoy" como 'YYYY-MM-DD' en la zona horaria del negocio.
   * Usa Intl para resolver la zona sin librerías externas.
   */
  hoy(timezone = 'America/Bogota'): string {
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return fmt.format(new Date()); // en-CA → 'YYYY-MM-DD'
  }

  private parsePeriodo(periodo: string): { y: number; m: number } {
    const match = /^(\d{4})-(\d{2})$/.exec(periodo);
    if (!match) throw new Error(`Periodo inválido: '${periodo}' (esperado 'YYYY-MM')`);
    return { y: Number(match[1]), m: Number(match[2]) };
  }

  private fmt(y: number, m: number, d: number): string {
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
}
