import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { JwtAuthGuard } from './common/jwt-auth.guard';
import { AppController } from './app.controller';
import { validateEnv } from './config/env.validation';
import { SupabaseModule } from './config/supabase.module';
import { ScopeModule } from './common/scope.service';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { TelegramModule } from './telegram/telegram.module';
import { FechasModule } from './fechas/fechas.module';
import { ApartamentosModule } from './apartamentos/apartamentos.module';
import { UnidadesModule } from './unidades/unidades.module';
import { PropietariosModule } from './propietarios/propietarios.module';
import { InquilinosModule } from './inquilinos/inquilinos.module';
import { PagosModule } from './pagos/pagos.module';
import { EstadoModule } from './estado/estado.module';
import { JobsModule } from './jobs/jobs.module';
import { WebhooksModule } from './webhooks/webhooks.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    SupabaseModule,
    ScopeModule,
    AuthModule,
    UsuariosModule,
    TelegramModule,
    FechasModule,
    ApartamentosModule,
    UnidadesModule,
    PropietariosModule,
    InquilinosModule,
    PagosModule,
    EstadoModule,
    JobsModule,
    WebhooksModule,
  ],
  controllers: [AppController],
  // Guard global JWT. Las rutas @Public() (health, webhooks, jobs/cron) y
  // /auth/login quedan exentas. Reemplaza al ApiKeyGuard.
  providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}
