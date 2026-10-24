import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from '../projects/entities/project.entity';
import { TeamMember } from '../team/entities/team-member.entity';
import { GitController } from './git.controller';
import { GitService } from './git.service';
import { GiteaClient } from './gitea.client';

@Module({
  imports: [TypeOrmModule.forFeature([TeamMember, Project])],
  controllers: [GitController],
  providers: [GitService, GiteaClient],
  exports: [GiteaClient],
})
export class GitModule {}
