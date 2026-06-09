import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CrearUnidadDto {
  @IsString() @MinLength(1) nombre!: string;
  @IsString() @MinLength(1) direccion!: string;
  @IsOptional() @IsString() nombre_administrador?: string;
  @IsOptional() @IsString() contacto_administrador?: string;
  @IsOptional() @IsBoolean() estado?: boolean;
}

export class ActualizarUnidadDto {
  @IsOptional() @IsString() @MinLength(1) nombre?: string;
  @IsOptional() @IsString() @MinLength(1) direccion?: string;
  @IsOptional() @IsString() nombre_administrador?: string;
  @IsOptional() @IsString() contacto_administrador?: string;
  @IsOptional() @IsBoolean() estado?: boolean;
}
