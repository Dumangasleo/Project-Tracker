import {BadRequestException, Injectable, NotFoundException} from '@nestjs/common';
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import {CreateTaskDto} from "./taskDTO/taskDTO";
import {TaskEntity} from "./entities/tasks.entities";

@Injectable()
export class TasksService {
    constructor(
        @InjectRepository(TaskEntity)
        private readonly taskRepository: Repository<TaskEntity>,
    ) {}

    async findAll(page: number = 1, limit: number = 20, taskType?: string): Promise<TaskEntity[]> {
        const skip = (page - 1) * limit;

        const whereCondition: any = {};

        if (taskType && taskType !== 'ALL') {
            whereCondition.TaskType = Number(taskType);
        }

        return await this.taskRepository.find({
            where: whereCondition,
            skip: skip,
            take: limit,
            order: { DateCreated: 'ASC' }
        });
    }

    async assignTask(task: CreateTaskDto): Promise<TaskEntity> {
        // LOGIC: Check if a task with the same title already exists for this user
        const existingTask = await this.taskRepository.findOne({
            where: { TaskName: task.TaskName }
        });

        if (existingTask) {
            throw new BadRequestException('A task with this title already exists.');
        }

        // LOGIC: Set a default status if none is provided
        const newTask = this.taskRepository.create({
            ...task,
            Status: task.Status ?? 0,
            TaskType: task.TaskType ?? 0,
            DateCreated: new Date(),
        });

        return await this.taskRepository.save(newTask);
    }

    async updateTask(id: number, updateData: CreateTaskDto): Promise<TaskEntity> {
        const task = await this.taskRepository.findOne({where: {id} });

        if (!task) {
            throw new NotFoundException(`Cant Find existing Task ${id}`);
        }

        Object.assign(task, updateData);

        return await this.taskRepository.save(task);
    }

    async deleteTask(id: number): Promise<void> {
        const result = await this.taskRepository.delete(id)

        if (result.affected === 0) {
            throw new NotFoundException(`Cant delete because this ID ${id} is not existing`);
        }
    }

}
