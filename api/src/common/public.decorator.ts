import { SetMetadata } from '@nestjs/common';

/**
 * Marca un endpoint como público: el ApiKeyGuard global lo deja pasar
 * sin exigir X-Api-Key. Se usa en rutas con su propia validación
 * (webhooks/telegram, jobs/daily-check) o sin datos sensibles (health).
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
