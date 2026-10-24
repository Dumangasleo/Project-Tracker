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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import type { Paginated } from '../../common/interfaces/paginated.interface';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task } from './entities/task.entity';
import { TasksService } from './tasks.service';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'List tasks (paginated, filterable by type)' })
  findAll(@Query() query: TaskQueryDto): Promise<Paginated<Task>> {
    return this.tasks.findAll(query);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a task; the creator is the signed-in member',
  })
  create(
    @Body() dto: CreateTaskDto,
    @CurrentUser() user: AuthUser,
  ): Promise<Task> {
    return this.tasks.create(dto, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a task' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTaskDto,
  ): Promise<Task> {
    return this.tasks.update(id, dto);
  }

  @Post(':id/claim')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Assign an unassigned task to the signed-in member',
  })
  claim(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ): Promise<Task> {
    return this.tasks.claim(id, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a task' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.tasks.remove(id);
  }
}
