import { Module } from '@nestjs/common';
import { InquilinosController } from './inquilinos.controller';
import { InquilinosService } from './inquilinos.service';

@Module({
  controllers: [InquilinosController],
  providers: [InquilinosService],
  exports: [InquilinosService],
})
export class InquilinosModule {}
