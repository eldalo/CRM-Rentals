import {
  Body,
  Controller,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OcrService } from '../ocr/ocr.service';
import { PagosService } from './pagos.service';
import { CurrentUser, UsuarioActual } from '../common/current-user.decorator';
import { CrearPagoDto } from './dto';

@Controller('pagos')
export class PagosController {
  constructor(
    private readonly svc: PagosService,
    private readonly ocr: OcrService,
  ) {}

  @Post()
  registrar(@Body() dto: CrearPagoDto, @CurrentUser() user: UsuarioActual) {
    return this.svc.registrar(dto, user);
  }

  /**
   * POST /pagos/ocr — Fase 2.
   * Multipart con campo "file" (imagen del comprobante). Sube a Supabase
   * Storage y corre OCR. Devuelve { comprobante_url, sugerencia }.
   *
   * NOTA: el plan original nombraba /pagos/:id/ocr, pero en el flujo real el
   * OCR pre-llena el form ANTES de crear el pago, así que no hay :id todavía.
   * El front usa esta respuesta para pre-llenar y luego llama POST /pagos.
   */
  @Post('ocr')
  @UseInterceptors(FileInterceptor('file'))
  procesarOcr(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 8 * 1024 * 1024 })], // 8 MB
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.ocr.subirYExtraer(file);
  }

  @Get(':id')
  obtener(@Param('id') id: string, @CurrentUser() user: UsuarioActual) {
    return this.svc.obtener(id, user);
  }
}
