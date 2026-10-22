import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsEmail,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    MinLength,
} from 'class-validator';

export class RegisterDto {
    @ApiProperty({ example: 'Juan' })
    @IsString()
    @IsNotEmpty()
    firstName: string;

    @ApiProperty({ example: 'Dela Cruz' })
    @IsString()
    @IsNotEmpty()
    lastName: string;

    @ApiProperty({ example: 'juan@example.com' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: 'secret123', minLength: 6 })
    @IsString()
    @MinLength(6)
    password: string;

    @ApiPropertyOptional({ example: 1, description: 'Defaults to an existing position if omitted.' })
    @IsOptional()
    @IsInt()
    positionId?: number;
}
