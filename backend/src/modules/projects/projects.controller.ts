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
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Paginated } from '../../common/interfaces/paginated.interface';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectQueryDto } from './dto/project-query.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Project } from './entities/project.entity';
import { ProjectsService } from './projects.service';

@ApiTags('Projects')
@ApiBearerAuth()
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'List projects (paginated, searchable)' })
  findAll(@Query() query: ProjectQueryDto): Promise<Paginated<Project>> {
    return this.projects.findAll(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a project' })
  create(@Body() dto: CreateProjectDto): Promise<Project> {
    return this.projects.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a project' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProjectDto,
  ): Promise<Project> {
    return this.projects.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a project' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.projects.remove(id);
  }
}
