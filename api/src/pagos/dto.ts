import { IsBoolean, IsIn, IsNumber, IsOptional, IsString, IsUUID, Matches } from 'class-validator';

export class CrearPagoDto {
  @IsUUID() apartamento_id!: string;

  @Matches(/^\d{4}-\d{2}$/, { message: "periodo debe ser 'YYYY-MM'" })
  periodo!: string;

  @IsOptional() @IsNumber() monto?: number;
  @IsOptional() @IsString() comprobante_url?: string;
  @IsOptional() @IsBoolean() factura_electronica?: boolean;

  // 'confirmado' cuando lo registra el form (ya validado por Diego).
  // Por defecto 'pendiente' (se confirma luego desde Telegram).
  @IsOptional() @IsIn(['pendiente', 'confirmado', 'rechazado'])
  estado?: 'pendiente' | 'confirmado' | 'rechazado';
}
