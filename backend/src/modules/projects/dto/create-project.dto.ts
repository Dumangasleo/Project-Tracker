import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Priority } from '../../../common/enums/priority.enum';
import { ProjectStatus } from '../project-status.enum';

export class CreateProjectDto {
  @ApiProperty({ example: 'E-Commerce Platform' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ example: 'Customer-facing storefront.' })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @ApiPropertyOptional({ enum: ProjectStatus, default: ProjectStatus.Planning })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional({ enum: Priority, default: Priority.Low })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @ApiPropertyOptional({ type: Number, nullable: true, example: 1 })
  @IsOptional()
  @IsInt()
  leadId?: number | null;
}
