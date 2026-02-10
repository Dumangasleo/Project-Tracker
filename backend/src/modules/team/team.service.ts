import {Injectable, NotFoundException} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeamMember } from './entities/team.entities';
import { Position } from './entities/position.entities'; // I-import ito

@Injectable()
export class TeamService {
    constructor(
        @InjectRepository(TeamMember)
        private teamRepository: Repository<TeamMember>,

        @InjectRepository(Position)
        private positionRepository: Repository<Position>, // I-inject ang repository
    ) {}


    async findAll(): Promise<TeamMember[]> {
        return await this.teamRepository.find({ relations: ['position'] });
    }

    // Para sa iyong Vue Combo Box mamaya
    async findAllPositions(): Promise<Position[]> {
        return await this.positionRepository.find();
    }

    async create(data: Partial<TeamMember>): Promise<TeamMember> {
        const newMember = this.teamRepository.create(data);
        return await this.teamRepository.save(newMember);
    }

    async update(id: number, data: Partial<TeamMember>): Promise<TeamMember> {
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