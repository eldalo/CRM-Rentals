import { Logger } from '@nestjs/common';
import { OcrProvider, SugerenciaOcr } from '../ocr.provider.interface';

const PROMPT = `Extrae de este comprobante de pago / transferencia colombiana y responde SOLO JSON:
{"monto": número entero COP sin símbolos ni separadores, "fecha": "YYYY-MM-DD", "referencia": "string"}.
Omite el campo si no aparece con claridad.`;

/**
 * Proveedor alterno. OpenAI Vision (no gratis; per-token). Misma interface.
 * Activar con OCR_PROVIDER=openai. Modelo configurable con OCR_MODEL.
 */
export class OpenAiVisionProvider implements OcrProvider {
  private readonly log = new Logger(OpenAiVisionProvider.name);

  constructor(
    private readonly apiKey: string,
    private readonly model = 'gpt-4o-mini',
  ) {}

  async extraer(imagen: Buffer, mimeType: string): Promise<SugerenciaOcr> {
    const dataUrl = `data:${mimeType};base64,${imagen.toString('base64')}`;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: PROMPT },
              { type: 'image_url', image_url: { url: dataUrl } },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const detalle = await res.text();
      this.log.error(`OpenAI falló: ${res.status} ${detalle}`);
      throw new Error(`OCR (OpenAI) falló: ${res.status}`);
    }

    const data: any = await res.json();
    const texto = data?.choices?.[0]?.message?.content ?? '{}';
    return this.parse(texto);
  }

  private parse(texto: string): SugerenciaOcr {
    try {
      const j = JSON.parse(texto);
      return {
        monto: typeof j.monto === 'number' ? j.monto : undefined,
        fecha: j.fecha || undefined,
        referencia: j.referencia || undefined,
        textoCrudo: texto,
      };
    } catch {
      return { textoCrudo: texto };
    }
  }
}
