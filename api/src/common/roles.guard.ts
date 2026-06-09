import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Rol, ROLES_KEY } from './roles.decorator';

/**
 * Autorización por rol. Lee los roles exigidos con @Roles(...) y los compara
 * con el rol del usuario autenticado (req.user.rol, puesto por JwtStrategy).
 * Sin @Roles en el endpoint, deja pasar a cualquier usuario autenticado.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requeridos = this.reflector.getAllAndOverride<Rol[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requeridos || requeridos.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user || !requeridos.includes(user.rol)) {
      throw new ForbiddenException('No tienes permiso para esta acción');
    }
    return true;
  }
}
