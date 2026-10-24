import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ example: 12 })
  @IsInt()
  taskId: number;

  @ApiProperty({
    example: 'https://github.com/acme/web/pull/42',
    description: 'GitHub or Bitbucket pull request link',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  pullRequestUrl: string;

  @ApiPropertyOptional({ example: 'Add checkout page' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({
    description: 'What changed and what reviewers should look at',
  })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  message?: string;

  @ApiProperty({ type: [Number], example: [3, 5] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @ArrayUnique()
  @IsInt({ each: true })
  reviewerIds: number[];
}
