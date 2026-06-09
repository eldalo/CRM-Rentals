import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { EstadoService } from './estado.service';
import { CurrentUser, UsuarioActual } from '../common/current-user.decorator';

@Controller('estado')
export class EstadoController {
  constructor(private readonly svc: EstadoService) {}

  @Get()
  estado(
    @Query('periodo') periodo: string | undefined,
    @Query('responsable_id') responsableId: string | undefined,
    @CurrentUser() user: UsuarioActual,
  ) {
    if (!periodo || !/^\d{4}-\d{2}$/.test(periodo)) {
      throw new BadRequestException("Falta query 'periodo' con formato 'YYYY-MM'");
    }
    const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (responsableId && !UUID.test(responsableId)) {
      throw new BadRequestException("'responsable_id' inválido");
    }
    return this.svc.delPeriodo(periodo, user, responsableId);
  }
}
