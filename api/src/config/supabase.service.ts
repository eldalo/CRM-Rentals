import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Cliente Supabase con service_role (acceso completo desde backend).
 * Nunca exponer esta clave al frontend.
 */
@Injectable()
export class SupabaseService implements OnModuleInit {
  private clientInstance!: SupabaseClient;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.clientInstance = createClient(
      this.config.getOrThrow<string>('SUPABASE_URL'),
      this.config.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  }

  get client(): SupabaseClient {
    return this.clientInstance;
  }

  get bucket(): string {
    return this.config.getOrThrow<string>('SUPABASE_STORAGE_BUCKET');
  }
}
