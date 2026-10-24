import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Req,
  ServiceUnavailableException,
  UnauthorizedException,
  type RawBodyRequest,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { SkipClientCheck } from '../../common/decorators/skip-client-check.decorator';
import { GiteaClient } from '../git/gitea.client';
import { ReviewsService, type GiteaPullRequestEvent } from './reviews.service';

/** Receives pull request events from the self-hosted Gitea server (signed with GITEA_WEBHOOK_SECRET). */
@ApiExcludeController()
@Public()
@SkipClientCheck()
@Controller('integrations/gitea')
export class GiteaWebhookController {
  private readonly logger = new Logger(GiteaWebhookController.name);

  constructor(
    private readonly reviews: ReviewsService,
    private readonly gitea: GiteaClient,
  ) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async receive(
    @Req() request: RawBodyRequest<Request>,
    @Headers('x-gitea-signature') signature: string | undefined,
    @Headers('x-gitea-event') event: string | undefined,
  ): Promise<{ result: string }> {
    const secret = this.gitea.webhookSecret;
    if (!secret) {
      throw new ServiceUnavailableException({
        message: 'GITEA_WEBHOOK_SECRET is not configured.',
      });
    }
    if (
      !request.rawBody ||
      !isValidSignature(request.rawBody, signature, secret)
    ) {
      throw new UnauthorizedException({
        message: 'Invalid webhook signature.',
      });
    }
    if (event !== 'pull_request')
      return { result: `ignored: ${event ?? 'unknown'} event` };

    const result = await this.reviews.handleGiteaPullRequest(
      request.body as GiteaPullRequestEvent,
    );
    this.logger.log(`Gitea pull request webhook: ${result}`);
    return { result };
  }
}

export function isValidSignature(
  body: Buffer,
  signature: string | undefined,
  secret: string,
): boolean {
  if (!signature || !/^[0-9a-f]{64}$/i.test(signature)) return false;
  const expected = createHmac('sha256', secret).update(body).digest();
  return timingSafeEqual(expected, Buffer.from(signature, 'hex'));
}
