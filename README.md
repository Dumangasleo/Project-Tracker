# Vortex Sync

Project, task and team tracker. **Vue 3 + TypeScript** frontend, **NestJS 11** API, **SQL Server**, **RabbitMQ** notification worker.

## Architecture

```
frontend/src
├── app/        shell: router, layouts, bootstrapping
├── core/       infrastructure: env, HTTP client (headers, token refresh)
├── shared/     design system (ui/), composables, utils, shared types
└── features/   auth · dashboard · projects · tasks · reviews · team · notifications · settings
                each: api/ → model/ → store/ → components/ → views/

backend/src
├── config/     env validation, database, swagger
├── common/     guards, filters, decorators, middleware, pagination
├── messaging/  RabbitMQ publisher + event contracts
└── modules/    auth (+sso) · team · projects · tasks · reviews · data-protection · dashboard · notifications · settings · health
```

Features only import each other through their `index.ts`. `core/` never imports a feature.

## Security model

| Concern | Implementation |
|---|---|
| Access token | JWT (HS256, 15 min, `iss`/`aud` checked), kept **in memory** only, sent as `Authorization: Bearer` |
| Refresh token | Random 384-bit value, **httpOnly + SameSite=Strict** cookie scoped to `/api/v1/auth`, stored **hashed**, rotated on every use; reuse revokes the whole session family |
| Every request | `X-Client-Id` (allow-listed), `X-Client-Timestamp` (±5 min, auto-corrected from `X-Server-Timestamp`), `X-Request-Id` (echoed back, logged) |
| Defaults | Global JWT guard (opt out with `@Public()`), rate limiting (10/min on auth), Helmet, strict CORS, DTO whitelisting, uniform error body |
| SSO | OpenID Connect code flow + PKCE + state + nonce, done server-side. Google and Microsoft. Accounts link by **verified** email only |
| Passwords | bcrypt hashes, never stored or returned in plain text |
| Personal data at rest | Emails, contact numbers, addresses and linked SSO emails are encrypted with AES-256-GCM (`DATA_ENCRYPTION_KEY`). Login and duplicate checks use a keyed HMAC "blind index" (`EmailHash`), so the plain email is never needed in a query. Rows saved before encryption existed are encrypted automatically on the next API start |

No secret lives in the browser: anything shipped to the frontend is public, so authentication relies on the bearer token, the httpOnly cookie and HTTPS.

## Run locally

```bash
corepack yarn install
```

```bash
docker compose up -d
```

Copy `backend/.env.example` → `backend/.env` and `frontend/.env.example` → `frontend/.env`, then fill in the database and `JWT_SECRET`.

```bash
corepack yarn backend
```

```bash
corepack yarn frontend
```

Optional, for notifications: `corepack yarn notification`.

App: <http://localhost:3000> · API: <http://localhost:3001/api/v1> · Swagger: <http://localhost:3001/api/docs>

`backend/.env` also needs `DATA_ENCRYPTION_KEY` (at least 32 random characters). **Back it up and never change it** once data is encrypted: without it, emails and contact details cannot be read.

## Code reviews

When a developer finishes an assigned task, they open **Tasks → Submit for review**, paste the GitHub or Bitbucket pull request link, write a message for reviewers, and pick the senior developers who should review it.

- The task moves to **In review**. Reviewers get a notification and see it under **Code reviews → Needs my review**.
- Everyone can comment, optionally on a specific file and line. Comments can be resolved.
- Reviewers **Approve** or **Request changes** (one change request blocks approval). Approval marks the task **Done**; a change request moves it back to **In progress** until the author clicks **Ask for another review**.
- **Automated checks** run on every submit and re-review:
  - Free pattern checks on the added lines: committed secrets and `.env` files, SQL built with `${}`, `v-html`, `eval`, disabled TLS, leftover `console.log`/`debugger`, `.only` tests, `any`, TODOs, very large PRs.
  - An AI reviewer (Google Gemini free tier) that looks for security holes and bugs and writes a short summary. Add `GEMINI_API_KEY` (free from <https://aistudio.google.com/apikey>) to `backend/.env`; without it only the pattern checks run. `AI_REVIEW_MODEL` defaults to `gemini-3.5-flash-lite`. On the free tier Google may use the submitted code to improve its models, so use a paid key for code you cannot share.
- Public repositories work without tokens. For private ones set `GITHUB_TOKEN` (read access to pull requests) or `BITBUCKET_TOKEN` (repository/workspace access token, or an Atlassian API token together with `BITBUCKET_EMAIL`).

With `DB_SYNC=false` (production), generate a migration for the new `CodeReviews`, `ReviewReviewers` and `ReviewComments` tables and the `TeamMembers.EmailHash`, `TeamMembers.GitUsername`, `projects.Repository` and `CodeReviews.HeadSha` columns before deploying.

## Own Git server (repositories, pull requests, CI/CD)

Vortex Sync ships with a self-hosted [Gitea](https://about.gitea.com/) server, so the team does not need Bitbucket or GitHub. It runs next to RabbitMQ in `docker-compose.yml`, with a Gitea Actions runner for CI/CD.

```bash
docker compose up -d
```

```bash
corepack yarn git:setup
```

`git:setup` creates the admin bot, the `vortex` organization, a **Developers** team, the webhook to the API and the CI runner, and writes `GITEA_*` to `backend/.env` (restart the API afterwards). It is safe to run again.

Daily flow:

1. **Settings → Git account**: each member creates their Git username and password once.
2. **Projects → … → Repository**: create a private repository (it comes with `.gitea/workflows/ci.yml`) or link an existing one. The panel shows the HTTP/SSH clone URLs and **Open in VS Code / IntelliJ IDEA / WebStorm** buttons (the JetBrains ones need JetBrains Toolbox; otherwise use *Get from VCS* with the HTTP URL).
3. **Tasks** show a key like `T-12`. Use **Copy branch name** (`task/12-checkout-page`), push, and open a pull request on the Git server with `T-12` in the title or branch.
4. The pull request appears in **Code reviews** automatically (reviewers: the ones requested on the PR, otherwise the project lead). Pattern checks and the AI review run and are also posted on the pull request as inline comments. New pushes re-run them.
5. The **CI pipeline** status shows on the review. After approval, **Merge** merges the pull request on the Git server and the task becomes **Done**.

Gitea is at <http://localhost:3002>. `GITEA_PUBLIC_URL` (default `http://host.docker.internal:3002`) must be reachable from browsers and from CI job containers; for a team server set it to the server's LAN name or IP in the root `.env`, then re-register the runner as described at the top of `docker-compose.yml`.

## SSO setup

Leave the keys empty to hide a provider's button. Register these redirect URIs:

- Google (Cloud Console → OAuth client, *Web*): `http://localhost:3000/api/v1/auth/sso/google/callback`
- Microsoft (Entra ID → App registration, *Web*): `http://localhost:3000/api/v1/auth/sso/microsoft/callback`. Add the optional ID-token claims `email` and `xms_edov` so work accounts can prove email ownership.

## Scripts

| Command | Does |
|---|---|
| `corepack yarn test` | Backend unit tests |
| `corepack yarn workspace frontend typecheck` | Strict `vue-tsc` check |
| `corepack yarn build:all` | Production builds |
| `corepack yarn git:setup` | Configure the self-hosted Git server, webhook and CI runner |
| `corepack yarn workspace backend migration:generate` | Create a migration (production uses `DB_SYNC=false`) |
