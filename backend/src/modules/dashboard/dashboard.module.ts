import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';


import { ProjectEntity } from '../project/entities/project.entities';
import { TaskEntity } from '../tasks/entities/tasks.entities';

@Module({

    imports: [TypeOrmModule.forFeature([ProjectEntity, TaskEntity])],
    controllers: [DashboardController],
    providers: [DashboardService],
})
export class DashboardModule {}