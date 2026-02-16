import {
    IsString,
    IsNumber,
    IsOptional,
    IsNotEmpty,
    IsEnum,
    IsDateString
} from 'class-validator';

export class CreateTaskDto {
    @IsNotEmpty()
    @IsString()
    TaskName: string;

    @IsOptional()
    @IsString()
    Description?: string;

    @IsOptional()
    @IsNumber()
    Status?: number; // 0: Todo, 1: In Progress, 2: Done

    @IsOptional()
    @IsNumber()
    Priority?: number; // 1: Low, 2: Medium, 3: High

    @IsNotEmpty()
    @IsNumber()
    ProjectId: number;

    @IsNotEmpty()
    @IsNumber()
    TeamMemberId: number;

    @IsOptional()
    @IsNumber()
    EstimatedHours?: number;

    @IsOptional()
    @IsDateString() // Dahil .toISOString() ang pinapasa ng frontend
    DueDate?: string;
}