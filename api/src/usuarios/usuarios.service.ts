import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { SupabaseService } from '../config/supabase.service';
import { UsuarioActual } from '../common/current-user.decorator';
import { listarPaginado } from '../common/pagination';
import { ActualizarUsuarioDto, CrearUsuarioDto } from './dto';

// Campos públicos que devolvemos. NUNCA: password ni telegram_bot_token
// (secretos). El token del bot es write-only: se guarda pero no se lee de vuelta;
// al cliente solo le exponemos `tiene_bot` (booleano).
const COLS =
  'id, usuario, email, nombre_completo, estado, ultimo_login, rol, creado_en, actualizado_en, telegram_chat_id, recibe_todos_pagos';
// Para consultas: incluye el token solo para derivar tiene_bot y luego se quita.
const SELECT = `${COLS}, telegram_bot_token`;

/** Quita el token (secreto) y agrega tiene_bot para la respuesta al cliente. */
function limpiar<T extends { telegram_bot_token?: string | null }>(row: T) {
  const { telegram_bot_token, ...rest } = row;
  return { ...rest, tiene_bot: !!telegram_bot_token };
}

@Injectable()
export class UsuariosService {
  constructor(private readonly supa: SupabaseService) {}

  async listar(page?: number) {
    const p = await listarPaginado<Record<string, any>>(
      (head) =>
        this.supa.client
          .from('usuarios')
          .select(head ? '*' : SELECT, head ? { count: 'exact', head: true } : undefined),
      { columna: 'creado_en', ascending: false },
      page,
    );
    return { ...p, data: p.data.map(limpiar) };
  }

  async obtener(id: string) {
    const { data, error } = await this.supa.client
      .from('usuarios')
      .select(SELECT)
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new NotFoundException('Usuario no encontrado');
    return limpiar(data);
  }

  async crear(dto: CrearUsuarioDto, actor: UsuarioActual) {
    // Solo un super_admin puede crear otro super_admin.
    if (dto.rol === 'super_admin' && actor.rol !== 'super_admin') {
      throw new ForbiddenException('Solo un super_admin puede crear super_admins');
    }
    const password = await bcrypt.hash(dto.password, 12);
    const { data, error } = await this.supa.client
      .from('usuarios')
      .insert({
        usuario: dto.usuario,
        email: dto.email,
        password,
        nombre_completo: dto.nombre_completo,
        rol: dto.rol,
        estado: dto.estado ?? true,
        telegram_bot_token: dto.telegram_bot_token || null,
        telegram_chat_id: dto.telegram_chat_id || null,
        recibe_todos_pagos: dto.recibe_todos_pagos ?? false,
      })
      .select(SELECT)
      .single();
    if (error) throw this.mapError(error);
    return limpiar(data);
  }

  async actualizar(id: string, dto: ActualizarUsuarioDto, actor: UsuarioActual) {
    const actual = await this.obtener(id);

    // Proteger el escalamiento de privilegios a super_admin.
    if (dto.rol === 'super_admin' && actor.rol !== 'super_admin') {
      throw new ForbiddenException('Solo un super_admin puede asignar el rol super_admin');
    }
    // Un usuario no super_admin no puede modificar a un super_admin.
    if (actual.rol === 'super_admin' && actor.rol !== 'super_admin') {
      throw new ForbiddenException('No puedes modificar a un super_admin');
    }

    const cambios: Record<string, unknown> = {};
    if (dto.usuario !== undefined) cambios.usuario = dto.usuario;
    if (dto.email !== undefined) cambios.email = dto.email;
    if (dto.nombre_completo !== undefined) cambios.nombre_completo = dto.nombre_completo;
    if (dto.rol !== undefined) cambios.rol = dto.rol;
    if (dto.estado !== undefined) cambios.estado = dto.estado;
    if (dto.password !== undefined) cambios.password = await bcrypt.hash(dto.password, 12);
    if (dto.telegram_bot_token !== undefined) cambios.telegram_bot_token = dto.telegram_bot_token || null;
    if (dto.telegram_chat_id !== undefined) cambios.telegram_chat_id = dto.telegram_chat_id || null;
    if (dto.recibe_todos_pagos !== undefined) cambios.recibe_todos_pagos = dto.recibe_todos_pagos;

    if (Object.keys(cambios).length === 0) return actual;

    const { data, error } = await this.supa.client
      .from('usuarios')
      .update(cambios)
      .eq('id', id)
      .select(SELECT)
      .single();
    if (error) throw this.mapError(error);
    return limpiar(data);
  }

  /** Soft delete: los usuarios no se borran, se desactivan. */
  async desactivar(id: string, actor: UsuarioActual) {
    const actual = await this.obtener(id);
    if (actual.rol === 'super_admin' && actor.rol !== 'super_admin') {
      throw new ForbiddenException('No puedes desactivar a un super_admin');
    }
    if (actual.id === actor.id) {
      throw new ForbiddenException('No puedes desactivarte a ti mismo');
    }
    const { data, error } = await this.supa.client
      .from('usuarios')
      .update({ estado: false })
      .eq('id', id)
      .select(SELECT)
      .single();
    if (error) throw new Error(error.message);
    return limpiar(data);
  }

  private mapError(error: { code?: string; message: string }) {
    if (error.code === '23505') {
      return new ConflictException('Usuario o email ya existe');
    }
    return new Error(error.message);
  }
}
