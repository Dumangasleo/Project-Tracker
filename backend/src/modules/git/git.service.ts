import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ErrorCode } from '../../common/constants/error-codes';
import { Project } from '../projects/entities/project.entity';
import { TeamMember } from '../team/entities/team-member.entity';
import { DEFAULT_CI_WORKFLOW } from './ci-workflow.template';
import { GitAccountDto } from './dto/git-account.dto';
import { ProjectRepositoryDto } from './dto/project-repository.dto';
import { GiteaClient, GiteaError, type GiteaRepo } from './gitea.client';

export interface GitServerStatus {
  enabled: boolean;
  webUrl: string | null;
  org: string;
  version: string | null;
}

export interface GitAccount {
  username: string;
  webUrl: string;
}

export interface ProjectRepository {
  fullName: string;
  htmlUrl: string;
  cloneUrl: string;
  sshUrl: string;
  defaultBranch: string;
  empty: boolean;
  private: boolean;
}

@Injectable()
export class GitService {
  constructor(
    private readonly gitea: GiteaClient,
    @InjectRepository(TeamMember)
    private readonly members: Repository<TeamMember>,
    @InjectRepository(Project)
    private readonly projects: Repository<Project>,
  ) {}

  async status(): Promise<GitServerStatus> {
    if (!this.gitea.enabled) {
      return {
        enabled: false,
        webUrl: null,
        org: this.gitea.org,
        version: null,
      };
    }
    try {
      const { version } = await this.gitea.version();
      return {
        enabled: true,
        webUrl: this.gitea.baseUrl,
        org: this.gitea.org,
        version,
      };
    } catch {
      return {
        enabled: true,
        webUrl: this.gitea.baseUrl,
        org: this.gitea.org,
        version: null,
      };
    }
  }

  async getAccount(memberId: number): Promise<GitAccount | null> {
    const member = await this.findMember(memberId);
    return member.gitUsername ? this.toAccount(member.gitUsername) : null;
  }

  /** Creates the member's Git account, or resets its password when it already exists. */
  async saveAccount(memberId: number, dto: GitAccountDto): Promise<GitAccount> {
    const member = await this.findMember(memberId);

    return this.call(async () => {
      if (member.gitUsername) {
        await this.gitea.setPassword(member.gitUsername, dto.password);
        return this.toAccount(member.gitUsername);
      }

      const username =
        dto.username ?? (await this.suggestUsername(member.email));
      if (await this.gitea.findUser(username)) {
        throw new ConflictException({
          message: `The Git username "${username}" is taken. Pick another one.`,
          code: ErrorCode.Conflict,
        });
      }

      await this.gitea.createUser({
        username,
        email: member.email,
        password: dto.password,
        fullName: `${member.firstName} ${member.lastName}`.trim(),
      });
      await this.gitea.addToDevelopers(username);
      await this.members.update(member.id, { gitUsername: username });
      return this.toAccount(username);
    });
  }

  async getRepository(projectId: number): Promise<ProjectRepository | null> {
    const project = await this.findProject(projectId);
    if (!project.repository) return null;
    const repo = await this.call(() => this.gitea.getRepo(project.repository!));
    return repo ? toRepository(repo) : null;
  }

  async attachRepository(
    projectId: number,
    dto: ProjectRepositoryDto,
  ): Promise<ProjectRepository> {
    const project = await this.findProject(projectId);
    if (project.repository) {
      throw new ConflictException({
        message: `This project already uses ${project.repository}. Unlink it first.`,
        code: ErrorCode.Conflict,
      });
    }

    const repo = await this.call(async () => {
      if (dto.mode === 'link') {
        if (!dto.fullName) {
          throw new BadRequestException({
            message: 'Give the repository as owner/name.',
          });
        }
        const existing = await this.gitea.getRepo(dto.fullName);
        if (!existing) {
          throw new NotFoundException({
            message: `Repository ${dto.fullName} was not found on the Git server.`,
            code: ErrorCode.NotFound,
          });
        }
        if (existing.owner.login !== this.gitea.org) {
          await this.gitea.ensureRepoWebhook(existing.full_name);
        }
        return existing;
      }

      const created = await this.gitea.createOrgRepo({
        name: dto.name ?? slugify(project.name, project.id),
        description: (project.description ?? '').slice(0, 255),
        private: true,
      });
      await this.gitea.createFile(
        created.full_name,
        '.gitea/workflows/ci.yml',
        DEFAULT_CI_WORKFLOW,
        'Add CI pipeline',
      );
      return (await this.gitea.getRepo(created.full_name)) ?? created;
    });

    await this.projects.update(project.id, { repository: repo.full_name });
    return toRepository(repo);
  }

  async detachRepository(projectId: number): Promise<void> {
    const project = await this.findProject(projectId);
    await this.projects.update(project.id, { repository: null });
  }

  private async suggestUsername(email: string): Promise<string> {
    const base =
      email
        .split('@')[0]
        .replace(/[^A-Za-z0-9._-]/g, '-')
        .replace(/^[^A-Za-z0-9]+/, '')
        .slice(0, 30) || 'member';
    for (let suffix = 0; suffix < 50; suffix++) {
      const candidate = suffix === 0 ? base : `${base}${suffix + 1}`;
      if (!(await this.gitea.findUser(candidate))) return candidate;
    }
    throw new ConflictException({
      message: 'Pick a Git username.',
      code: ErrorCode.Conflict,
    });
  }

  private toAccount(username: string): GitAccount {
    return { username, webUrl: this.gitea.baseUrl ?? '' };
  }

  private async findMember(id: number): Promise<TeamMember> {
    const member = await this.members.findOneBy({ id });
    if (!member) {
      throw new NotFoundException({
        message: 'Member not found.',
        code: ErrorCode.NotFound,
      });
    }
    return member;
  }

  private async findProject(id: number): Promise<Project> {
    const project = await this.projects.findOneBy({ id });
    if (!project) {
      throw new NotFoundException({
        message: `Project ${id} was not found.`,
        code: ErrorCode.NotFound,
      });
    }
    return project;
  }

  /** Turns Git server errors into HTTP errors the frontend can show. */
  private async call<T>(work: () => Promise<T>): Promise<T> {
    try {
      return await work();
    } catch (error) {
      if (!(error instanceof GiteaError)) throw error;
      if (error.status === 503)
        throw new ServiceUnavailableException({ message: error.message });
      if (error.status === 404) {
        throw new NotFoundException({
          message: error.message,
          code: ErrorCode.NotFound,
        });
      }
      if (error.status === 409 || error.status === 422) {
        throw new ConflictException({
          message: error.message,
          code: ErrorCode.Conflict,
        });
      }
      throw new HttpException(
        { message: `Git server error: ${error.message}` },
        502,
      );
    }
  }
}

function toRepository(repo: GiteaRepo): ProjectRepository {
  return {
    fullName: repo.full_name,
    htmlUrl: repo.html_url,
    cloneUrl: repo.clone_url,
    sshUrl: repo.ssh_url,
    defaultBranch: repo.default_branch,
    empty: repo.empty,
    private: repo.private,
  };
}

function slugify(name: string, id: number): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
  return slug || `project-${id}`;
}
