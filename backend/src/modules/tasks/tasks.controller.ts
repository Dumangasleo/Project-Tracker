import {Controller, Post, Body, Get, Put, Param, Delete, Query} from '@nestjs/common';
import { TasksService } from './tasks.service';
import {CreateTaskDto} from "./taskDTO/taskDTO";


@Controller('tasks')
export class TasksController {
    constructor(private readonly tasksService: TasksService) {}

    @Get()
    async getAllTasks(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('taskType') taskType?: string
    ) {

        const pageNum = page ? Number(page) : 1;
        const limitNum = limit ? Number(limit) : 20;

        return await this.tasksService.findAll(pageNum, limitNum, taskType);
    }

    @Post('assign')
    async assign(@Body() taskData: CreateTaskDto) {
        return await this.tasksService.assignTask(taskData);
    }

    @Put(':id')
    async update(@Param('id') id: number, @Body() updateData: CreateTaskDto) {
        return await this.tasksService.updateTask(id, updateData);
    }

    @Delete(':id')
    async delete(@Param('id') id: number) {
        return await this.tasksService.deleteTask(id);
    }
}