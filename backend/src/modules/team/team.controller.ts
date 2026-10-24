import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateTeamMemberDto } from './dto/create-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';
import { Position } from './entities/position.entity';
import { TeamMember } from './entities/team-member.entity';
import { TeamService } from './team.service';

@ApiTags('Team')
@ApiBearerAuth()
@Controller('team')
export class TeamController {
  constructor(private readonly team: TeamService) {}

  @Get('members')
  @ApiOperation({ summary: 'List team members with their position' })
  findAll(): Promise<TeamMember[]> {
    return this.team.findAll();
  }

  @Get('positions')
  @ApiOperation({ summary: 'List positions' })
  findPositions(): Promise<Position[]> {
    return this.team.findPositions();
  }

  @Post('members')
  @ApiOperation({ summary: 'Add a team member' })
  create(@Body() dto: CreateTeamMemberDto): Promise<TeamMember> {
    return this.team.create(dto);
  }

  @Patch('members/:id')
  @ApiOperation({ summary: 'Update a team member' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTeamMemberDto,
  ): Promise<TeamMember> {
    return this.team.update(id, dto);
  }

  @Delete('members/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a team member' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.team.remove(id);
  }
}
