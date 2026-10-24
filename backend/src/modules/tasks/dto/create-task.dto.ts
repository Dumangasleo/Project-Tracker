import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Priority } from '../../../common/enums/priority.enum';
import { TaskStatus, TaskType } from '../task.enums';

export class CreateTaskDto {
  @ApiProperty({ example: 'Implement checkout page' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @ApiPropertyOptional({ enum: TaskStatus, default: TaskStatus.Todo })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ enum: Priority, default: Priority.Low })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @ApiPropertyOptional({ enum: TaskType, default: TaskType.General })
  @IsOptional()
  @IsEnum(TaskType)
  type?: TaskType;

  @ApiProperty({ example: 1 })
  @IsInt()
  projectId: number;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsOptional()
  @IsInt()
  assigneeId?: number | null;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999.99)
  estimatedHours?: number | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: '2026-12-01' })
  @IsOptional()
  @IsDateString()
  dueDate?: string | null;
}
