import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ProjectQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by project name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
