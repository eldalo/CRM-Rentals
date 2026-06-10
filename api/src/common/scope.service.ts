import { ForbiddenException, Global, Injectable, Module } from '@nestjs/common';
import { SupabaseService } from '../config/supabase.service';
import { UsuarioActual } from './current-user.decorator';

/**
 * Scoping de usuarios con rol 'user'. Solo ven/gestionan los apartamentos de
 * los que son responsable (apartamentos.responsable_id) y sus pagos. superadmin
 * y admin no se filtran (ven todo).
 *
 * NOTA: el backend usa Supabase con service_role, que IGNORA las RLS de
 * Postgres. Por eso el scoping vive aquí, en código de la app, query por query.
 *
 * PENDIENTE: tras introducir `puesto`, decidir si el scoping debe seguir al
 * rol 'user' o al puesto 'Asesor'. Por ahora conserva el comportamiento previo
 * (el antiguo rol 'asesor' es hoy rol 'user').
 */
@Injectable()
export class ScopeService {
  constructor(private readonly supa: SupabaseService) {}

  esAsesor(user?: UsuarioActual): boolean {
    return user?.rol === 'user';
  }

  /** ids de apartamentos a cargo del asesor (es su responsable). */
  async apartamentoIds(usuarioId: string): Promise<string[]> {
    const { data, error } = await this.supa.client
      .from('apartamentos')
      .select('id')
      .eq('responsable_id', usuarioId)
      .eq('estado', true);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => r.id as string);
  }

  /**
   * Lanza 403 si el asesor no tiene ese apartamento a cargo.
   * admin/super_admin (o sin user) pasan sin restricción.
   */
  async assertApartamento(user: UsuarioActual | undefined, apartamentoId: string): Promise<void> {
    if (!this.esAsesor(user)) return;
    const ids = await this.apartamentoIds(user!.id);
    if (!ids.includes(apartamentoId)) {
      throw new ForbiddenException('Ese apartamento no está a tu cargo');
    }
  }
}

@Global()
@Module({
  providers: [ScopeService],
  exports: [ScopeService],
})
export class ScopeModule {}
