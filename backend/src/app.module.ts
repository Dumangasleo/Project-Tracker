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
        synchronize: true,
        options: {
          encrypt: false,
          trustServerCertificate: true,
        },
      }),
    }),
      DashboardModule, TasksModule, TeamModule, SettingsModule],

  controllers: [AppController],
  providers: [
      AppService,
      EncryptionInterceptor, // need e register bilang isang regular provider para makita ng nestJS kung saan ang encryption and Decryption interceptors
      DecryptionInterceptor,
    {
      provide: APP_INTERCEPTOR,
      useClass: EncryptionInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: DecryptionInterceptor,
    },
  ],
})
export class AppModule {}
