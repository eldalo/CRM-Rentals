import { Module } from '@nestjs/common';
import { FechasModule } from '../fechas/fechas.module';
import { EstadoController } from './estado.controller';
import { EstadoService } from './estado.service';

@Module({
  imports: [FechasModule],
  controllers: [EstadoController],
  providers: [EstadoService],
})
export class EstadoModule {}
