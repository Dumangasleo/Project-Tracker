import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExternalIdentity } from '../auth/entities/external-identity.entity';
import { TeamMember } from '../team/entities/team-member.entity';
import { DataProtectionService } from './data-protection.service';

@Module({
  imports: [TypeOrmModule.forFeature([TeamMember, ExternalIdentity])],
  providers: [DataProtectionService],
})
export class DataProtectionModule {}
