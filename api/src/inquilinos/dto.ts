import { IsBoolean, IsEmail, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CrearInquilinoDto {
  @IsUUID() apartamento_id!: string;
  @IsString() @MinLength(1) nombre_completo!: string;
  @IsOptional() @IsString() celular?: string;
  @IsOptional() @IsString() cedula?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() nombre_referencia_personal?: string;
  @IsOptional() @IsString() celular_referencia_personal?: string;
  @IsOptional() @IsString() nombre_2_referencia_personal?: string;
  @IsOptional() @IsString() celular_2_referencia_personal?: string;
  @IsOptional() @IsBoolean() estado?: boolean;
}

export class ActualizarInquilinoDto {
  @IsOptional() @IsUUID() apartamento_id?: string;
  @IsOptional() @IsString() @MinLength(1) nombre_completo?: string;
  @IsOptional() @IsString() celular?: string;
  @IsOptional() @IsString() cedula?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() nombre_referencia_personal?: string;
  @IsOptional() @IsString() celular_referencia_personal?: string;
  @IsOptional() @IsString() nombre_2_referencia_personal?: string;
  @IsOptional() @IsString() celular_2_referencia_personal?: string;
  @IsOptional() @IsBoolean() estado?: boolean;
}
