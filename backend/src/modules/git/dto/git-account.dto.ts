import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class GitAccountDto {
  @ApiPropertyOptional({
    example: 'juan.delacruz',
    description:
      'Only needed the first time; ignored when the account already exists',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z0-9][A-Za-z0-9._-]{1,38}$/, {
    message:
      'username must be 2-39 letters, numbers, dots, dashes or underscores, starting with a letter or number',
  })
  username?: string;

  @ApiProperty({
    minLength: 8,
    description: 'Password used for git clone/push and the Gitea web UI',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;
}
