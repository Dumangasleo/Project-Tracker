import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import type { Paginated } from '../../common/interfaces/paginated.interface';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { ResubmitReviewDto } from './dto/resubmit-review.dto';
import { ReviewDecisionDto } from './dto/review-decision.dto';
import { ReviewQueryDto } from './dto/review-query.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { UpdateReviewersDto } from './dto/update-reviewers.dto';
import { ReviewComment } from './entities/review-comment.entity';
import {
  ReviewsService,
  type ReviewDetail,
  type ReviewListItem,
} from './reviews.service';

@ApiTags('Code reviews')
@ApiBearerAuth()
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get()
  @ApiOperation({
    summary: 'List pull request reviews (mine, to review, or all)',
  })
  findAll(
    @Query() query: ReviewQueryDto,
    @CurrentUser() user: AuthUser,
  ): Promise<Paginated<ReviewListItem>> {
    return this.reviews.findAll(query, user.id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Review details with comments and automated findings',
  })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<ReviewDetail> {
    return this.reviews.findOne(id);
  }

  @Post()
  @ApiOperation({
    summary: "Submit a finished task's pull request for review (assignee only)",
  })
  create(
    @Body() dto: CreateReviewDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ReviewDetail> {
    return this.reviews.create(dto, user.id);
  }

  @Post(':id/resubmit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Ask for another review after pushing fixes (author only)',
  })
  resubmit(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResubmitReviewDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ReviewDetail> {
    return this.reviews.resubmit(id, dto, user.id);
  }

  @Post(':id/decision')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Approve or request changes (requested reviewers only)',
  })
  decide(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReviewDecisionDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ReviewDetail> {
    return this.reviews.decide(id, dto, user.id);
  }

  @Put(':id/reviewers')
  @ApiOperation({
    summary: 'Change who reviews the pull request (author only)',
  })
  setReviewers(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReviewersDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ReviewDetail> {
    return this.reviews.setReviewers(id, dto.reviewerIds, user.id);
  }

  @Post(':id/merge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Merge an approved pull request on the self-hosted Git server',
  })
  merge(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ): Promise<ReviewDetail> {
    return this.reviews.merge(id, user.id);
  }

  @Post(':id/close')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Close the review without merging (author only)' })
  close(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ): Promise<ReviewDetail> {
    return this.reviews.close(id, user.id);
  }

  @Post(':id/analyze')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Run the warning checks and AI review again' })
  reanalyze(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ): Promise<ReviewDetail> {
    return this.reviews.reanalyze(id, user.id);
  }

  @Post(':id/comments')
  @ApiOperation({
    summary: 'Comment on the pull request, optionally on a file and line',
  })
  addComment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ReviewComment> {
    return this.reviews.addComment(id, dto, user.id);
  }

  @Patch(':id/comments/:commentId')
  @ApiOperation({ summary: 'Mark a comment or finding as resolved' })
  updateComment(
    @Param('id', ParseIntPipe) id: number,
    @Param('commentId', ParseIntPipe) commentId: number,
    @Body() dto: UpdateCommentDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ReviewComment> {
    return this.reviews.setCommentResolved(
      id,
      commentId,
      dto.resolved,
      user.id,
    );
  }

  @Delete(':id/comments/:commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete your own comment' })
  removeComment(
    @Param('id', ParseIntPipe) id: number,
    @Param('commentId', ParseIntPipe) commentId: number,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    return this.reviews.removeComment(id, commentId, user.id);
  }
}
