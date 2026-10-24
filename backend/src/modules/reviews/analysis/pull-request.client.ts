import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ApiEnv } from '../../../config/env.validation';
import { GiteaClient, GiteaError } from '../../git/gitea.client';
import { PullRequestProvider } from '../review.enums';
import { repositoryName, type PullRequestRef } from './pull-request-url';

const REQUEST_TIMEOUT_MS = 20_000;
const MAX_DIFF_CHARS = 1_000_000;

export interface PullRequestSnapshot {
  title: string;
  state: string;
  diff: string;
  truncated: boolean;
  headSha?: string;
}

export class PullRequestFetchError extends Error {}

@Injectable()
export class PullRequestClient {
  private readonly githubToken?: string;
  private readonly bitbucketToken?: string;
  private readonly bitbucketEmail?: string;

  constructor(
    config: ConfigService<ApiEnv, true>,
    private readonly gitea: GiteaClient,
  ) {
    this.githubToken = config.get('GITHUB_TOKEN', { infer: true });
    this.bitbucketToken = config.get('BITBUCKET_TOKEN', { infer: true });
    this.bitbucketEmail = config.get('BITBUCKET_EMAIL', { infer: true });
  }

  fetch(ref: PullRequestRef): Promise<PullRequestSnapshot> {
    if (ref.provider === PullRequestProvider.Gitea) return this.fetchGitea(ref);
    return ref.provider === PullRequestProvider.GitHub
      ? this.fetchGitHub(ref)
      : this.fetchBitbucket(ref);
  }

  private async fetchGitea(ref: PullRequestRef): Promise<PullRequestSnapshot> {
    const fullName = repositoryName(ref);
    try {
      const pull = await this.gitea.getPull(fullName, ref.number);
      const diff = await this.gitea.getPullDiff(fullName, ref.number);
      return {
        ...snapshot(pull.title, pull.merged ? 'merged' : pull.state, diff),
        headSha: pull.head.sha,
      };
    } catch (error) {
      if (error instanceof GiteaError) {
        throw new PullRequestFetchError(
          error.status === 404
            ? `Pull request ${fullName}#${ref.number} was not found on the Git server.`
            : error.message,
        );
      }
      throw error;
    }
  }

  private async fetchGitHub(ref: PullRequestRef): Promise<PullRequestSnapshot> {
    const url = `https://api.github.com/repos/${ref.owner}/${ref.repo}/pulls/${ref.number}`;
    const headers: Record<string, string> = {
      'User-Agent': 'vortex-sync-review',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(this.githubToken && { Authorization: `Bearer ${this.githubToken}` }),
    };

    const meta = await this.request<{
      title: string;
      state: string;
      merged?: boolean;
    }>(
      url,
      { ...headers, Accept: 'application/vnd.github+json' },
      'GitHub',
      'GITHUB_TOKEN',
    );
    const diff = await this.request<string>(
      url,
      { ...headers, Accept: 'application/vnd.github.diff' },
      'GitHub',
      'GITHUB_TOKEN',
    );
    return snapshot(meta.title, meta.merged ? 'merged' : meta.state, diff);
  }

  private async fetchBitbucket(
    ref: PullRequestRef,
  ): Promise<PullRequestSnapshot> {
    const url = `https://api.bitbucket.org/2.0/repositories/${ref.owner}/${ref.repo}/pullrequests/${ref.number}`;
    const headers: Record<string, string> = {};
    if (this.bitbucketToken) {
      headers.Authorization = this.bitbucketEmail
        ? `Basic ${Buffer.from(`${this.bitbucketEmail}:${this.bitbucketToken}`).toString('base64')}`
        : `Bearer ${this.bitbucketToken}`;
    }

    const meta = await this.request<{ title: string; state: string }>(
      url,
      { ...headers, Accept: 'application/json' },
      'Bitbucket',
      'BITBUCKET_TOKEN',
    );
    const diff = await this.request<string>(
      `${url}/diff`,
      { ...headers, Accept: 'text/plain' },
      'Bitbucket',
      'BITBUCKET_TOKEN',
    );
    return snapshot(meta.title, meta.state.toLowerCase(), diff);
  }

  private async request<T>(
    url: string,
    headers: Record<string, string>,
    providerName: string,
    tokenVariable: string,
  ): Promise<T> {
    let response: Response;
    try {
      response = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch {
      throw new PullRequestFetchError(
        `Could not reach ${providerName}. Try again later.`,
      );
    }

    if (
      response.status === 401 ||
      response.status === 403 ||
      response.status === 404
    ) {
      throw new PullRequestFetchError(
        `${providerName} returned ${response.status}. Check the link; for a private repository set ${tokenVariable} in backend/.env.`,
      );
    }
    if (!response.ok) {
      throw new PullRequestFetchError(
        `${providerName} returned ${response.status}.`,
      );
    }

    const isJson = headers.Accept.includes('json');
    return (isJson ? await response.json() : await response.text()) as T;
  }
}

function snapshot(
  title: string,
  state: string,
  diff: string,
): PullRequestSnapshot {
  const truncated = diff.length > MAX_DIFF_CHARS;
  return {
    title,
    state,
    diff: truncated ? diff.slice(0, MAX_DIFF_CHARS) : diff,
    truncated,
  };
}
