import {IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString} from "class-validator";


export class ProjectDTO {

    @IsNotEmpty()
    @IsString()
    ProjectName: string;

    @IsOptional()
    @IsString()
    Description?: string;

    @IsOptional()
    @IsNumber()
    Status?: number;

    @IsOptional()
    @IsNumber()
    Priority?: number;

    @IsNotEmpty()
    @IsNumber()
    TeamMemberId: number;

    @IsOptional()
    @IsDateString()
    DateCreated?: string;

    @IsOptional()
    @IsDateString()
    DateUpdated?: string;

}