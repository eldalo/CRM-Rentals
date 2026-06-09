import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { Public } from '../common/public.decorator';
import { CurrentUser, UsuarioActual } from '../common/current-user.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly svc: AuthService) {}

  // Público: es la puerta de entrada, no puede exigir token.
  @Public()
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.svc.login(dto);
  }

  // Devuelve el usuario autenticado (valida token + estado en el guard).
  @Get('me')
  me(@CurrentUser() user: UsuarioActual) {
    return user;
  }
}
