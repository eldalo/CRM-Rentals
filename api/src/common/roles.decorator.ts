import { SetMetadata } from '@nestjs/common';

export type Rol = 'super_admin' | 'admin' | 'asesor';

export const ROLES_KEY = 'roles';

/**
 * Restringe un endpoint a los roles indicados. Combínalo con RolesGuard.
 * Ej: @Roles('super_admin', 'admin')
 */
export const Roles = (...roles: Rol[]) => SetMetadata(ROLES_KEY, roles);
