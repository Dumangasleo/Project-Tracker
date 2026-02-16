import {Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UsePipes, ValidationPipe} from "@nestjs/common";
import {TeamService} from "./team.service";
import {UpdateTeamMemberDto} from "./teamDTO/UpdateTeamMemberDto";
import {ParseTeamMemberPipe} from "../../common/pipes/teamPipe";


@Controller('team')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class TeamController {
    constructor(private readonly teamService: TeamService) {}

    @Get()
    findAll() {
        return this.teamService.findAll();
    }

    @Get('positions') // Endpoint para sa dropdown
    findAllPositions() {
        return this.teamService.findAllPositions();
    }

    @Post()
    create(@Body(new ParseTeamMemberPipe()) createDto: UpdateTeamMemberDto) {
        return this.teamService.create(createDto);
    }

    @Put(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body(new ParseTeamMemberPipe()) updateDTO: UpdateTeamMemberDto)
    {
        return this.teamService.update(id, updateDTO);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.teamService.remove(id);
    }

}