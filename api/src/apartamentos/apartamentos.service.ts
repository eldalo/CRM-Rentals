import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../config/supabase.service';
import { ScopeService } from '../common/scope.service';
import { UsuarioActual } from '../common/current-user.decorator';
import { listarPaginado, paginado } from '../common/pagination';
import { ActualizarApartamentoDto, CrearApartamentoDto } from './dto';

// Trae el apto con unidad, propietario y responsable embebidos (to-one).
const COLS =
  '*, unidades(id, nombre, direccion), propietarios(id, nombre_completo), responsable:usuarios!responsable_id(id, nombre_completo, rol)';

@Injectable()
export class ApartamentosService {
  constructor(
    private readonly supa: SupabaseService,
    private readonly scope: ScopeService,
  ) {}

  /**
   * Solo activos (estado=false no se listan), paginados.
   * Asesor: solo los apartamentos de los que es responsable.
   * Admin/super_admin: todos, con filtro opcional por responsable.
   */
  async listar(page?: number, user?: UsuarioActual, responsableId?: string) {
    let ids: string[] | null = null;
    if (this.scope.esAsesor(user)) {
      ids = await this.scope.apartamentoIds(user!.id);
      if (ids.length === 0) return paginado([], 0, Math.max(1, Math.floor(page ?? 1) || 1));
    }
    return listarPaginado(
      (head) => {
        let q = this.supa.client
          .from('apartamentos')
          .select(head ? '*' : COLS, head ? { count: 'exact', head: true } : undefined)
          .eq('estado', true);
        if (ids) {
          q = q.in('id', ids); // asesor: limitado a los suyos
        } else if (responsableId) {
          q = q.eq('responsable_id', responsableId); // admin/super: filtro por responsable
        }
        return q;
      },
      { columna: 'numero' },
      page,
    );
  }

  // user opcional: las llamadas internas (p.ej. PagosService) no scopean aquí.
  async obtener(id: string, user?: UsuarioActual) {
    const { data, error } = await this.supa.client
      .from('apartamentos')
      .select(COLS)
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new NotFoundException('Apartamento no encontrado');
    await this.scope.assertApartamento(user, id);
    return data;
  }

  async crear(dto: CrearApartamentoDto, user?: UsuarioActual) {
    // Un asesor solo puede crear apartamentos a su propio cargo: se ignora
    // el responsable_id que envíe y se fija su id.
    const responsable_id = this.scope.esAsesor(user) ? user!.id : dto.responsable_id;
    const { data, error } = await this.supa.client
      .from('apartamentos')
      .insert({
        unidad_id: dto.unidad_id,
        numero: dto.numero,
        canon: dto.canon,
        dia_corte: dto.dia_corte,
        propietario_id: dto.propietario_id,
        responsable_id,
        asegurado: dto.asegurado ?? false,
        estado: dto.estado ?? true,
      })
      .select(COLS)
      .single();
    if (error) throw this.mapError(error);
    return data;
  }

  async actualizar(id: string, dto: ActualizarApartamentoDto, user?: UsuarioActual) {
    // Scope: el asesor solo edita los apartamentos de los que es responsable.
    await this.obtener(id, user);
    const cambios: Record<string, unknown> = {};
    if (dto.unidad_id !== undefined) cambios.unidad_id = dto.unidad_id;
    if (dto.numero !== undefined) cambios.numero = dto.numero;
    if (dto.canon !== undefined) cambios.canon = dto.canon;
    if (dto.dia_corte !== undefined) cambios.dia_corte = dto.dia_corte;
    if (dto.propietario_id !== undefined) cambios.propietario_id = dto.propietario_id;
    if (dto.asegurado !== undefined) cambios.asegurado = dto.asegurado;
    if (dto.estado !== undefined) cambios.estado = dto.estado;
    // El asesor no puede reasignar el responsable: queda fijo en sí mismo.
    if (this.scope.esAsesor(user)) cambios.responsable_id = user!.id;
    else if (dto.responsable_id !== undefined) cambios.responsable_id = dto.responsable_id;
    if (Object.keys(cambios).length === 0) return this.obtener(id, user);

    const { data, error } = await this.supa.client
      .from('apartamentos')
      .update(cambios)
      .eq('id', id)
      .select(COLS)
      .single();
    if (error) throw this.mapError(error);
    return data;
  }

  /** Soft delete: no se borra, se desactiva (estado=false). */
  async eliminar(id: string) {
    await this.obtener(id);
    const { data, error } = await this.supa.client
      .from('apartamentos')
      .update({ estado: false })
      .eq('id', id)
      .select(COLS)
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  private mapError(error: { code?: string; message: string }) {
    if (error.code === '23505') {
      return new ConflictException('Ya existe un apartamento con ese número en esa unidad');
    }
    if (error.code === '23503') {
      return new NotFoundException('La unidad, el propietario o el responsable referenciado no existe');
    }
    return new Error(error.message);
  }
}
