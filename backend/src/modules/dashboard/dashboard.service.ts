import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectEntity } from '../project/entities/project.entities';
import { TaskEntity } from '../tasks/entities/tasks.entities';

@Injectable()
export class DashboardService {
    constructor(
        @InjectRepository(ProjectEntity)
        private readonly projectRepo: Repository<ProjectEntity>,
        @InjectRepository(TaskEntity)
        private readonly taskRepo: Repository<TaskEntity>,
    ) {}

    async getDashboardOverview() {

        const [
            activeProjectsCount,
            successfulProjectsCount,
            failedProjectsCount,
            pendingTasksCount,
            urgentTasks,
            highPriorityBlockers
        ] = await Promise.all([
            // 1. Mga Ihap (Counts)
            this.projectRepo.count({ where: { Status: 1 } }), // Active
            this.projectRepo.count({ where: { Status: 2 } }), // Successful
            this.projectRepo.count({ where: { Status: 4 } }), // Failed
            this.taskRepo.count({ where: { Status: 0 } }),    // Pending Tasks

            // 2. Listahan (Top 5 Urgent Tasks)
            this.taskRepo.createQueryBuilder('task')
                .where('task.Status != 2')
                .andWhere('task.DueDate IS NOT NULL')
                .orderBy('task.DueDate', 'ASC')
                .take(5)
                .getMany(),

            // 3. Listahan (Top 5 High Priority Blockers)
            this.taskRepo.createQueryBuilder('task')
                .where('task.Priority = 3')
                .andWhere('task.Status = 0')
                .orderBy('task.DateCreated', 'ASC')
                .take(5)
                .getMany()
        ]);

        // I-return ang limpyo nga object padulong sa Vue
        return {
            activeProjectsCount,
            successfulProjectsCount,
            failedProjectsCount,
            pendingTasksCount,
            urgentTasks,
            highPriorityBlockers
        };
    }
}