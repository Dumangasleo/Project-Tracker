import { Module } from '@nestjs/common';
import { TeamController } from './team.controller';
import { TeamService } from './team.service';
import {TypeOrmModule} from "@nestjs/typeorm";
import {TeamMember} from "./entities/team.entities";
import {Position} from "./entities/position.entities";

@Module({
  imports: [TypeOrmModule.forFeature([TeamMember, Position])],
  providers: [TeamService],
  controllers: [TeamController]
})
export class TeamModule {}
