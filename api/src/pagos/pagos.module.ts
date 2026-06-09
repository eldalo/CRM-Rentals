import { Module } from '@nestjs/common';
import { ApartamentosModule } from '../apartamentos/apartamentos.module';
import { FechasModule } from '../fechas/fechas.module';
import { OcrModule } from '../ocr/ocr.module';
import { PagosController } from './pagos.controller';
import { PagosService } from './pagos.service';

@Module({
  imports: [ApartamentosModule, FechasModule, OcrModule],
  controllers: [PagosController],
  providers: [PagosService],
  exports: [PagosService],
})
export class PagosModule {}
