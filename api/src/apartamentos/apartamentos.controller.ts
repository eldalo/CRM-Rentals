import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApartamentosService } from './apartamentos.service';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { CurrentUser, UsuarioActual } from '../common/current-user.decorator';
import { ActualizarApartamentoDto, CrearApartamentoDto, ListarApartamentosQuery } from './dto';

@Controller('apartamentos')
export class ApartamentosController {
  constructor(private readonly svc: ApartamentosService) {}

  @Get()
  listar(@Query() q: ListarApartamentosQuery, @CurrentUser() user: UsuarioActual) {
    return this.svc.listar(q.page, user, q.responsable_id);
  }

  @Get(':id')
  obtener(@Param('id') id: string, @CurrentUser() user: UsuarioActual) {
    return this.svc.obtener(id, user);
  }

  // Crear/editar: admin, superadmin y user (el responsable queda fijo como
  // responsable y solo edita los suyos; la lógica vive en el service).
  @Post()
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin', 'user')
  crear(@Body() dto: CrearApartamentoDto, @CurrentUser() user: UsuarioActual) {
    return this.svc.crear(dto, user);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin', 'user')
  actualizar(
    @Param('id') id: string,
    @Body() dto: ActualizarApartamentoDto,
    @CurrentUser() user: UsuarioActual,
  ) {
    return this.svc.actualizar(id, dto, user);
  }

  // Eliminar: solo admin y superadmin.
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin')
  eliminar(@Param('id') id: string) {
    return this.svc.eliminar(id);
  }
}
