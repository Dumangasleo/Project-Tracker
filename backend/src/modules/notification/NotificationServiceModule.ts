import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationModule } from './NotificationModule';
import { NotificationConsumer } from './NotificationConsumer';
import { NotificationScheduler } from './NotificationScheduler';

/**
 * Root module for the STANDALONE notification microservice
 * (bootstrapped by NotificationMain.ts).
 *
 * It owns its own DB connection and adds the two things that only the
 * microservice runs: the RabbitMQ consumer and the reminder scheduler.
 */
@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                type: 'mssql',
                host: config.get<string>('DB_HOST'),
                port: Number(config.get<string | number>('DB_PORT')),
                username: config.get<string>('DB_USERNAME'),
                password: config.get<string>('DB_PASSWORD'),
                database: config.get<string>('DB_NAME'),
                autoLoadEntities: true,
                synchronize: (config.get<string>('DB_SYNC') ?? 'true') === 'true',
                options: { encrypt: false, trustServerCertificate: true },
            }),
        }),
        ScheduleModule.forRoot(),
        NotificationModule,
    ],
    controllers: [NotificationConsumer],
    providers: [NotificationScheduler],
})
export class NotificationServiceModule {}
