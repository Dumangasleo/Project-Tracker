import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ApiEnv } from '../../config/env.validation';

const REQUEST_TIMEOUT_MS = 20_000;

export interface GiteaUser {
  id: number;
  login: string;
  email: string;
  full_name: string;
}

export interface GiteaRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  clone_url: string;
  ssh_url: string;
  default_branch: string;
  empty: boolean;
  private: boolean;
  owner: { login: string };
}

export interface GiteaPullRequest {
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  merged: boolean;
  html_url: string;
  user: { login: string };
  head: { ref: string; sha: string };
  base: { ref: string };
  requested_reviewers: { login: string }[] | null;
}

export interface GiteaCombinedStatus {
  state: string;
  statuses: {
    context: string;
    status: string;
    description: string;
    target_url: string;
  }[];
}

export interface GiteaReviewComment {
  path: string;
  body: string;
  new_position: number;
}

export class GiteaError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Thin client for the self-hosted Gitea REST API, authenticated as the Vortex admin bot. */
@Injectable()
export class GiteaClient {
  readonly baseUrl: string | null;
  readonly org: string;
  readonly webhookUrl: string;
  readonly webhookSecret: string | null;
  private readonly token: string | null;

  constructor(config: ConfigService<ApiEnv, true>) {
    this.baseUrl =
      config.get('GITEA_URL', { infer: true })?.replace(/\/$/, '') ?? null;
    this.token = config.get('GITEA_TOKEN', { infer: true }) || null;
    this.org = config.get('GITEA_ORG', { infer: true });
    this.webhookUrl = config.get('GITEA_WEBHOOK_URL', { infer: true });
    this.webhookSecret =
      config.get('GITEA_WEBHOOK_SECRET', { infer: true }) || null;
  }

  get enabled(): boolean {
    return Boolean(this.baseUrl && this.token);
  }

  version(): Promise<{ version: string }> {
    return this.request('GET', '/version');
  }

  async findUser(username: string): Promise<GiteaUser | null> {
    return this.optional(
      this.request<GiteaUser>('GET', `/users/${encodeURIComponent(username)}`),
    );
  }

  createUser(input: {
    username: string;
    email: string;
    password: string;
    fullName: string;
  }): Promise<GiteaUser> {
    return this.request('POST', '/admin/users', {
      username: input.username,
      email: input.email,
      password: input.password,
      full_name: input.fullName,
      must_change_password: false,
      send_notify: false,
      visibility: 'limited',
    });
  }

  setPassword(username: string, password: string): Promise<GiteaUser> {
    return this.request(
      'PATCH',
      `/admin/users/${encodeURIComponent(username)}`,
      {
        source_id: 0,
        login_name: username,
        password,
        must_change_password: false,
      },
    );
  }

  async addToDevelopers(username: string): Promise<void> {
    const teams = await this.request<{ id: number; name: string }[]>(
      'GET',
      `/orgs/${this.org}/teams`,
    );
    const developers = teams.find((team) => team.name === 'Developers');
    if (!developers) {
      throw new GiteaError(
        404,
        `Team "Developers" is missing in ${this.org}. Run: corepack yarn git:setup`,
      );
    }
    await this.request(
      'PUT',
      `/teams/${developers.id}/members/${encodeURIComponent(username)}`,
    );
  }

  createOrgRepo(input: {
    name: string;
    description: string;
    private: boolean;
  }): Promise<GiteaRepo> {
    return this.request('POST', `/orgs/${this.org}/repos`, {
      name: input.name,
      description: input.description,
      private: input.private,
      auto_init: true,
      default_branch: 'main',
      readme: 'Default',
    });
  }

  async getRepo(fullName: string): Promise<GiteaRepo | null> {
    return this.optional(
      this.request<GiteaRepo>('GET', `/repos/${repoPath(fullName)}`),
    );
  }

  async createFile(
    fullName: string,
    path: string,
    content: string,
    message: string,
  ): Promise<void> {
    await this.request(
      'POST',
      `/repos/${repoPath(fullName)}/contents/${path}`,
      {
        content: Buffer.from(content, 'utf8').toString('base64'),
        message,
      },
    );
  }

  async ensureRepoWebhook(fullName: string): Promise<void> {
    if (!this.webhookSecret) return;
    const hooks = await this.request<
      { id: number; config: { url?: string } }[]
    >('GET', `/repos/${repoPath(fullName)}/hooks`);
    if (hooks.some((hook) => hook.config.url === this.webhookUrl)) return;
    await this.request('POST', `/repos/${repoPath(fullName)}/hooks`, {
      type: 'gitea',
      active: true,
      branch_filter: '*',
      events: ['pull_request', 'pull_request_sync'],
      config: {
        url: this.webhookUrl,
        content_type: 'json',
        secret: this.webhookSecret,
      },
    });
  }

  getPull(fullName: string, index: number): Promise<GiteaPullRequest> {
    return this.request('GET', `/repos/${repoPath(fullName)}/pulls/${index}`);
  }

  getPullDiff(fullName: string, index: number): Promise<string> {
    return this.request(
      'GET',
      `/repos/${repoPath(fullName)}/pulls/${index}.diff`,
      undefined,
      'text',
    );
  }

  combinedStatus(fullName: string, sha: string): Promise<GiteaCombinedStatus> {
    return this.request(
      'GET',
      `/repos/${repoPath(fullName)}/commits/${encodeURIComponent(sha)}/status`,
    );
  }

  async mergePull(fullName: string, index: number): Promise<void> {
    await this.request(
      'POST',
      `/repos/${repoPath(fullName)}/pulls/${index}/merge`,
      {
        do: 'merge',
        delete_branch_after_merge: true,
      },
    );
  }

  async createPullReview(
    fullName: string,
    index: number,
    input: { body: string; commitId?: string; comments: GiteaReviewComment[] },
  ): Promise<void> {
    await this.request(
      'POST',
      `/repos/${repoPath(fullName)}/pulls/${index}/reviews`,
      {
        body: input.body,
        event: 'COMMENT',
        commit_id: input.commitId,
        comments: input.comments,
      },
    );
  }

  private async optional<T>(promise: Promise<T>): Promise<T | null> {
    try {
      return await promise;
    } catch (error) {
      if (error instanceof GiteaError && error.status === 404) return null;
      throw error;
    }
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    responseType: 'json' | 'text' = 'json',
  ): Promise<T> {
    if (!this.enabled) {
      throw new GiteaError(
        503,
        'The Git server is not configured. Run: corepack yarn git:setup',
      );
    }

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/api/v1${path}`, {
        method,
        headers: {
          Authorization: `token ${this.token}`,
          Accept: responseType === 'json' ? 'application/json' : 'text/plain',
          ...(body !== undefined && { 'Content-Type': 'application/json' }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch {
      throw new GiteaError(
        503,
        `Could not reach the Git server at ${this.baseUrl}.`,
      );
    }

    const text = await response.text();
    if (!response.ok) {
      let message = text;
      try {
        message = (JSON.parse(text) as { message?: string }).message ?? text;
      } catch {
        // plain-text error body
      }
      throw new GiteaError(
        response.status,
        message || `Git server returned ${response.status}.`,
      );
    }
    if (responseType === 'text') return text as T;
    return (text ? JSON.parse(text) : undefined) as T;
  }
}

function repoPath(fullName: string): string {
  const [owner, repo] = fullName.split('/');
  return `${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
}
