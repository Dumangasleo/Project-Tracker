import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class ResubmitReviewDto {
  @ApiPropertyOptional({ description: 'New pull request link, if it changed' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  pullRequestUrl?: string;

  @ApiPropertyOptional({ example: 'Fixed the null check and added tests.' })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  message?: string;
}
