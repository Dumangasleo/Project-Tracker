import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import {TypeOrmModule} from "@nestjs/typeorm";
import {AssignedTask} from "./entities/tasks.entities";


@Module({
  imports: [TypeOrmModule.forFeature([AssignedTask])],
  providers: [TasksService],
  controllers: [TasksController],
  exports: [TypeOrmModule]
})
export class TasksModule {}

