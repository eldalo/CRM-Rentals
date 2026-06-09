import { plainToInstance } from 'class-transformer';
import { IsOptional, IsString, validateSync } from 'class-validator';

/**
 * Validación de variables de entorno al arrancar.
 * Falla rápido si falta algo crítico.
 */
export class EnvVars {
  @IsString() SUPABASE_URL!: string;
  @IsString() SUPABASE_SERVICE_ROLE_KEY!: string;
  @IsString() SUPABASE_STORAGE_BUCKET!: string;

  @IsString() TELEGRAM_BOT_TOKEN!: string;
  @IsString() TELEGRAM_CHAT_ID_DIEGO!: string;
  @IsString() TELEGRAM_CHAT_ID_ADMIN!: string;
  @IsString() TELEGRAM_WEBHOOK_SECRET!: string;

  @IsString() DAILY_CHECK_SECRET!: string;

  @IsString() API_KEY!: string;

  // Auth multi-usuario (Fase 1)
  @IsString() JWT_SECRET!: string;
  @IsOptional() @IsString() JWT_EXPIRES?: string; // ej. '8h' (default 8h)

  @IsOptional() @IsString() APP_TIMEZONE?: string;
  @IsOptional() @IsString() FRONTEND_URL?: string;
  @IsOptional() @IsString() PORT?: string;

  // OCR (Fase 2) — opcional en Fase 1
  @IsOptional() @IsString() OCR_PROVIDER?: string;
  @IsOptional() @IsString() OCR_API_KEY?: string;
  @IsOptional() @IsString() OCR_MODEL?: string;
}

export function validateEnv(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvVars, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(
      'Variables de entorno inválidas:\n' +
        errors.map((e) => `  - ${e.property}: ${Object.values(e.constraints ?? {}).join(', ')}`).join('\n'),
    );
  }
  return validated;
}
