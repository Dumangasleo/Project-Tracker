import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateCommentDto {
  @ApiProperty({ description: 'Mark a comment or finding as handled' })
  @IsBoolean()
  resolved: boolean;
}
