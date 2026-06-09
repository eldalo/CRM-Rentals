import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../config/supabase.service';
import { listarPaginado } from '../common/pagination';
import { ActualizarUnidadDto, CrearUnidadDto } from './dto';

@Injectable()
export class UnidadesService {
  constructor(private readonly supa: SupabaseService) {}

  /** Solo activas (estado=false no se listan), paginadas de a 20. */
  async listar(page?: number) {
    return listarPaginado(
      (head) =>
        this.supa.client
          .from('unidades')
          .select('*', head ? { count: 'exact', head: true } : undefined)
          .eq('estado', true),
      { columna: 'nombre' },
      page,
    );
  }

  async obtener(id: string) {
    const { data, error } = await this.supa.client
      .from('unidades')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new NotFoundException('Unidad no encontrada');
    return data;
  }

  async crear(dto: CrearUnidadDto) {
    const { data, error } = await this.supa.client
      .from('unidades')
      .insert({
        nombre: dto.nombre,
        direccion: dto.direccion,
        nombre_administrador: dto.nombre_administrador ?? null,
        contacto_administrador: dto.contacto_administrador ?? null,
        estado: dto.estado ?? true,
      })
      .select()
      .single();
    if (error) throw this.mapError(error);
    return data;
  }

  async actualizar(id: string, dto: ActualizarUnidadDto) {
    await this.obtener(id);
    const cambios: Record<string, unknown> = {};
    if (dto.nombre !== undefined) cambios.nombre = dto.nombre;
    if (dto.direccion !== undefined) cambios.direccion = dto.direccion;
    if (dto.nombre_administrador !== undefined) cambios.nombre_administrador = dto.nombre_administrador;
    if (dto.contacto_administrador !== undefined) cambios.contacto_administrador = dto.contacto_administrador;
    if (dto.estado !== undefined) cambios.estado = dto.estado;
    if (Object.keys(cambios).length === 0) return this.obtener(id);

    const { data, error } = await this.supa.client
      .from('unidades')
      .update(cambios)
      .eq('id', id)
      .select()
      .single();
    if (error) throw this.mapError(error);
    return data;
  }

  /** Soft delete: no se borra, se desactiva (estado=false). */
  async desactivar(id: string) {
    await this.obtener(id);
    const { data, error } = await this.supa.client
      .from('unidades')
      .update({ estado: false })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  private mapError(error: { code?: string; message: string }) {
    if (error.code === '23505') {
      return new ConflictException('Ya existe una unidad con ese nombre y dirección');
    }
    return new Error(error.message);
  }
}
