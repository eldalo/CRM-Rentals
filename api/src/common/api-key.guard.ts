import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './public.decorator';

/**
 * Guard global de API key compartida.
 * Exige el header X-Api-Key == env API_KEY en todos los endpoints,
 * salvo los marcados con @Public() (health, webhooks/telegram, jobs/daily-check),
 * que validan su propio secreto o no exponen datos.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly config: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const esPublico = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (esPublico) return true;

    const req = context.switchToHttp().getRequest();
    const enviado = req.headers['x-api-key'];
    const esperado = this.config.getOrThrow<string>('API_KEY');
    if (!enviado || enviado !== esperado) {
      throw new UnauthorizedException('API key inválida o ausente');
    }
    return true;
  }
}
