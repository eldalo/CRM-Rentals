import { IsBoolean, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CrearPropietarioDto {
  @IsString() @MinLength(1) nombre_completo!: string;
  @IsOptional() @IsString() celular?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsBoolean() estado?: boolean;
}

export class ActualizarPropietarioDto {
  @IsOptional() @IsString() @MinLength(1) nombre_completo?: string;
  @IsOptional() @IsString() celular?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsBoolean() estado?: boolean;
}
