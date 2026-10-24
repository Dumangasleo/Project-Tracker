import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientRequestGuard } from './common/guards/client-request.guard';
import { buildDatabaseOptions } from './config/database.config';
import { validateApiEnv, type ApiEnv } from './config/env.validation';
import { MessagingModule } from './messaging/messaging.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { HealthModule } from './modules/health/health.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { SettingsModule } from './modules/settings/settings.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { TeamModule } from './modules/team/team.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateApiEnv,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<ApiEnv, true>) => ({
        ...buildDatabaseOptions({
          DB_HOST: config.get('DB_HOST', { infer: true }),
          DB_PORT: config.get('DB_PORT', { infer: true }),
          DB_USERNAME: config.get('DB_USERNAME', { infer: true }),
          DB_PASSWORD: config.get('DB_PASSWORD', { infer: true }),
          DB_NAME: config.get('DB_NAME', { infer: true }),
        }),
        autoLoadEntities: true,
        synchronize: config.get('DB_SYNC', { infer: true }),
      }),
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    MessagingModule,
    AuthModule,
    TeamModule,
    ProjectsModule,
    TasksModule,
    DashboardModule,
    NotificationsModule,
    SettingsModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: ClientRequestGuard },
    { provide: APP_GUARD, useExisting: JwtAuthGuard },
  ],
})
export class AppModule {}
