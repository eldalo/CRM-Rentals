import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../config/supabase.service';
import { ScopeService } from '../common/scope.service';
import { UsuarioActual } from '../common/current-user.decorator';
import { FechasService } from '../fechas/fechas.service';

export type Semaforo = 'pagado' | 'pendiente' | 'vencido';

export interface EstadoApto {
  apartamento_id: string;
  unidad: string;
  canon: number;
  dia_corte: number;
  periodo: string;
  fecha_limite: string;
  estado_pago: 'pendiente' | 'confirmado' | 'rechazado' | null;
  monto: number | null;
  comprobante_url: string | null;
  semaforo: Semaforo;
}

@Injectable()
export class EstadoService {
  constructor(
    private readonly supa: SupabaseService,
    private readonly scope: ScopeService,
    private readonly fechas: FechasService,
    private readonly config: ConfigService,
  ) {}

  async delPeriodo(
    periodo: string,
    user?: UsuarioActual,
    responsableId?: string,
  ): Promise<EstadoApto[]> {
    const hoy = this.fechas.hoy(this.config.get('APP_TIMEZONE') ?? 'America/Bogota');

    let qAptos = this.supa.client
      .from('apartamentos')
      .select('*, unidades(nombre)')
      .eq('estado', true)
      .order('numero');

    // Asesor: solo el estado de sus apartamentos a cargo.
    // Admin/super_admin: ven todo, con filtro opcional por responsable.
    if (this.scope.esAsesor(user)) {
      const ids = await this.scope.apartamentoIds(user!.id);
      if (ids.length === 0) return [];
      qAptos = qAptos.in('id', ids);
    } else if (responsableId) {
      qAptos = qAptos.eq('responsable_id', responsableId);
    }

    const { data: aptos, error: e1 } = await qAptos;
    if (e1) throw new Error(e1.message);

    const { data: pagos, error: e2 } = await this.supa.client
      .from('pagos')
      .select('*')
      .eq('periodo', periodo);
    if (e2) throw new Error(e2.message);

    const porApto = new Map((pagos ?? []).map((p) => [p.apartamento_id, p]));

    return (aptos ?? []).map((a) => {
      const pago = porApto.get(a.id);
      const fecha_limite = this.fechas.fechaLimite(periodo, a.dia_corte);
      const estado_pago = pago?.estado ?? null;

      let semaforo: Semaforo;
      if (estado_pago === 'confirmado') {
        semaforo = 'pagado';
      } else if (hoy > fecha_limite) {
        semaforo = 'vencido';
      } else {
        semaforo = 'pendiente';
      }

      return {
        apartamento_id: a.id,
        unidad: `${a.unidades?.nombre ?? ''} ${a.numero}`.trim(),
        canon: Number(a.canon),
        dia_corte: a.dia_corte,
        periodo,
        fecha_limite,
        estado_pago,
        monto: pago?.monto ?? null,
        comprobante_url: pago?.comprobante_url ?? null,
        semaforo,
      };
    });
  }
}
