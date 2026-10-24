import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { TaskType } from '../task.enums';

export class TaskQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: TaskType, description: 'Omit for all types' })
  @IsOptional()
  @Type(() => Number)
  @IsEnum(TaskType)
  type?: TaskType;
}
