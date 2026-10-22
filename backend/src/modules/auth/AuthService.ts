import {
    ConflictException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { TeamMember } from '../team/entities/team.entities';
import { Position } from '../team/entities/position.entities';
import { RegisterDto } from './dto/RegisterDto';
import { LoginDto } from './dto/LoginDto';
import { JwtPayload } from './JwtPayload';

export interface AuthResult {
    accessToken: string;
    user: {
        id: number;
        FirstName: string;
        LastName: string;
        Email: string;
        PositionID: number;
    };
}

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(TeamMember)
        private readonly teamRepository: Repository<TeamMember>,
        @InjectRepository(Position)
        private readonly positionRepository: Repository<Position>,
        private readonly jwtService: JwtService,
    ) {}

    async register(dto: RegisterDto): Promise<AuthResult> {
        const email = dto.email.trim().toLowerCase();

        const existing = await this.teamRepository.findOne({
            where: { Email: email },
        });
        if (existing) throw new ConflictException('Email is already registered.');

        const positionId = await this.resolvePositionId(dto.positionId);
        const passwordHash = await bcrypt.hash(dto.password, 10);

        const member = this.teamRepository.create({
            FirstName: dto.firstName,
            LastName: dto.lastName,
            Email: email,
            PasswordHash: passwordHash,
            PositionID: positionId,
            IsVerified: true,
            Status: 'online',
        });

        const saved = await this.teamRepository.save(member);
        return this.buildResult(saved);
    }

    async login(dto: LoginDto): Promise<AuthResult> {
        const email = dto.email.trim().toLowerCase();

        // PasswordHash is select:false, so pull it in explicitly.
        const member = await this.teamRepository
            .createQueryBuilder('member')
            .addSelect('member.PasswordHash')
            .where('member.Email = :email', { email })
            .getOne();

        if (!member || !member.PasswordHash) {
            throw new UnauthorizedException('Invalid email or password.');
        }

        const passwordMatches = await bcrypt.compare(
            dto.password,
            member.PasswordHash,
        );
        if (!passwordMatches) {
            throw new UnauthorizedException('Invalid email or password.');
        }

        return this.buildResult(member);
    }

    me(memberId: number): Promise<TeamMember> {
        return this.teamRepository.findOneOrFail({
            where: { id: memberId },
            relations: ['position'],
        });
    }

    // --- internal -----------------------------------------------------------

    private async resolvePositionId(preferred?: number): Promise<number> {
        if (preferred) return preferred;

        const anyPosition = await this.positionRepository
            .createQueryBuilder('position')
            .orderBy('position.id', 'ASC')
            .getOne();
        if (anyPosition) return anyPosition.id;

        // Bootstrap a default position on a fresh database.
        const created = await this.positionRepository.save(
            this.positionRepository.create({
                Title: 'Member',
                Department: 'Engineering',
                AccessLevel: 1,
            }),
        );
        return created.id;
    }

    private buildResult(member: TeamMember): AuthResult {
        const payload: JwtPayload = { sub: member.id, email: member.Email };
        return {
            accessToken: this.jwtService.sign(payload),
            user: {
                id: member.id,
                FirstName: member.FirstName,
                LastName: member.LastName,
                Email: member.Email,
                PositionID: member.PositionID,
            },
        };
    }
}
