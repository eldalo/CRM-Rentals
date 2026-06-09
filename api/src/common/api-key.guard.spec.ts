import { UnauthorizedException } from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard';

const config = (key: string) => ({ getOrThrow: () => key }) as any;
const reflector = (esPublico: boolean) => ({ getAllAndOverride: () => esPublico }) as any;

const ctx = (headers: Record<string, unknown>) =>
  ({
    switchToHttp: () => ({ getRequest: () => ({ headers }) }),
    getHandler: () => null,
    getClass: () => null,
  }) as any;

describe('ApiKeyGuard', () => {
  describe('ruta protegida (no @Public)', () => {
    const guard = new ApiKeyGuard(config('clave-correcta'), reflector(false));

    it('sin header X-Api-Key → 401', () => {
      expect(() => guard.canActivate(ctx({}))).toThrow(UnauthorizedException);
    });

    it('key incorrecta → 401', () => {
      expect(() => guard.canActivate(ctx({ 'x-api-key': 'otra' }))).toThrow(UnauthorizedException);
    });

    it('key correcta → pasa', () => {
      expect(guard.canActivate(ctx({ 'x-api-key': 'clave-correcta' }))).toBe(true);
    });
  });

  describe('ruta @Public', () => {
    const guard = new ApiKeyGuard(config('clave-correcta'), reflector(true));

    it('pasa sin header alguno', () => {
      expect(guard.canActivate(ctx({}))).toBe(true);
    });
  });
});
