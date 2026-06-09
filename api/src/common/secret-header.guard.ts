import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Protege endpoints disparados desde fuera (cron) con un header secreto.
 * Header esperado: X-Daily-Check-Secret == DAILY_CHECK_SECRET.
 */
@Injectable()
export class SecretHeaderGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const enviado = req.headers['x-daily-check-secret'];
    const esperado = this.config.getOrThrow<string>('DAILY_CHECK_SECRET');
    if (!enviado || enviado !== esperado) {
      throw new UnauthorizedException('Secreto inválido o ausente');
    }
    return true;
  }
}
