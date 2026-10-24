import { randomBytes } from 'node:crypto';
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { ErrorCode } from '../../../common/constants/error-codes';
import { emailLookupHash } from '../../../common/security/field-encryption';
import { Position } from '../../team/entities/position.entity';
import { TeamMember } from '../../team/entities/team-member.entity';
import { BCRYPT_ROUNDS } from '../auth.constants';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import type {
  AuthSession,
  SessionContext,
} from '../interfaces/session.interfaces';
import { TokenService } from './token.service';

export interface NewMember {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string | null;
}

@Injectable()
export class AuthService {
  // Compared against when the email is unknown, so response time does not reveal which emails exist.
  private readonly dummyHash = bcrypt.hashSync(
    randomBytes(16).toString('hex'),
    BCRYPT_ROUNDS,
  );

  constructor(
    @InjectRepository(TeamMember)
    private readonly members: Repository<TeamMember>,
    @InjectRepository(Position)
    private readonly positions: Repository<Position>,
    private readonly tokens: TokenService,
  ) {}

  async register(
    dto: RegisterDto,
    context: SessionContext,
  ): Promise<AuthSession> {
    const email = normalizeEmail(dto.email);
    if (await this.members.existsBy({ emailHash: emailLookupHash(email) })) {
      throw new ConflictException({
        message: 'Email is already registered.',
        code: ErrorCode.Conflict,
      });
    }

    const member = await this.createMember({
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      email,
      passwordHash: await bcrypt.hash(dto.password, BCRYPT_ROUNDS),
    });
    return this.startSession(member, context);
  }

  async login(dto: LoginDto, context: SessionContext): Promise<AuthSession> {
    const member = await this.members
      .createQueryBuilder('member')
      .addSelect('member.passwordHash')
      .where('member.emailHash = :emailHash', {
        emailHash: emailLookupHash(dto.email),
      })
      .getOne();

    const passwordMatches = await bcrypt.compare(
      dto.password,
      member?.passwordHash ?? this.dummyHash,
    );

    if (!member?.passwordHash || !passwordMatches) {
      throw new UnauthorizedException({
        message: 'Invalid email or password.',
        code: ErrorCode.InvalidCredentials,
      });
    }

    return this.startSession(member, context);
  }

  async refresh(
    refreshToken: string,
    context: SessionContext,
  ): Promise<AuthSession> {
    const { member, tokens } = await this.tokens.rotate(refreshToken, context);
    return { member, tokens };
  }

  logout(refreshToken: string): Promise<void> {
    return this.tokens.revoke(refreshToken);
  }

  getProfile(memberId: number): Promise<TeamMember> {
    return this.members.findOneOrFail({
      where: { id: memberId },
      relations: { position: true },
    });
  }

  async startSession(
    member: TeamMember,
    context: SessionContext,
  ): Promise<AuthSession> {
    const tokens = await this.tokens.issue(member, context);
    return { member, tokens };
  }

  async createMember(data: NewMember): Promise<TeamMember> {
    const member = this.members.create({
      ...data,
      emailHash: emailLookupHash(data.email),
      positionId: await this.defaultPositionId(),
      isVerified: true,
      status: 'online',
    });
    return this.members.save(member);
  }

  findMemberByEmail(email: string): Promise<TeamMember | null> {
    return this.members.findOneBy({ emailHash: emailLookupHash(email) });
  }

  private async defaultPositionId(): Promise<number> {
    const [first] = await this.positions.find({
      order: { id: 'ASC' },
      take: 1,
    });
    if (first) return first.id;

    const created = await this.positions.save(
      this.positions.create({
        title: 'Member',
        department: 'Engineering',
        accessLevel: 1,
      }),
    );
    return created.id;
  }
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
