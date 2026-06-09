import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OCR_PROVIDER, OcrProvider } from './ocr.provider.interface';
import { OcrService } from './ocr.service';
import { GeminiVisionProvider } from './providers/gemini-vision.provider';
import { OpenAiVisionProvider } from './providers/openai-vision.provider';

/**
 * Selecciona el proveedor de OCR según OCR_PROVIDER (gemini | openai).
 * Por defecto: gemini (free tier). La clave va en OCR_API_KEY y el modelo
 * opcional en OCR_MODEL.
 */
const providerFactory = {
  provide: OCR_PROVIDER,
  useFactory: (config: ConfigService): OcrProvider => {
    const nombre = (config.get<string>('OCR_PROVIDER') ?? 'gemini').toLowerCase();
    const apiKey = config.get<string>('OCR_API_KEY') ?? '';
    const model = config.get<string>('OCR_MODEL');

    if (!apiKey) {
      new Logger('OcrModule').warn(
        'OCR_API_KEY no configurada: el endpoint de OCR fallará hasta definirla.',
      );
    }

    switch (nombre) {
      case 'openai':
        return new OpenAiVisionProvider(apiKey, model ?? 'gpt-4o-mini');
      case 'gemini':
      default:
        return new GeminiVisionProvider(apiKey, model ?? 'gemini-2.5-flash');
    }
  },
  inject: [ConfigService],
};

@Module({
  providers: [providerFactory, OcrService],
  exports: [OcrService],
})
export class OcrModule {}
