import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../config/supabase.service';
import { ActualizarInquilinoDto, CrearInquilinoDto } from './dto';

@Injectable()
export class InquilinosService {
  constructor(private readonly supa: SupabaseService) {}

  /** Solo activos: los desactivados (estado=false) no se listan. */
  async listar() {
    const { data, error } = await this.supa.client
      .from('inquilinos')
      .select('*, apartamentos(numero, unidades(nombre))')
      .eq('estado', true)
      .order('nombre_completo');
    if (error) throw new Error(error.message);
    return data;
  }

  async obtener(id: string) {
    const { data, error } = await this.supa.client
      .from('inquilinos')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new NotFoundException('Inquilino no encontrado');
    return data;
  }

  async crear(dto: CrearInquilinoDto) {
    const { data, error } = await this.supa.client
      .from('inquilinos')
      .insert({
        apartamento_id: dto.apartamento_id,
        nombre_completo: dto.nombre_completo,
        celular: dto.celular ?? null,
        cedula: dto.cedula ?? null,
        email: dto.email ?? null,
        nombre_referencia_personal: dto.nombre_referencia_personal ?? null,
        celular_referencia_personal: dto.celular_referencia_personal ?? null,
        nombre_2_referencia_personal: dto.nombre_2_referencia_personal ?? null,
        celular_2_referencia_personal: dto.celular_2_referencia_personal ?? null,
        estado: dto.estado ?? true,
      })
      .select()
      .single();
    if (error) throw this.mapError(error);
    return data;
  }

  async actualizar(id: string, dto: ActualizarInquilinoDto) {
    await this.obtener(id);
    const campos = [
      'apartamento_id',
      'nombre_completo',
      'celular',
      'cedula',
      'email',
      'nombre_referencia_personal',
      'celular_referencia_personal',
      'nombre_2_referencia_personal',
      'celular_2_referencia_personal',
      'estado',
    ] as const;
    const cambios: Record<string, unknown> = {};
    for (const c of campos) {
      if (dto[c] !== undefined) cambios[c] = dto[c];
    }
    if (Object.keys(cambios).length === 0) return this.obtener(id);

    const { data, error } = await this.supa.client
      .from('inquilinos')
      .update(cambios)
      .eq('id', id)
      .select()
      .single();
    if (error) throw this.mapError(error);
    return data;
  }

  private mapError(error: { code?: string; message: string }) {
    if (error.code === '23503') {
      return new NotFoundException('El apartamento referenciado no existe');
    }
    return new Error(error.message);
  }

  /** Soft delete: no se borra, se desactiva (estado=false). */
  async eliminar(id: string) {
    await this.obtener(id);
    const { data, error } = await this.supa.client
      .from('inquilinos')
      .update({ estado: false })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }
}
