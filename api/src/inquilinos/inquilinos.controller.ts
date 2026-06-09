import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { InquilinosService } from './inquilinos.service';
import { ActualizarInquilinoDto, CrearInquilinoDto } from './dto';

// Registro de inquilinos (personas). CRUD para cualquier usuario autenticado
// (el JwtAuthGuard global ya exige sesión). Sin scoping por asesor.
@Controller('inquilinos')
export class InquilinosController {
  constructor(private readonly svc: InquilinosService) {}

  @Get()
  listar() {
    return this.svc.listar();
  }

  @Get(':id')
  obtener(@Param('id') id: string) {
    return this.svc.obtener(id);
  }

  @Post()
  crear(@Body() dto: CrearInquilinoDto) {
    return this.svc.crear(dto);
  }

  @Patch(':id')
  actualizar(@Param('id') id: string, @Body() dto: ActualizarInquilinoDto) {
    return this.svc.actualizar(id, dto);
  }

  // Soft delete: desactiva, no borra.
  @Delete(':id')
  eliminar(@Param('id') id: string) {
    return this.svc.eliminar(id);
  }
}
