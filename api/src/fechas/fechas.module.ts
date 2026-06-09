import { Module } from '@nestjs/common';
import { FechasService } from './fechas.service';

@Module({
  providers: [FechasService],
  exports: [FechasService],
})
export class FechasModule {}
