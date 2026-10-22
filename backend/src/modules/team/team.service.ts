import {Injectable, NotFoundException} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeamMember } from './entities/team.entities';
import { Position } from './entities/position.entities';
import { CreateTeamMemberDto, UpdateTeamMemberDto } from './teamDTO/UpdateTeamMemberDto';
import { NotificationPublisher } from '../../messaging/NotificationPublisher';
import { NotificationPattern } from '../../messaging/NotificationPattern';
import { MemberRegisteredEvent } from '../../messaging/event/MemberRegisteredEvent';


@Injectable()
export class TeamService {
    constructor(
        @InjectRepository(TeamMember)
        private teamRepository: Repository<TeamMember>,

        @InjectRepository(Position)
        private positionRepository: Repository<Position>, // I-inject ang repository

        private readonly publisher: NotificationPublisher,
    ) {}


    async findAll(): Promise<TeamMember[]> {
        return await this.teamRepository.find({ relations: ['position'] });
    }

    // Para sa iyong Vue Combo Box mamaya
    async findAllPositions(): Promise<Position[]> {
        return await this.positionRepository.find();
    }

    async create(data: CreateTeamMemberDto): Promise<TeamMember> {
        const newMember = this.teamRepository.create(data);

        const saved = await this.teamRepository.save(newMember);

        this.publisher.publish(
            NotificationPattern.MEMBER_REGISTERED,
            new MemberRegisteredEvent(
                saved.id,
                `${saved.FirstName} ${saved.LastName}`,
                saved.Email,
            ),
        );

        return saved;
    }

    async update(id: number, data: UpdateTeamMemberDto): Promise<TeamMember> {
        await this.teamRepository.update(id, data);
        return this.teamRepository.findOneOrFail({ where: { id }, relations: ['position'] });
    }

    async remove(id: number) {
        const member = await this.teamRepository.findOneBy({ id });
        if (!member) throw new NotFoundException('Member not found');

        // Option A: Hard Delete
        await this.teamRepository.delete(id);

        // Option B: Microservice Event (Optional)
        // this.client.emit('member_deleted', { id });

        return { deleted: true, id };
    }
}