import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type Puesto = 'Administrador' | 'Asesor' | 'Vendedor';

export interface UsuarioActual {
  id: string;
  usuario: string;
  email: string;
  nombre_completo: string;
  rol: 'superadmin' | 'admin' | 'user';
  puesto: Puesto | null;
}

/**
 * Inyecta el usuario autenticado (lo deja JwtStrategy.validate en req.user).
 * Ej: metodo(@CurrentUser() user: UsuarioActual) {}
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UsuarioActual =>
    ctx.switchToHttp().getRequest().user,
);
