import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { SupabaseModule } from './common/supabase/supabase.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { HomesModule } from './modules/homes/homes.module';
import { DevicesModule } from './modules/devices/devices.module';
import { AutomationsModule } from './modules/automations/automations.module';
import { DiagnosticsModule } from './modules/diagnostics/diagnostics.module';
import { EnergyModule } from './modules/energy/energy.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { InsightsModule } from './modules/insights/insights.module';
import { TelemetryModule } from './modules/telemetry/telemetry.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { AppController } from './app.controller';
import { HealthController } from './health.controller';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.RATE_LIMIT_TTL || '60'),
        limit: parseInt(process.env.RATE_LIMIT_MAX || '100'),
      },
    ]),

    // Supabase client (global)
    SupabaseModule,

    // Feature modules
    AuthModule,
    HomesModule,
    DevicesModule,
    AutomationsModule,
    DiagnosticsModule,
    EnergyModule,
    AlertsModule,
    InsightsModule,
    TelemetryModule,
    RealtimeModule,
  ],
  controllers: [AppController, HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useFactory: (reflector: Reflector) => new JwtAuthGuard(reflector),
      inject: [Reflector],
    },
  ],
})
export class AppModule {}
