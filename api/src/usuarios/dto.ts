import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

const ROLES = ['superadmin', 'admin', 'user'] as const;
export type RolUsuario = (typeof ROLES)[number];

const PUESTOS = ['Administrador', 'Asesor', 'Vendedor'] as const;
export type PuestoUsuario = (typeof PUESTOS)[number];

export class CrearUsuarioDto {
  @IsString() @MinLength(3) usuario!: string;
  @IsEmail() email!: string;
  @IsString() @MinLength(8) password!: string;
  @IsString() @MinLength(1) nombre_completo!: string;
  @IsIn(ROLES) rol!: RolUsuario;
  @IsOptional() @IsIn(PUESTOS) puesto?: PuestoUsuario;
  @IsOptional() @IsBoolean() estado?: boolean;
  // Bot de Telegram del usuario (token write-only) + chat + admin designado.
  @IsOptional() @IsString() telegram_bot_token?: string;
  @IsOptional() @IsString() telegram_chat_id?: string;
  @IsOptional() @IsBoolean() recibe_todos_pagos?: boolean;
}

export class ActualizarUsuarioDto {
  @IsOptional() @IsString() @MinLength(3) usuario?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() @MinLength(8) password?: string;
  @IsOptional() @IsString() @MinLength(1) nombre_completo?: string;
  @IsOptional() @IsIn(ROLES) rol?: RolUsuario;
  @IsOptional() @IsIn(PUESTOS) puesto?: PuestoUsuario;
  @IsOptional() @IsBoolean() estado?: boolean;
  @IsOptional() @IsString() telegram_bot_token?: string;
  @IsOptional() @IsString() telegram_chat_id?: string;
  @IsOptional() @IsBoolean() recibe_todos_pagos?: boolean;
}
