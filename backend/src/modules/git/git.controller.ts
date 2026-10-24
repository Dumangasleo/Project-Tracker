import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { GitAccountDto } from './dto/git-account.dto';
import { ProjectRepositoryDto } from './dto/project-repository.dto';
import {
  GitService,
  type GitAccount,
  type GitServerStatus,
  type ProjectRepository,
} from './git.service';

@ApiTags('Git')
@ApiBearerAuth()
@Controller()
export class GitController {
  constructor(private readonly git: GitService) {}

  @Get('git/status')
  @ApiOperation({ summary: 'Whether the self-hosted Git server is connected' })
  status(): Promise<GitServerStatus> {
    return this.git.status();
  }

  @Get('git/account')
  @ApiOperation({ summary: 'My Git account, or null if I have none yet' })
  getAccount(@CurrentUser() user: AuthUser): Promise<GitAccount | null> {
    return this.git.getAccount(user.id);
  }

  @Put('git/account')
  @ApiOperation({ summary: 'Create my Git account, or set a new Git password' })
  saveAccount(
    @CurrentUser() user: AuthUser,
    @Body() dto: GitAccountDto,
  ): Promise<GitAccount> {
    return this.git.saveAccount(user.id, dto);
  }

  @Get('projects/:id/repository')
  @ApiOperation({ summary: "The project's repository with clone links" })
  getRepository(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ProjectRepository | null> {
    return this.git.getRepository(id);
  }

  @Post('projects/:id/repository')
  @ApiOperation({
    summary: 'Create a repository (with a CI pipeline) or link an existing one',
  })
  attachRepository(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ProjectRepositoryDto,
  ): Promise<ProjectRepository> {
    return this.git.attachRepository(id, dto);
  }

  @Delete('projects/:id/repository')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Unlink the repository (it stays on the Git server)',
  })
  detachRepository(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.git.detachRepository(id);
  }
}
