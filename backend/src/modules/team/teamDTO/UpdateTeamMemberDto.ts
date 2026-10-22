import { IsString, IsEmail, IsOptional, IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateTeamMemberDto {
    @ApiProperty({ example: 'Juan' })
    @IsString()
    @IsNotEmpty()
    FirstName: string;

    @ApiProperty({ example: 'Dela Cruz' })
    @IsString()
    @IsNotEmpty()
    LastName: string;

    @ApiPropertyOptional({ example: 'Google' })
    @IsString()
    @IsOptional()
    MiddleName?: string;

    @ApiProperty({ example: 'juan@example.com' })
    @IsEmail()
    @IsNotEmpty()
    Email: string;

    @ApiProperty({ example: 1 })
    @IsNumber()
    @IsNotEmpty()
    PositionID: number;

    @ApiProperty({ example: 'Davao City' })
    @IsString()
    @IsNotEmpty()
    Address: string;

    @ApiProperty({ example: '09123456789' })
    @IsString()
    @IsNotEmpty()
    ContactNumber: string;

    @ApiPropertyOptional({ example: 'avatar.png' })
    @IsString()
    @IsOptional()
    Avatar?: string;

    @ApiPropertyOptional({ example: 'Active' })
    @IsString()
    @IsOptional()
    Status?: string;
}

export class UpdateTeamMemberDto extends PartialType(CreateTeamMemberDto) {}