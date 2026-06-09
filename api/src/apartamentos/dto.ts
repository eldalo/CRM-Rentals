import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, IsUUID, Max, Min, MinLength } from 'class-validator';
import { PaginacionQuery } from '../common/pagination';

export class CrearApartamentoDto {
  @IsUUID() unidad_id!: string;
  @IsString() @MinLength(1) numero!: string;
  @IsNumber() canon!: number;
  @IsInt() @Min(1) @Max(31) dia_corte!: number;
  @IsUUID() propietario_id!: string;
  @IsUUID() responsable_id!: string;
  @IsOptional() @IsBoolean() asegurado?: boolean;
  @IsOptional() @IsBoolean() estado?: boolean;
}

export class ActualizarApartamentoDto {
  @IsOptional() @IsUUID() unidad_id?: string;
  @IsOptional() @IsString() @MinLength(1) numero?: string;
  @IsOptional() @IsNumber() canon?: number;
  @IsOptional() @IsInt() @Min(1) @Max(31) dia_corte?: number;
  @IsOptional() @IsUUID() propietario_id?: string;
  @IsOptional() @IsUUID() responsable_id?: string;
  @IsOptional() @IsBoolean() asegurado?: boolean;
  @IsOptional() @IsBoolean() estado?: boolean;
}

// Lista paginada + filtro opcional por responsable (asesor/admin a cargo).
export class ListarApartamentosQuery extends PaginacionQuery {
  @IsOptional() @IsUUID() responsable_id?: string;
}
