// One-time (and re-runnable) setup of the self-hosted Gitea server for Vortex Sync.
// Usage: docker compose up -d gitea && corepack yarn git:setup
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const CONTAINER = 'vortex-gitea';
const ADMIN = 'vortex-admin';
const ORG = process.env.GITEA_ORG || 'vortex';
const GITEA_URL = process.env.GITEA_URL || 'http://localhost:3002';
const WEBHOOK_URL =
  process.env.GITEA_WEBHOOK_URL || 'http://host.docker.internal:3001/api/v1/integrations/gitea/webhook';
const BACKEND_ENV = 'backend/.env';
const ROOT_ENV = '.env';

const run = (command, args) =>
  execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const gitea = (...args) => run('docker', ['exec', '-u', 'git', CONTAINER, 'gitea', ...args]);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function readEnv(path) {
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function envValue(path, key) {
  return readEnv(path).match(new RegExp(`^${key}=(.*)$`, 'm'))?.[1]?.trim() ?? '';
}

function upsertEnv(path, values) {
  let text = readEnv(path);
  for (const [key, value] of Object.entries(values)) {
    const line = `${key}=${value}`;
    const pattern = new RegExp(`^${key}=.*$`, 'm');
    text = pattern.test(text) ? text.replace(pattern, line) : `${text.replace(/\n*$/, '\n')}${line}\n`;
  }
  writeFileSync(path, text);
}

async function api(token, method, path, body) {
  const response = await fetch(`${GITEA_URL}/api/v1${path}`, {
    method,
    headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok && response.status !== 404) {
    throw new Error(`${method} ${path} -> ${response.status} ${text}`);
  }
  return { status: response.status, data: text ? JSON.parse(text) : null };
}

async function waitForGitea() {
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      if ((await fetch(`${GITEA_URL}/api/healthz`)).ok) return;
    } catch {
      // not up yet
    }
    await sleep(2000);
  }
  throw new Error(`Gitea did not start at ${GITEA_URL}. Check: docker compose logs gitea`);
}

console.log('Starting Gitea…');
run('docker', ['compose', 'up', '-d', 'gitea']);
await waitForGitea();

if (!gitea('admin', 'user', 'list', '--admin').split('\n').some((line) => line.includes(` ${ADMIN} `))) {
  console.log(`Creating admin bot "${ADMIN}"…`);
  gitea('admin', 'user', 'create', '--admin', '--username', ADMIN, '--email', `${ADMIN}@vortex.local`,
    '--random-password', '--must-change-password=false');
}
const token = gitea('admin', 'user', 'generate-access-token', '--username', ADMIN,
  '--token-name', `vortex-sync-${Date.now()}`, '--scopes', 'all', '--raw');

if ((await api(token, 'GET', `/orgs/${ORG}`)).status === 404) {
  console.log(`Creating organization "${ORG}"…`);
  await api(token, 'POST', '/orgs', { username: ORG, full_name: 'Vortex Sync', visibility: 'private' });
}

const teams = (await api(token, 'GET', `/orgs/${ORG}/teams`)).data ?? [];
if (!teams.some((team) => team.name === 'Developers')) {
  console.log('Creating the "Developers" team (write access to every repository)…');
  await api(token, 'POST', `/orgs/${ORG}/teams`, {
    name: 'Developers',
    description: 'Every Vortex Sync member with a Git account',
    permission: 'write',
    includes_all_repositories: true,
    can_create_org_repo: false,
    units_map: {
      'repo.code': 'write',
      'repo.pulls': 'write',
      'repo.issues': 'write',
      'repo.actions': 'write',
      'repo.releases': 'write',
      'repo.wiki': 'write',
      'repo.packages': 'read',
      'repo.projects': 'read',
    },
  });
}

const webhookSecret = envValue(BACKEND_ENV, 'GITEA_WEBHOOK_SECRET') || randomBytes(32).toString('hex');
const hooks = (await api(token, 'GET', `/orgs/${ORG}/hooks`)).data ?? [];
for (const hook of hooks.filter((existing) => existing.config?.url === WEBHOOK_URL)) {
  await api(token, 'DELETE', `/orgs/${ORG}/hooks/${hook.id}`);
}
await api(token, 'POST', `/orgs/${ORG}/hooks`, {
  type: 'gitea',
  active: true,
  branch_filter: '*',
  events: ['pull_request', 'pull_request_sync'],
  config: { url: WEBHOOK_URL, content_type: 'json', secret: webhookSecret },
});

const runnerToken = gitea('actions', 'generate-runner-token');

upsertEnv(BACKEND_ENV, {
  GITEA_URL,
  GITEA_TOKEN: token,
  GITEA_ORG: ORG,
  GITEA_WEBHOOK_SECRET: webhookSecret,
});
upsertEnv(ROOT_ENV, { GITEA_RUNNER_TOKEN: runnerToken, COMPOSE_PROFILES: 'ci' });

console.log('Starting the CI runner…');
run('docker', ['compose', 'up', '-d', 'gitea-runner']);

console.log(`
Gitea is ready.
  Web UI:        ${GITEA_URL}  (members sign in with the Git account they create in Vortex Sync → Settings)
  Organization:  ${ORG}
  Webhook:       ${WEBHOOK_URL}
Saved GITEA_* settings to ${BACKEND_ENV} and the runner token to ${ROOT_ENV}. Restart the API to pick them up.`);
