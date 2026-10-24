import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Priority } from '../../common/enums/priority.enum';
import { Project } from '../projects/entities/project.entity';
import { ProjectStatus } from '../projects/project-status.enum';
import { Task } from '../tasks/entities/task.entity';
import { TaskStatus } from '../tasks/task.enums';

const LIST_SIZE = 5;

export interface DashboardOverview {
  stats: {
    activeProjects: number;
    completedProjects: number;
    failedProjects: number;
    pendingTasks: number;
  };
  upcomingTasks: Task[];
  blockers: Task[];
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Project)
    private readonly projects: Repository<Project>,
    @InjectRepository(Task)
    private readonly tasks: Repository<Task>,
  ) {}

  async getOverview(): Promise<DashboardOverview> {
    const [
      activeProjects,
      completedProjects,
      failedProjects,
      pendingTasks,
      upcomingTasks,
      blockers,
    ] = await Promise.all([
      this.projects.countBy({ status: ProjectStatus.Active }),
      this.projects.countBy({ status: ProjectStatus.Completed }),
      this.projects.countBy({ status: ProjectStatus.Failed }),
      this.tasks.countBy({ status: TaskStatus.Todo }),
      this.tasks
        .createQueryBuilder('task')
        .where('task.status != :done', { done: TaskStatus.Done })
        .andWhere('task.dueDate IS NOT NULL')
        .orderBy('task.dueDate', 'ASC')
        .take(LIST_SIZE)
        .getMany(),
      this.tasks
        .createQueryBuilder('task')
        .where('task.priority = :high', { high: Priority.High })
        .andWhere('task.status = :todo', { todo: TaskStatus.Todo })
        .orderBy('task.createdAt', 'ASC')
        .take(LIST_SIZE)
        .getMany(),
    ]);

    return {
      stats: {
        activeProjects,
        completedProjects,
        failedProjects,
        pendingTasks,
      },
      upcomingTasks,
      blockers,
    };
  }
}
