import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { buildDatabaseOptions } from '../../../config/database.config';
import {
  validateDatabaseEnv,
  type DatabaseEnv,
} from '../../../config/env.validation';
import { Project } from '../../projects/entities/project.entity';
import { Position } from '../../team/entities/position.entity';
import { TeamMember } from '../../team/entities/team-member.entity';
import { NotificationsModule } from '../notifications.module';
import { NotificationsConsumer } from './notifications.consumer';
import { NotificationsScheduler } from './notifications.scheduler';

/** Root module of the standalone worker. Schema changes are owned by the API, so it never synchronizes. */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateDatabaseEnv,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<DatabaseEnv, true>) => ({
        ...buildDatabaseOptions({
          DB_HOST: config.get('DB_HOST', { infer: true }),
          DB_PORT: config.get('DB_PORT', { infer: true }),
          DB_USERNAME: config.get('DB_USERNAME', { infer: true }),
          DB_PASSWORD: config.get('DB_PASSWORD', { infer: true }),
          DB_NAME: config.get('DB_NAME', { infer: true }),
        }),
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),
    TypeOrmModule.forFeature([TeamMember, Position, Project]),
    ScheduleModule.forRoot(),
    NotificationsModule,
  ],
  controllers: [NotificationsConsumer],
  providers: [NotificationsScheduler],
})
export class NotificationsWorkerModule {}
