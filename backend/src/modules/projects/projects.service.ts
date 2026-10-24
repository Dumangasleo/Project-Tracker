import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { ErrorCode } from '../../common/constants/error-codes';
import {
  type Paginated,
  toPaginated,
} from '../../common/interfaces/paginated.interface';
import { ProjectCreatedEvent } from '../../messaging/events/project-created.event';
import { NotificationEvent } from '../../messaging/notification-events';
import { NotificationPublisher } from '../../messaging/notification.publisher';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectQueryDto } from './dto/project-query.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Project } from './entities/project.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projects: Repository<Project>,
    private readonly publisher: NotificationPublisher,
  ) {}

  async findAll(query: ProjectQueryDto): Promise<Paginated<Project>> {
    const builder = this.projects
      .createQueryBuilder('project')
      .leftJoin('project.lead', 'lead')
      .addSelect(['lead.id', 'lead.firstName', 'lead.lastName'])
      .orderBy('project.createdAt', 'DESC')
      .skip(query.skip)
      .take(query.limit);

    const search = query.search?.trim();
    if (search) {
      builder.where('project.name LIKE :search', { search: `%${search}%` });
    }

    const [items, total] = await builder.getManyAndCount();
    return toPaginated(items, total, query);
  }

  async create(dto: CreateProjectDto): Promise<Project> {
    await this.assertNameAvailable(dto.name);

    const saved = await this.projects.save(this.projects.create(dto));

    this.publisher.publish(
      NotificationEvent.ProjectCreated,
      new ProjectCreatedEvent(saved.id, saved.name, saved.leadId),
    );

    return this.findOne(saved.id);
  }

  async update(id: number, dto: UpdateProjectDto): Promise<Project> {
    const project = await this.findOne(id);
    if (dto.name && dto.name !== project.name) {
      await this.assertNameAvailable(dto.name, id);
    }

    if (Object.keys(dto).length > 0) await this.projects.update(id, { ...dto });
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.projects.delete(id);
    if (!result.affected) throw notFound(id);
  }

  private async findOne(id: number): Promise<Project> {
    const project = await this.projects
      .createQueryBuilder('project')
      .leftJoin('project.lead', 'lead')
      .addSelect(['lead.id', 'lead.firstName', 'lead.lastName'])
      .where('project.id = :id', { id })
      .getOne();
    if (!project) throw notFound(id);
    return project;
  }

  private async assertNameAvailable(
    name: string,
    exceptId?: number,
  ): Promise<void> {
    const taken = await this.projects.existsBy(
      exceptId ? { name, id: Not(exceptId) } : { name },
    );
    if (taken) {
      throw new ConflictException({
        message: 'A project with this name already exists.',
        code: ErrorCode.Conflict,
      });
    }
  }
}

function notFound(id: number): NotFoundException {
  return new NotFoundException({
    message: `Project ${id} was not found.`,
    code: ErrorCode.NotFound,
  });
}
