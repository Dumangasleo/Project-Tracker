import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { ErrorCode } from '../../common/constants/error-codes';
import { MemberRegisteredEvent } from '../../messaging/events/member-registered.event';
import { NotificationEvent } from '../../messaging/notification-events';
import { NotificationPublisher } from '../../messaging/notification.publisher';
import { CreateTeamMemberDto } from './dto/create-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';
import { Position } from './entities/position.entity';
import { TeamMember } from './entities/team-member.entity';

@Injectable()
export class TeamService {
  constructor(
    @InjectRepository(TeamMember)
    private readonly members: Repository<TeamMember>,
    @InjectRepository(Position)
    private readonly positions: Repository<Position>,
    private readonly publisher: NotificationPublisher,
  ) {}

  findAll(): Promise<TeamMember[]> {
    return this.members.find({
      relations: { position: true },
      order: { firstName: 'ASC', lastName: 'ASC' },
    });
  }

  findPositions(): Promise<Position[]> {
    return this.positions.find({ order: { title: 'ASC' } });
  }

  async create(dto: CreateTeamMemberDto): Promise<TeamMember> {
    const email = dto.email.trim().toLowerCase();
    await this.assertEmailAvailable(email);

    const saved = await this.members.save(
      this.members.create({ ...dto, email }),
    );

    this.publisher.publish(
      NotificationEvent.MemberRegistered,
      new MemberRegisteredEvent(
        saved.id,
        `${saved.firstName} ${saved.lastName}`,
        saved.email,
      ),
    );

    return this.findOne(saved.id);
  }

  async update(id: number, dto: UpdateTeamMemberDto): Promise<TeamMember> {
    await this.findOne(id);

    if (dto.email) {
      dto.email = dto.email.trim().toLowerCase();
      await this.assertEmailAvailable(dto.email, id);
    }

    if (Object.keys(dto).length > 0) await this.members.update(id, { ...dto });
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.members.delete(id);
    if (!result.affected) throw notFound(id);
  }

  private async findOne(id: number): Promise<TeamMember> {
    const member = await this.members.findOne({
      where: { id },
      relations: { position: true },
    });
    if (!member) throw notFound(id);
    return member;
  }

  private async assertEmailAvailable(
    email: string,
    exceptId?: number,
  ): Promise<void> {
    const taken = await this.members.existsBy(
      exceptId ? { email, id: Not(exceptId) } : { email },
    );
    if (taken) {
      throw new ConflictException({
        message: 'Email is already used by another member.',
        code: ErrorCode.Conflict,
      });
    }
  }
}

function notFound(id: number): NotFoundException {
  return new NotFoundException({
    message: `Team member ${id} was not found.`,
    code: ErrorCode.NotFound,
  });
}
