import { Controller, Get } from '@nestjs/common';
import { Public } from './common/public.decorator';

@Controller()
export class AppController {
  @Public()
  @Get()
  root() {
    return { ok: true, servicio: 'arriendos-backend' };
  }

  @Public()
  @Get('health')
  health() {
    return { status: 'up' };
  }
}
