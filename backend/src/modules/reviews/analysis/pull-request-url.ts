import { PullRequestProvider } from '../review.enums';

export interface PullRequestRef {
  provider: PullRequestProvider;
  owner: string;
  repo: string;
  number: number;
  url: string;
}

const HOSTED_PATTERNS: [PullRequestProvider, RegExp][] = [
  [
    PullRequestProvider.GitHub,
    /^https:\/\/(?:www\.)?github\.com\/([\w.-]+)\/([\w.-]+)\/pull\/(\d+)(?:[/?#].*)?$/i,
  ],
  [
    PullRequestProvider.Bitbucket,
    /^https:\/\/(?:www\.)?bitbucket\.org\/([\w.-]+)\/([\w.-]+)\/pull-requests\/(\d+)(?:[/?#].*)?$/i,
  ],
];

/** Self-hosted Gitea: any host, since the server is reached through GITEA_URL and never through this link. */
const GITEA_PATTERN =
  /^(https?:\/\/[^/\s?#]+)\/([\w.-]+)\/([\w.-]+)\/pulls\/(\d+)(?:[/?#].*)?$/i;

const DOTS_ONLY = /^\.+$/;

export const defaultReviewTitle = (ref: PullRequestRef): string =>
  `${ref.repo} #${ref.number}`;

export const repositoryName = (ref: PullRequestRef): string =>
  `${ref.owner}/${ref.repo}`;

/** Accepts GitHub, Bitbucket and (when enabled) Gitea pull request links and returns a canonical reference. */
export function parsePullRequestUrl(
  input: string,
  options: { gitea?: boolean } = {},
): PullRequestRef | null {
  const url = input.trim();

  for (const [provider, pattern] of HOSTED_PATTERNS) {
    const match = url.match(pattern);
    if (match) return toRef(provider, match[1], match[2], match[3]);
  }

  const gitea = options.gitea ? url.match(GITEA_PATTERN) : null;
  if (gitea) {
    const [, origin, owner, repo, number] = gitea;
    if (/^https:\/\/(?:www\.)?(github\.com|bitbucket\.org)$/i.test(origin))
      return null;
    const ref = toRef(PullRequestProvider.Gitea, owner, repo, number);
    return (
      ref && { ...ref, url: `${origin}/${owner}/${repo}/pulls/${ref.number}` }
    );
  }
  return null;
}

function toRef(
  provider: PullRequestProvider,
  owner: string,
  repo: string,
  number: string,
): PullRequestRef | null {
  if (DOTS_ONLY.test(owner) || DOTS_ONLY.test(repo)) return null;

  const pullNumber = Number(number);
  if (!Number.isSafeInteger(pullNumber) || pullNumber < 1) return null;

  const urls: Record<PullRequestProvider, string> = {
    [PullRequestProvider.GitHub]: `https://github.com/${owner}/${repo}/pull/${pullNumber}`,
    [PullRequestProvider.Bitbucket]: `https://bitbucket.org/${owner}/${repo}/pull-requests/${pullNumber}`,
    [PullRequestProvider.Gitea]: '',
  };
  return { provider, owner, repo, number: pullNumber, url: urls[provider] };
}
