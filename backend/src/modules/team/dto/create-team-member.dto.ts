import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export const MEMBER_STATUSES = ['online', 'offline'] as const;

export class CreateTeamMemberDto {
  @ApiProperty({ example: 'Juan' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ example: 'Dela Cruz' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  lastName: string;

  @ApiPropertyOptional({ example: 'Santos' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  middleName?: string;

  @ApiProperty({ example: 'juan@example.com' })
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  positionId: number;

  @ApiPropertyOptional({ example: 'Davao City' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({ example: '09123456789' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  contactNumber?: string;

  @ApiPropertyOptional({ enum: MEMBER_STATUSES })
  @IsOptional()
  @IsIn(MEMBER_STATUSES)
  status?: (typeof MEMBER_STATUSES)[number];
}
