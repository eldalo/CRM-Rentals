import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Public } from '../common/public.decorator';
import { SecretHeaderGuard } from '../common/secret-header.guard';
import { JobsService } from './jobs.service';

@Controller('jobs')
export class JobsController {
  constructor(private readonly svc: JobsService) {}

  /**
   * POST /jobs/daily-check
   * Protegido por header X-Daily-Check-Secret. Lo dispara el cron externo
   * (Vercel Cron o cron-job.org) 1 vez/día. Ver README.
   * Body opcional: { fecha: 'YYYY-MM-DD' } para forzar una fecha (pruebas).
   */
  @Public()
  @Post('daily-check')
  @UseGuards(SecretHeaderGuard)
  dailyCheck(@Body() body?: { fecha?: string }) {
    return this.svc.dailyCheck(body?.fecha);
  }
}
