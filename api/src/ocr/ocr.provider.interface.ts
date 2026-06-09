/**
 * Abstracción del proveedor de OCR/visión. La implementación concreta
 * (OpenAI Vision, Google Vision, etc.) vive en providers/ y se selecciona
 * con la variable de entorno OCR_PROVIDER. La clave va en OCR_API_KEY.
 *
 * Fase 2: PagosController.ocr() inyectará un OcrProvider, subirá la imagen
 * a Supabase Storage y devolverá la sugerencia.
 */
export interface SugerenciaOcr {
  monto?: number;
  fecha?: string; // 'YYYY-MM-DD'
  referencia?: string;
  textoCrudo?: string;
}

export interface OcrProvider {
  /** Extrae datos del comprobante a partir de la imagen (bytes). */
  extraer(imagen: Buffer, mimeType: string): Promise<SugerenciaOcr>;
}

export const OCR_PROVIDER = Symbol('OCR_PROVIDER');
