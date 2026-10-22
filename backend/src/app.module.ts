import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TasksModule } from './modules/tasks/tasks.module';
import {TeamModule} from "./modules/team/team.module";


import { SettingsModule } from './modules/settings/settings.module';
import {TypeOrmModule} from "@nestjs/typeorm";
import {ConfigModule, ConfigService} from "@nestjs/config";
import {EncryptionInterceptor} from "./common/interceptors/encryption.interceptor";
import {DecryptionInterceptor} from "./common/interceptors/decryption.interceptor";
import { ProjectModule } from './modules/project/project.module';
import { MessagingModule } from './messaging/MessagingModule';
import { NotificationModule } from './modules/notification/NotificationModule';
import { AuthModule } from './modules/auth/AuthModule';


@Module({
  imports: [

      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: '.env',// so we can use the .env file in any module
      }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mssql',
        host: configService.get<string>('DB_HOST'),
        port: Number(configService.get<string | number>('DB_PORT')),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        autoLoadEntities: true,
        // Dev auto-syncs the schema. Prod MUST set DB_SYNC=false and use migrations.
        synchronize: (configService.get<string>('DB_SYNC') ?? 'true') === 'true',
        options: {
          encrypt: false,
          trustServerCertificate: true,
        },
      }),
    }),
      DashboardModule, TasksModule, TeamModule, SettingsModule, ProjectModule,
      // Producer-side messaging + the notification HTTP read API.
      MessagingModule, NotificationModule,
      // Auth registers the GLOBAL JwtAuthGuard (secure by default).
      AuthModule],

  controllers: [AppController],
  providers: [
      AppService,
    //   EncryptionInterceptor,
    //   DecryptionInterceptor,
    // {
    //   provide: APP_INTERCEPTOR,
    //   useClass: EncryptionInterceptor,
    // },
    // {
    //   provide: APP_INTERCEPTOR,
    //   useClass: DecryptionInterceptor,
    // },
    // NOTE: Project providers/controllers live in ProjectModule (imported above).
  ],
})
export class AppModule {}
