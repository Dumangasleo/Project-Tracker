import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { TeamService } from './team.service';
import { CreateTeamMemberDto, UpdateTeamMemberDto } from './teamDTO/UpdateTeamMemberDto';
import { TeamMember } from './entities/team.entities';

@ApiTags('Team Members')
@Controller('team')
export class TeamController {
    constructor(private readonly teamService: TeamService) {}

    @Get()
    @ApiOperation({ summary: 'Get all team members along with its position' })
    async findAll() {
        return this.teamService.findAll();
    }

    @Get('positions')
    @ApiOperation({ summary: 'Get all position for Vue ComboBox' })
    async findAllPositions() {
        return this.teamService.findAllPositions();
    }

    @Post()
    @ApiOperation({ summary: 'Add new team member' })
    @ApiResponse({ status: 201, description: 'Successfully created.' })
    @ApiBody({ type: CreateTeamMemberDto }) // Mao ni ang magpakita sa form sa Swagger
    async create(@Body() createDto: CreateTeamMemberDto) {
        return this.teamService.create(createDto);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update team member information' })
    @ApiResponse({ status: 200, description: 'Successfully updated the member.' })
    @ApiResponse({ status: 404, description: 'Team Member not found' })
    @ApiBody({ type: UpdateTeamMemberDto })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateDto: UpdateTeamMemberDto
    ) {
        return this.teamService.update(id, updateDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'I-delete ang team member' })
    async remove(@Param('id', ParseIntPipe) id: number) {
        return this.teamService.remove(id);
    }
}