import { SetMetadata } from '@nestjs/common';

export type Rol = 'superadmin' | 'admin' | 'user';

export const ROLES_KEY = 'roles';

/**
 * Restringe un endpoint a los roles indicados. Combínalo con RolesGuard.
 * Ej: @Roles('superadmin', 'admin')
 */
export const Roles = (...roles: Rol[]) => SetMetadata(ROLES_KEY, roles);
