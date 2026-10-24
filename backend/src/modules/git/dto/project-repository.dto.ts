import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Matches } from 'class-validator';

export const REPOSITORY_MODES = ['create', 'link'] as const;

export class ProjectRepositoryDto {
  @ApiPropertyOptional({ enum: REPOSITORY_MODES, default: 'create' })
  @IsOptional()
  @IsIn(REPOSITORY_MODES)
  mode: (typeof REPOSITORY_MODES)[number] = 'create';

  @ApiPropertyOptional({
    example: 'checkout-web',
    description:
      'New repository name (create) — defaults to a slug of the project name',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z0-9._-]{1,100}$/, {
    message:
      'name may only contain letters, numbers, dots, dashes and underscores',
  })
  name?: string;

  @ApiPropertyOptional({
    example: 'vortex/checkout-web',
    description: 'Existing repository "owner/name" on the Git server (link)',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/, {
    message: 'fullName must look like owner/repository',
  })
  fullName?: string;
}
