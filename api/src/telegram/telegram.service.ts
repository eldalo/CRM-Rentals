import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface InlineButton {
  text: string;
  callback_data: string;
}

@Injectable()
export class TelegramService {
  private readonly log = new Logger(TelegramService.name);

  constructor(private readonly config: ConfigService) {}

  private get token(): string {
    return this.config.getOrThrow<string>('TELEGRAM_BOT_TOKEN');
  }
  get chatIdDiego(): string {
    return this.config.getOrThrow<string>('TELEGRAM_CHAT_ID_DIEGO');
  }
  get chatIdAdmin(): string {
    return this.config.getOrThrow<string>('TELEGRAM_CHAT_ID_ADMIN');
  }

  /** Envía un mensaje. inlineKeyboard = filas de botones. */
  async enviarMensaje(
    chatId: string,
    text: string,
    inlineKeyboard?: InlineButton[][],
  ): Promise<void> {
    await this.call('sendMessage', {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      reply_markup: inlineKeyboard ? { inline_keyboard: inlineKeyboard } : undefined,
    });
  }

  enviarADiego(text: string, kb?: InlineButton[][]) {
    return this.enviarMensaje(this.chatIdDiego, text, kb);
  }
  enviarAAdmin(text: string, kb?: InlineButton[][]) {
    return this.enviarMensaje(this.chatIdAdmin, text, kb);
  }

  /**
   * Envío con un bot específico (multi-bot). Si falta token o chat, se omite
   * en silencio (p.ej. un asesor sin bot configurado).
   */
  async enviarCon(token: string | null | undefined, chatId: string | null | undefined, text: string): Promise<void> {
    if (!token || !chatId) return;
    await this.call('sendMessage', { chat_id: chatId, text, parse_mode: 'HTML' }, token);
  }

  /** Responde el "loading" de un botón inline pulsado. */
  async responderCallback(callbackQueryId: string, text?: string): Promise<void> {
    await this.call('answerCallbackQuery', { callback_query_id: callbackQueryId, text });
  }

  /** Reemplaza el texto de un mensaje (p.ej. tras confirmar/rechazar). */
  async editarMensaje(chatId: string, messageId: number, text: string): Promise<void> {
    await this.call('editMessageText', {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: 'HTML',
    });
  }

  private async call(method: string, body: Record<string, unknown>, token = this.token): Promise<void> {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const detail = await res.text();
      this.log.error(`Telegram ${method} falló: ${res.status} ${detail}`);
    }
  }
}
