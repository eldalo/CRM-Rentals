import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ApartamentosService } from '../apartamentos/apartamentos.service';
import { SupabaseService } from '../config/supabase.service';
import { ScopeService } from '../common/scope.service';
import { UsuarioActual } from '../common/current-user.decorator';
import { FechasService } from '../fechas/fechas.service';
import { TelegramService } from '../telegram/telegram.service';
import { CrearPagoDto } from './dto';

const fmtMoneda = (n?: number | null) =>
  n == null ? '—' : new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

@Injectable()
export class PagosService {
  constructor(
    private readonly supa: SupabaseService,
    private readonly apartamentos: ApartamentosService,
    private readonly scope: ScopeService,
    private readonly fechas: FechasService,
    private readonly telegram: TelegramService,
  ) {}

  async registrar(dto: CrearPagoDto, user?: UsuarioActual) {
    // Asesor: solo registra pagos de apartamentos a su cargo.
    await this.scope.assertApartamento(user, dto.apartamento_id);
    const apto = await this.apartamentos.obtener(dto.apartamento_id);
    const fecha_limite = this.fechas.fechaLimite(dto.periodo, apto.dia_corte);
    const estado = dto.estado ?? 'pendiente';

    const fila = {
      apartamento_id: dto.apartamento_id,
      periodo: dto.periodo,
      fecha_limite,
      monto: dto.monto ?? null,
      comprobante_url: dto.comprobante_url ?? null,
      factura_electronica: dto.factura_electronica ?? false,
      estado,
      confirmado_en: estado === 'confirmado' ? new Date().toISOString() : null,
    };

    const { data, error } = await this.supa.client
      .from('pagos')
      .insert(fila)
      .select()
      .single();

    if (error) {
      // índice único (apartamento_id, periodo): ya hay un pago ese mes.
      if (error.code === '23505') {
        return this.reintentarSobreExistente(dto, fila, apto);
      }
      throw new Error(error.message);
    }

    await this.notificarRegistro(data, apto, estado);
    return data;
  }

  /**
   * Hay un pago previo para (apto, periodo). Si ya está 'confirmado' no se
   * pisa (409). Si está 'pendiente'/'rechazado', se actualiza con el nuevo
   * comprobante — permite corregir un comprobante rechazado.
   */
  private async reintentarSobreExistente(dto: CrearPagoDto, fila: any, apto: any) {
    const { data: prev, error } = await this.supa.client
      .from('pagos')
      .select('*')
      .eq('apartamento_id', dto.apartamento_id)
      .eq('periodo', dto.periodo)
      .single();
    if (error) throw new Error(error.message);

    if (prev.estado === 'confirmado') {
      const unidad = `${apto.unidades?.nombre ?? ''} ${apto.numero}`.trim();
      throw new ConflictException(`La unidad ${unidad} ya tiene un pago confirmado en ${dto.periodo}`);
    }

    const { data, error: e2 } = await this.supa.client
      .from('pagos')
      .update({
        fecha_limite: fila.fecha_limite,
        monto: fila.monto,
        comprobante_url: fila.comprobante_url,
        factura_electronica: fila.factura_electronica,
        estado: fila.estado,
        recibido_en: new Date().toISOString(),
        confirmado_en: fila.confirmado_en,
      })
      .eq('id', prev.id)
      .select()
      .single();
    if (e2) throw new Error(e2.message);

    await this.notificarRegistro(data, apto, fila.estado);
    return data;
  }

  /**
   * Notifica un pago (informativo, sin botones). Va al bot del asesor
   * responsable del apartamento y al/los admin(s) que reciben todos los pagos.
   */
  private async notificarRegistro(pago: any, apto: any, estado: string) {
    const unidad = `${apto.unidades?.nombre ?? ''} ${apto.numero}`.trim();
    const texto = [
      '🧾 <b>Pago registrado</b>',
      `Unidad: <b>${unidad}</b>`,
      `Periodo: <b>${pago.periodo}</b>`,
      `Monto: <b>${fmtMoneda(pago.monto)}</b>`,
      `Factura electrónica: <b>${pago.factura_electronica ? 'Sí' : 'No'}</b>`,
      pago.comprobante_url ? `Comprobante: ${pago.comprobante_url}` : null,
      `Estado: <b>${estado}</b>`,
    ]
      .filter(Boolean)
      .join('\n');

    for (const d of await this.destinatarios(apto.responsable_id)) {
      await this.telegram.enviarCon(d.token, d.chat, texto);
    }
  }

  /**
   * Bots destino de un pago: el del asesor responsable + el/los admin(s) con
   * recibe_todos_pagos. Solo usuarios activos con bot+chat; deduplicado por chat.
   */
  private async destinatarios(responsableId: string) {
    const { data, error } = await this.supa.client
      .from('usuarios')
      .select('telegram_bot_token, telegram_chat_id')
      .or(`id.eq.${responsableId},recibe_todos_pagos.eq.true`)
      .eq('estado', true);
    if (error) throw new Error(error.message);

    const porChat = new Map<string, { token: string; chat: string }>();
    for (const u of data ?? []) {
      if (u.telegram_bot_token && u.telegram_chat_id && !porChat.has(u.telegram_chat_id)) {
        porChat.set(u.telegram_chat_id, { token: u.telegram_bot_token, chat: u.telegram_chat_id });
      }
    }
    return [...porChat.values()];
  }

  async confirmar(id: string) {
    const pago = await this.obtener(id);
    const { data, error } = await this.supa.client
      .from('pagos')
      .update({ estado: 'confirmado', confirmado_en: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async rechazar(id: string) {
    await this.obtener(id);
    const { data, error } = await this.supa.client
      .from('pagos')
      .update({ estado: 'rechazado' })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async obtener(id: string, user?: UsuarioActual) {
    const { data, error } = await this.supa.client
      .from('pagos')
      .select('*, apartamentos(numero, unidades(nombre))')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new NotFoundException('Pago no encontrado');
    await this.scope.assertApartamento(user, data.apartamento_id);
    return data;
  }
}
