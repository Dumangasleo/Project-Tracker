import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { REVIEW_SCOPES, ReviewStatus, type ReviewScope } from '../review.enums';

export class ReviewQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: REVIEW_SCOPES,
    default: 'all',
    description: '"mine" = I opened it, "to-review" = I am a reviewer',
  })
  @IsOptional()
  @IsIn(REVIEW_SCOPES)
  scope: ReviewScope = 'all';

  @ApiPropertyOptional({ enum: ReviewStatus })
  @IsOptional()
  @Type(() => Number)
  @IsEnum(ReviewStatus)
  status?: ReviewStatus;
}
