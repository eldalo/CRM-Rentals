import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { CurrentUser, UsuarioActual } from '../common/current-user.decorator';
import { PaginacionQuery } from '../common/pagination';
import { UsuariosService } from './usuarios.service';
import { ActualizarUsuarioDto, CrearUsuarioDto } from './dto';

// Gestión de usuarios: las mutaciones (crear/editar/desactivar) son solo
// superadmin; el menú "Usuarios" en la UI solo lo ve superadmin. La LISTA es
// legible también por admin: la necesita para el select de "responsable" al
// crear/editar apartamentos (no expone password ni token del bot).
// El JwtAuthGuard global ya exige autenticación; RolesGuard aplica el rol.
@Controller('usuarios')
@UseGuards(RolesGuard)
@Roles('superadmin')
export class UsuariosController {
  constructor(private readonly svc: UsuariosService) {}

  @Get()
  @Roles('superadmin', 'admin')
  listar(@Query() q: PaginacionQuery) {
    return this.svc.listar(q.page);
  }

  @Get(':id')
  obtener(@Param('id') id: string) {
    return this.svc.obtener(id);
  }

  @Post()
  crear(@Body() dto: CrearUsuarioDto, @CurrentUser() actor: UsuarioActual) {
    return this.svc.crear(dto, actor);
  }

  @Patch(':id')
  actualizar(
    @Param('id') id: string,
    @Body() dto: ActualizarUsuarioDto,
    @CurrentUser() actor: UsuarioActual,
  ) {
    return this.svc.actualizar(id, dto, actor);
  }

  // Soft delete: desactiva, no borra.
  @Delete(':id')
  desactivar(@Param('id') id: string, @CurrentUser() actor: UsuarioActual) {
    return this.svc.desactivar(id, actor);
  }
}
