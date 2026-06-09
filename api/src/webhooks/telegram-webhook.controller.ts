import { Body, Controller, ForbiddenException, Headers, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Public } from '../common/public.decorator';
import { PagosService } from '../pagos/pagos.service';
import { TelegramService } from '../telegram/telegram.service';

@Public()
@Controller('webhooks')
export class TelegramWebhookController {
  constructor(
    private readonly config: ConfigService,
    private readonly pagos: PagosService,
    private readonly telegram: TelegramService,
  ) {}

  /**
   * POST /webhooks/telegram
   * Telegram envía el secreto en el header X-Telegram-Bot-Api-Secret-Token
   * (configurado al registrar el webhook con setWebhook). Ver README.
   */
  @Post('telegram')
  async handle(
    @Headers('x-telegram-bot-api-secret-token') secret: string | undefined,
    @Body() update: any,
  ) {
    if (secret !== this.config.getOrThrow<string>('TELEGRAM_WEBHOOK_SECRET')) {
      throw new ForbiddenException('Secreto inválido');
    }

    const cb = update?.callback_query;
    if (!cb) return { ok: true }; // ignoramos mensajes que no sean botones

    const [accion, pagoId] = String(cb.data ?? '').split(':');
    const chatId = String(cb.message?.chat?.id ?? '');
    const messageId = cb.message?.message_id as number | undefined;

    try {
      if (accion === 'confirmar') {
        const p = await this.pagos.confirmar(pagoId);
        await this.responder(cb.id, chatId, messageId, `✅ Pago confirmado (${p.periodo}).`);
      } else if (accion === 'rechazar') {
        const p = await this.pagos.rechazar(pagoId);
        await this.responder(cb.id, chatId, messageId, `❌ Pago rechazado (${p.periodo}).`);
      } else {
        await this.telegram.responderCallback(cb.id, 'Acción desconocida');
      }
    } catch (e: any) {
      await this.telegram.responderCallback(cb.id, `Error: ${e?.message ?? 'desconocido'}`);
    }
    return { ok: true };
  }

  private async responder(cbId: string, chatId: string, messageId: number | undefined, texto: string) {
    await this.telegram.responderCallback(cbId, texto);
    if (chatId && messageId) await this.telegram.editarMensaje(chatId, messageId, texto);
  }
}
