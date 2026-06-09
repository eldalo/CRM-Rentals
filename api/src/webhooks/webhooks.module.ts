import { Module } from '@nestjs/common';
import { PagosModule } from '../pagos/pagos.module';
import { TelegramWebhookController } from './telegram-webhook.controller';

@Module({
  imports: [PagosModule],
  controllers: [TelegramWebhookController],
})
export class WebhooksModule {}
