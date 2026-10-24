import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository, type SelectQueryBuilder } from 'typeorm';
import type { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { ErrorCode } from '../../common/constants/error-codes';
import {
  type Paginated,
  toPaginated,
} from '../../common/interfaces/paginated.interface';
import { TaskAssignedEvent } from '../../messaging/events/task-assigned.event';
import { NotificationEvent } from '../../messaging/notification-events';
import { NotificationPublisher } from '../../messaging/notification.publisher';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task } from './entities/task.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly tasks: Repository<Task>,
    private readonly publisher: NotificationPublisher,
  ) {}

  async findAll(query: TaskQueryDto): Promise<Paginated<Task>> {
    const builder = this.withRelations()
      .orderBy('task.createdAt', 'DESC')
      .skip(query.skip)
      .take(query.limit);

    if (query.type !== undefined) {
      builder.where('task.type = :type', { type: query.type });
    }

    const [items, total] = await builder.getManyAndCount();
    return toPaginated(items, total, query);
  }

  async create(dto: CreateTaskDto, createdById: number): Promise<Task> {
    await this.assertNameAvailable(dto.name);

    const { dueDate, ...rest } = dto;
    const saved = await this.tasks.save(
      this.tasks.create({
        ...rest,
        dueDate: dueDate ? new Date(dueDate) : null,
        createdById,
      }),
    );

    this.publisher.publish(
      NotificationEvent.TaskAssigned,
      new TaskAssignedEvent(
        saved.id,
        saved.name,
        saved.assigneeId,
        createdById,
      ),
    );

    return this.findOne(saved.id);
  }

  async update(id: number, dto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(id);
    if (dto.name && dto.name !== task.name) {
      await this.assertNameAvailable(dto.name, id);
    }

    if (Object.keys(dto).length > 0)
      await this.tasks.update(id, toColumns(dto));
    return this.findOne(id);
  }

  async claim(id: number, memberId: number): Promise<Task> {
    const result = await this.tasks.update(
      { id, assigneeId: IsNull() },
      { assigneeId: memberId },
    );

    if (!result.affected) {
      await this.findOne(id);
      throw new ConflictException({
        message: 'This task is already assigned.',
        code: ErrorCode.Conflict,
      });
    }
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.tasks.delete(id);
    if (!result.affected) throw notFound(id);
  }

  private async findOne(id: number): Promise<Task> {
    const task = await this.withRelations()
      .where('task.id = :id', { id })
      .getOne();
    if (!task) throw notFound(id);
    return task;
  }

  private withRelations(): SelectQueryBuilder<Task> {
    return this.tasks
      .createQueryBuilder('task')
      .leftJoin('task.project', 'project')
      .addSelect(['project.id', 'project.name'])
      .leftJoin('task.assignee', 'assignee')
      .addSelect(['assignee.id', 'assignee.firstName', 'assignee.lastName'])
      .leftJoin('task.creator', 'creator')
      .addSelect(['creator.id', 'creator.firstName', 'creator.lastName']);
  }

  private async assertNameAvailable(
    name: string,
    exceptId?: number,
  ): Promise<void> {
    const taken = await this.tasks.existsBy(
      exceptId ? { name, id: Not(exceptId) } : { name },
    );
    if (taken) {
      throw new ConflictException({
        message: 'A task with this name already exists.',
        code: ErrorCode.Conflict,
      });
    }
  }
}

function toColumns(dto: UpdateTaskDto): QueryDeepPartialEntity<Task> {
  const { dueDate, ...rest } = dto;
  return dueDate === undefined
    ? { ...rest }
    : { ...rest, dueDate: dueDate ? new Date(dueDate) : null };
}

function notFound(id: number): NotFoundException {
  return new NotFoundException({
    message: `Task ${id} was not found.`,
    code: ErrorCode.NotFound,
  });
}
