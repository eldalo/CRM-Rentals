import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../config/supabase.service';
import { listarPaginado } from '../common/pagination';
import { ActualizarPropietarioDto, CrearPropietarioDto } from './dto';

@Injectable()
export class PropietariosService {
  constructor(private readonly supa: SupabaseService) {}

  /** Solo activos (estado=false no se listan), paginados de a 20. */
  async listar(page?: number) {
    return listarPaginado(
      (head) =>
        this.supa.client
          .from('propietarios')
          .select('*', head ? { count: 'exact', head: true } : undefined)
          .eq('estado', true),
      { columna: 'nombre_completo' },
      page,
    );
  }

  async obtener(id: string) {
    const { data, error } = await this.supa.client
      .from('propietarios')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new NotFoundException('Propietario no encontrado');
    return data;
  }

  async crear(dto: CrearPropietarioDto) {
    const { data, error } = await this.supa.client
      .from('propietarios')
      .insert({
        nombre_completo: dto.nombre_completo,
        celular: dto.celular ?? null,
        email: dto.email ?? null,
        estado: dto.estado ?? true,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async actualizar(id: string, dto: ActualizarPropietarioDto) {
    await this.obtener(id);
    const cambios: Record<string, unknown> = {};
    if (dto.nombre_completo !== undefined) cambios.nombre_completo = dto.nombre_completo;
    if (dto.celular !== undefined) cambios.celular = dto.celular;
    if (dto.email !== undefined) cambios.email = dto.email;
    if (dto.estado !== undefined) cambios.estado = dto.estado;
    if (Object.keys(cambios).length === 0) return this.obtener(id);

    const { data, error } = await this.supa.client
      .from('propietarios')
      .update(cambios)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  /** Soft delete: no se borra, se desactiva (estado=false). */
  async desactivar(id: string) {
    await this.obtener(id);
    const { data, error } = await this.supa.client
      .from('propietarios')
      .update({ estado: false })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }
}
