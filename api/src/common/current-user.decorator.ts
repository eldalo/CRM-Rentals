import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface UsuarioActual {
  id: string;
  usuario: string;
  email: string;
  nombre_completo: string;
  rol: 'super_admin' | 'admin' | 'asesor';
}

/**
 * Inyecta el usuario autenticado (lo deja JwtStrategy.validate en req.user).
 * Ej: metodo(@CurrentUser() user: UsuarioActual) {}
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UsuarioActual =>
    ctx.switchToHttp().getRequest().user,
);
