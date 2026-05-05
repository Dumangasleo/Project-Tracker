import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import {TypeOrmModule} from "@nestjs/typeorm";
import {TaskEntity} from "./entities/tasks.entities";



@Module({
  imports: [TypeOrmModule.forFeature([TaskEntity])],
  providers: [TasksService],
  controllers: [TasksController],
  exports: [TypeOrmModule]
})
export class TasksModule {}

