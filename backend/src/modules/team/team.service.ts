import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { ErrorCode } from '../../common/constants/error-codes';
import { emailLookupHash } from '../../common/security/field-encryption';
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
      this.members.create({ ...dto, email, emailHash: emailLookupHash(email) }),
    );

    this.publisher.publish(
      NotificationEvent.MemberRegistered,
      new MemberRegisteredEvent(
        saved.id,
        `${saved.firstName} ${saved.lastName}`,
      ),
    );

    return this.findOne(saved.id);
  }

  async update(id: number, dto: UpdateTeamMemberDto): Promise<TeamMember> {
    await this.findOne(id);

    const changes: Partial<TeamMember> = { ...dto };
    if (dto.email) {
      changes.email = dto.email.trim().toLowerCase();
      changes.emailHash = emailLookupHash(changes.email);
      await this.assertEmailAvailable(changes.email, id);
    }

    if (Object.keys(changes).length > 0) await this.members.update(id, changes);
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
    const emailHash = emailLookupHash(email);
    const taken = await this.members.existsBy(
      exceptId ? { emailHash, id: Not(exceptId) } : { emailHash },
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
