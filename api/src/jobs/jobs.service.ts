import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../config/supabase.service';
import { FechasService, TipoAlerta } from '../fechas/fechas.service';
import { TelegramService } from '../telegram/telegram.service';

interface Moroso {
  apartamento_id: string;
  responsable_id: string;
  unidad: string;
  periodo: string;
  fecha_limite: string;
  tipo: TipoAlerta;
}

@Injectable()
export class JobsService {
  private readonly log = new Logger(JobsService.name);

  constructor(
    private readonly supa: SupabaseService,
    private readonly fechas: FechasService,
    private readonly telegram: TelegramService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Recorre apartamentos activos, calcula morosos del día y envía avisos.
   * Idempotente: respeta alertas_enviadas para no duplicar.
   */
  async dailyCheck(fechaOverride?: string) {
    const hoy =
      fechaOverride ?? this.fechas.hoy(this.config.get('APP_TIMEZONE') ?? 'America/Bogota');
    const periodos = this.fechas.periodosCandidatos(hoy);

    const { data: aptos, error } = await this.supa.client
      .from('apartamentos')
      .select('id, numero, dia_corte, responsable_id, unidades(nombre)')
      .eq('estado', true);
    if (error) throw new Error(error.message);

    // Candidatos: apto+periodo+tipo que hoy disparan alerta (umbral >=).
    const candidatos: Moroso[] = [];
    for (const a of aptos ?? []) {
      for (const periodo of periodos) {
        const tipos = this.fechas.debeAlertar(hoy, periodo, a.dia_corte);
        for (const tipo of tipos) {
          candidatos.push({
            apartamento_id: a.id,
            responsable_id: (a as any).responsable_id,
            unidad: `${(a as any).unidades?.nombre ?? ''} ${a.numero}`.trim(),
            periodo,
            fecha_limite: this.fechas.fechaLimite(periodo, a.dia_corte),
            tipo,
          });
        }
      }
    }

    if (candidatos.length === 0) {
      this.log.log(`daily-check ${hoy}: sin candidatos.`);
      return { fecha: hoy, enviadas: 0, detalle: [] as Moroso[] };
    }

    const periodosAfectados = [...new Set(candidatos.map((c) => c.periodo))];

    // Pagos confirmados → excluir.
    const { data: confirmados } = await this.supa.client
      .from('pagos')
      .select('apartamento_id, periodo')
      .eq('estado', 'confirmado')
      .in('periodo', periodosAfectados);
    const setConfirmado = new Set((confirmados ?? []).map((p) => `${p.apartamento_id}|${p.periodo}`));

    // Alertas ya enviadas → idempotencia.
    const { data: yaEnviadas } = await this.supa.client
      .from('alertas_enviadas')
      .select('apartamento_id, periodo, tipo')
      .in('periodo', periodosAfectados);
    const setEnviada = new Set(
      (yaEnviadas ?? []).map((x) => `${x.apartamento_id}|${x.periodo}|${x.tipo}`),
    );

    const pendientes = candidatos.filter(
      (c) =>
        !setConfirmado.has(`${c.apartamento_id}|${c.periodo}`) &&
        !setEnviada.has(`${c.apartamento_id}|${c.periodo}|${c.tipo}`),
    );

    if (pendientes.length === 0) {
      this.log.log(`daily-check ${hoy}: sin pendientes nuevos.`);
      return { fecha: hoy, enviadas: 0, detalle: [] as Moroso[] };
    }

    // Credenciales del bot de cada asesor responsable de los pendientes.
    const responsableIds = [...new Set(pendientes.map((c) => c.responsable_id))];
    const { data: usuarios } = await this.supa.client
      .from('usuarios')
      .select('id, telegram_bot_token, telegram_chat_id')
      .in('id', responsableIds)
      .eq('estado', true);
    const creds = new Map<string, { token: string; chat: string }>(
      (usuarios ?? [])
        .filter((u) => u.telegram_bot_token && u.telegram_chat_id)
        .map((u) => [u.id, { token: u.telegram_bot_token as string, chat: u.telegram_chat_id as string }]),
    );

    // Cada asesor recibe SUS morosos en su bot. Sin bot → se omite (no se
    // registra como enviado, reintenta otro día al configurarlo).
    const enviadas: Moroso[] = [];
    for (const responsableId of responsableIds) {
      const cred = creds.get(responsableId);
      if (!cred) continue;
      const suyos = pendientes.filter((c) => c.responsable_id === responsableId);
      await this.telegram.enviarCon(cred.token, cred.chat, this.mensaje('🔔 Tus morosos del día', suyos));
      enviadas.push(...suyos);
    }

    // Idempotencia: solo las efectivamente enviadas.
    if (enviadas.length) {
      const filas = enviadas.map((c) => ({
        apartamento_id: c.apartamento_id,
        periodo: c.periodo,
        tipo: c.tipo,
      }));
      const { error: insErr } = await this.supa.client
        .from('alertas_enviadas')
        .upsert(filas, { onConflict: 'apartamento_id,periodo,tipo', ignoreDuplicates: true });
      if (insErr) this.log.error(`No se pudo registrar alertas_enviadas: ${insErr.message}`);
    }

    const sinBot = pendientes.length - enviadas.length;
    this.log.log(`daily-check ${hoy}: ${enviadas.length} enviadas, ${sinBot} omitidas (asesor sin bot).`);
    return { fecha: hoy, enviadas: enviadas.length, detalle: enviadas };
  }

  private mensaje(titulo: string, items: Moroso[]): string {
    const filas = items
      .map((c) => `• <b>${c.unidad}</b> — ${c.periodo} (límite ${c.fecha_limite})`)
      .join('\n');
    return `${titulo}\n\n${filas}`;
  }
}
