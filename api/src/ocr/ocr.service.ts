import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { SupabaseService } from '../config/supabase.service';
import { OCR_PROVIDER, OcrProvider, SugerenciaOcr } from './ocr.provider.interface';

const UN_ANIO = 60 * 60 * 24 * 365;

export interface ResultadoOcr {
  comprobante_url: string;
  sugerencia: SugerenciaOcr;
}

@Injectable()
export class OcrService {
  constructor(
    private readonly supa: SupabaseService,
    @Inject(OCR_PROVIDER) private readonly provider: OcrProvider,
  ) {}

  /** Sube la imagen a Storage (bucket privado) y corre OCR. */
  async subirYExtraer(file: Express.Multer.File): Promise<ResultadoOcr> {
    if (!file) throw new BadRequestException('Falta el archivo (campo "file")');
    if (!file.mimetype?.startsWith('image/')) {
      throw new BadRequestException('El archivo debe ser una imagen');
    }

    const comprobante_url = await this.subir(file);
    const sugerencia = await this.provider.extraer(file.buffer, file.mimetype);
    return { comprobante_url, sugerencia };
  }

  private async subir(file: Express.Multer.File): Promise<string> {
    const ext = (file.originalname.split('.').pop() || 'jpg').toLowerCase();
    const ahora = new Date().toISOString().slice(0, 7); // YYYY-MM
    const path = `${ahora}/${randomUUID()}.${ext}`;

    const { error } = await this.supa.client.storage
      .from(this.supa.bucket)
      .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });
    if (error) throw new Error(`Storage upload falló: ${error.message}`);

    const { data, error: e2 } = await this.supa.client.storage
      .from(this.supa.bucket)
      .createSignedUrl(path, UN_ANIO);
    if (e2 || !data) throw new Error(`No se pudo firmar la URL: ${e2?.message}`);

    return data.signedUrl;
  }
}
