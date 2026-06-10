import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { PaginacionQuery } from '../common/pagination';
import { UnidadesService } from './unidades.service';
import { ActualizarUnidadDto, CrearUnidadDto } from './dto';

@Controller('unidades')
export class UnidadesController {
  constructor(private readonly svc: UnidadesService) {}

  @Get()
  listar(@Query() q: PaginacionQuery) {
    return this.svc.listar(q.page);
  }

  @Get(':id')
  obtener(@Param('id') id: string) {
    return this.svc.obtener(id);
  }

  // Crear/editar/eliminar: solo admin y superadmin.
  @Post()
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin')
  crear(@Body() dto: CrearUnidadDto) {
    return this.svc.crear(dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin')
  actualizar(@Param('id') id: string, @Body() dto: ActualizarUnidadDto) {
    return this.svc.actualizar(id, dto);
  }

  // Soft delete: desactiva, no borra.
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin')
  desactivar(@Param('id') id: string) {
    return this.svc.desactivar(id);
  }
}
