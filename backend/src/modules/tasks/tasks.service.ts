import {BadRequestException, Injectable, NotFoundException} from '@nestjs/common';
import {InjectRepository} from "@nestjs/typeorm";
import {AssignedTask} from "./entities/tasks.entities";
import {Repository} from "typeorm";
import {CreateTaskDto} from "./taskDTO/taskDTO";

@Injectable()
export class TasksService {
    constructor(
        @InjectRepository(AssignedTask)
        private readonly taskRepository: Repository<AssignedTask>,
    ) {}

    async findAll(): Promise<AssignedTask[]> {
        return await this.taskRepository.find({
            order: { DateCreated: 'ASC' } // TASK CHANGES
        });
    }

    async assignTask(task: CreateTaskDto): Promise<AssignedTask> {
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
            DateCreated: new Date(),
        });

        return await this.taskRepository.save(newTask);
    }

    async updateTask(id: number, updateData: CreateTaskDto): Promise<AssignedTask> {
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
