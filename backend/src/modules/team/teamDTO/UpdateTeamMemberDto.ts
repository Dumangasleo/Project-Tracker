import { IsString, IsEmail, IsOptional, IsNumber, IsNotEmpty } from 'class-validator';

export class UpdateTeamMemberDto {
    @IsString()
    @IsNotEmpty()
    FirstName: string;

    @IsString()
    @IsNotEmpty()
    LastName: string;

    @IsEmail()
    @IsNotEmpty()
    Email: string;

    @IsNumber()
    @IsNotEmpty()
    PositionID: number;

    @IsString()
    @IsOptional()
    ContactNumber?: string;

    @IsString()
    @IsOptional()
    Address?: string;

    @IsString()
    @IsOptional()
    Avatar?: string;

    @IsString()
    @IsOptional()
    Status?: string;
}