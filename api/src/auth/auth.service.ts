import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { SupabaseService } from '../config/supabase.service';
import { LoginDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly supa: SupabaseService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Login por usuario O email (case-insensitive). Exige estado=true y
   * verifica el password con bcrypt. Actualiza ultimo_login y firma un JWT.
   * Mensaje de error genérico: no revela si el identificador existe.
   */
  async login(dto: LoginDto) {
    const id = dto.identificador.trim();
    // Match exacto case-insensitive: escapamos los comodines de LIKE (% _ \)
    // para que '_' en usuarios/emails no actúe como comodín ni se inyecte filtro.
    const patron = id.replace(/[\\%_]/g, (c) => `\\${c}`);
    const cols = 'id, usuario, email, password, nombre_completo, estado, rol, puesto';

    // Búsqueda por usuario; si no, por email. Valores parametrizados (sin .or()).
    let usuario: any = null;
    const porUsuario = await this.supa.client
      .from('usuarios')
      .select(cols)
      .ilike('usuario', patron)
      .maybeSingle();
    if (porUsuario.error) throw new UnauthorizedException('Credenciales inválidas');
    usuario = porUsuario.data;

    if (!usuario) {
      const porEmail = await this.supa.client
        .from('usuarios')
        .select(cols)
        .ilike('email', patron)
        .maybeSingle();
      if (porEmail.error) throw new UnauthorizedException('Credenciales inválidas');
      usuario = porEmail.data;
    }

    if (!usuario || !usuario.estado) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const ok = await bcrypt.compare(dto.password, usuario.password);
    if (!ok) throw new UnauthorizedException('Credenciales inválidas');

    await this.supa.client
      .from('usuarios')
      .update({ ultimo_login: new Date().toISOString() })
      .eq('id', usuario.id);

    const access_token = await this.jwt.signAsync(
      { sub: usuario.id, usuario: usuario.usuario, rol: usuario.rol },
      {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        expiresIn: (this.config.get<string>('JWT_EXPIRES') ?? '8h') as any,
      },
    );

    return {
      access_token,
      usuario: {
        id: usuario.id,
        usuario: usuario.usuario,
        email: usuario.email,
        nombre_completo: usuario.nombre_completo,
        rol: usuario.rol,
        puesto: usuario.puesto ?? null,
      },
    };
  }
}
