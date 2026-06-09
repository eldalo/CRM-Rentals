import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  // Acepta usuario O email; el servicio decide cuál es.
  @IsString() identificador!: string;
  @IsString() @MinLength(1) password!: string;
}
