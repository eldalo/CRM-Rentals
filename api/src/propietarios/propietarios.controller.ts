import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { PaginacionQuery } from '../common/pagination';
import { PropietariosService } from './propietarios.service';
import { ActualizarPropietarioDto, CrearPropietarioDto } from './dto';

@Controller('propietarios')
export class PropietariosController {
  constructor(private readonly svc: PropietariosService) {}

  @Get()
  listar(@Query() q: PaginacionQuery) {
    return this.svc.listar(q.page);
  }

  @Get(':id')
  obtener(@Param('id') id: string) {
    return this.svc.obtener(id);
  }

  // Crear/editar/eliminar: solo admin y super_admin.
  @Post()
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'admin')
  crear(@Body() dto: CrearPropietarioDto) {
    return this.svc.crear(dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'admin')
  actualizar(@Param('id') id: string, @Body() dto: ActualizarPropietarioDto) {
    return this.svc.actualizar(id, dto);
  }

  // Soft delete: desactiva, no borra.
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'admin')
  desactivar(@Param('id') id: string) {
    return this.svc.desactivar(id);
  }
}
