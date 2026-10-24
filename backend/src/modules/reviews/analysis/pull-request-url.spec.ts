import { PullRequestProvider } from '../review.enums';
import { defaultReviewTitle, parsePullRequestUrl } from './pull-request-url';

describe('parsePullRequestUrl', () => {
  it('parses a GitHub pull request link, including sub-pages', () => {
    expect(
      parsePullRequestUrl(
        'https://github.com/Dumangasleo/Project-Tracker/pull/42/files',
      ),
    ).toEqual({
      provider: PullRequestProvider.GitHub,
      owner: 'Dumangasleo',
      repo: 'Project-Tracker',
      number: 42,
      url: 'https://github.com/Dumangasleo/Project-Tracker/pull/42',
    });
  });

  it('parses a Bitbucket pull request link', () => {
    const ref = parsePullRequestUrl(
      ' https://bitbucket.org/traxiondev/admin.web/pull-requests/7/diff ',
    );
    expect(ref).toMatchObject({
      provider: PullRequestProvider.Bitbucket,
      owner: 'traxiondev',
      repo: 'admin.web',
      number: 7,
      url: 'https://bitbucket.org/traxiondev/admin.web/pull-requests/7',
    });
    expect(defaultReviewTitle(ref!)).toBe('admin.web #7');
  });

  it.each([
    'https://gitlab.com/acme/web/-/merge_requests/1',
    'http://github.com/acme/web/pull/1',
    'https://github.com/acme/web/issues/1',
    'https://github.com/../web/pull/1',
    'https://github.com.evil.com/acme/web/pull/1',
    'https://github.com/acme/web/pull/0',
    'not a url',
  ])('rejects %s', (url) => {
    expect(parsePullRequestUrl(url)).toBeNull();
  });

  describe('self-hosted Gitea', () => {
    const link =
      'http://host.docker.internal:3002/vortex/checkout-web/pulls/3/files';

    it('is only recognised when the Git server is enabled', () => {
      expect(parsePullRequestUrl(link)).toBeNull();
      expect(parsePullRequestUrl(link, { gitea: true })).toEqual({
        provider: PullRequestProvider.Gitea,
        owner: 'vortex',
        repo: 'checkout-web',
        number: 3,
        url: 'http://host.docker.internal:3002/vortex/checkout-web/pulls/3',
      });
    });

    it('does not treat GitHub-looking or malformed links as Gitea', () => {
      expect(
        parsePullRequestUrl('https://github.com/acme/web/pulls/3', {
          gitea: true,
        }),
      ).toBeNull();
      expect(
        parsePullRequestUrl('http://localhost:3002/../web/pulls/3', {
          gitea: true,
        }),
      ).toBeNull();
      expect(
        parsePullRequestUrl('ftp://localhost/vortex/web/pulls/3', {
          gitea: true,
        }),
      ).toBeNull();
    });
  });
});
