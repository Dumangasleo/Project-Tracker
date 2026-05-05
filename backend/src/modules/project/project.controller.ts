import {
    Body, Controller, Delete, Get, Param,
    Post, Put, Query, DefaultValuePipe, ParseIntPipe
} from '@nestjs/common';
import { ProjectDTO } from './projectDTO/projectDto';
import { ProjectService } from './project.service';
import { ProjectEntity } from './entities/project.entities';

@Controller('projects')
export class ProjectController {
    constructor(private readonly projectService: ProjectService) {}

    @Get('search/list')
    async search(@Query('q') q: string) {
        console.log('Search Query:', q); // Para makita nimo sa terminal kung nadawat ba
        return await this.projectService.searchProjects(q || '');
    }


    @Get()
    async getAllProjects(
        @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
        @Query('take', new DefaultValuePipe(20), ParseIntPipe) take: number,
        @Query('search') search?: string,
    ) {

        const safeTake = Math.min(take, 100);

        const cleanSearch = search?.trim();

        return await this.projectService.findAll({
            skip,
            take: safeTake,
            search: cleanSearch
        });
    }

    @Post('assign-projects')
    async assignProject(@Body() projectData: ProjectDTO) {
        return await this.projectService.assignedProjects(projectData);
    }

    @Put('update-projects/:id')
    async updateProject(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateData: ProjectDTO
    ): Promise<ProjectEntity> {
        return await this.projectService.updateProject(id, updateData);
    }

    @Delete('delete-projects/:id')
    async deleteProject(@Param('id') id: number) {
        return await this.projectService.deleteProject(id);
    }

}