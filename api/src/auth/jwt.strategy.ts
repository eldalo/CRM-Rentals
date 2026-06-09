import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { SupabaseService } from '../config/supabase.service';
import { UsuarioActual } from '../common/current-user.decorator';

interface JwtPayload {
  sub: string; // usuarios.id
  usuario: string;
  rol: UsuarioActual['rol'];
}

/**
 * Valida el Bearer token y, en CADA request, re-consulta la DB para exigir
 * estado=true. Así la desactivación de un usuario corta el acceso al instante
 * (un usuario con estado=false no pasa aunque su token siga vigente).
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly supa: SupabaseService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<UsuarioActual> {
    const { data, error } = await this.supa.client
      .from('usuarios')
      .select('id, usuario, email, nombre_completo, estado, rol')
      .eq('id', payload.sub)
      .maybeSingle();

    if (error) throw new UnauthorizedException('No se pudo validar la sesión');
    if (!data || !data.estado) {
      throw new UnauthorizedException('Usuario inexistente o desactivado');
    }

    return {
      id: data.id,
      usuario: data.usuario,
      email: data.email,
      nombre_completo: data.nombre_completo,
      rol: data.rol,
    };
  }
}
