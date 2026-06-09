import { Logger, ServiceUnavailableException } from '@nestjs/common';
import { OcrProvider, SugerenciaOcr } from '../ocr.provider.interface';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const PROMPT = `Eres un extractor de datos de comprobantes de pago / transferencias bancarias colombianas.
Devuelve SOLO los campos pedidos a partir de la imagen:
- monto: el valor pagado como número entero en pesos COP, SIN símbolos ni separadores de miles (ej. 1500000).
- fecha: fecha de la transacción en formato YYYY-MM-DD.
- referencia: número de referencia / comprobante / aprobación.
Si un campo no aparece con claridad, omítelo.`;

/**
 * Proveedor por defecto. Usa Google Gemini (AI Studio) — free tier real,
 * API key sin tarjeta. Modelo configurable con OCR_MODEL.
 */
export class GeminiVisionProvider implements OcrProvider {
  private readonly log = new Logger(GeminiVisionProvider.name);

  constructor(
    private readonly apiKey: string,
    private readonly model = 'gemini-2.5-flash',
  ) {}

  async extraer(imagen: Buffer, mimeType: string): Promise<SugerenciaOcr> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const body = {
      contents: [
        {
          parts: [
            { inline_data: { mime_type: mimeType, data: imagen.toString('base64') } },
            { text: PROMPT },
          ],
        },
      ],
      generationConfig: {
        response_mime_type: 'application/json',
        response_schema: {
          type: 'OBJECT',
          properties: {
            monto: { type: 'NUMBER' },
            fecha: { type: 'STRING' },
            referencia: { type: 'STRING' },
          },
        },
      },
    };

    // El free tier devuelve 503/429 intermitentes: reintentar con backoff.
    const MAX = 3;
    for (let intento = 1; intento <= MAX; intento++) {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data: any = await res.json();
        const texto = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
        return this.parse(texto);
      }

      const detalle = await res.text();
      const transitorio = res.status === 503 || res.status === 429;
      this.log.warn(`Gemini ${res.status} (intento ${intento}/${MAX}): ${detalle.slice(0, 120)}`);

      if (transitorio && intento < MAX) {
        await sleep(1500 * intento);
        continue;
      }
      throw new ServiceUnavailableException(
        'OCR no disponible en este momento. Ingresa los datos manualmente.',
      );
    }
    // inalcanzable
    throw new ServiceUnavailableException('OCR no disponible.');
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
