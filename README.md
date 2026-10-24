# Vortex Sync

Project, task and team tracker. **Vue 3 + TypeScript** frontend, **NestJS 11** API, **SQL Server**, **RabbitMQ** notification worker.

## Architecture

```
frontend/src
├── app/        shell: router, layouts, bootstrapping
├── core/       infrastructure: env, HTTP client (headers, token refresh)
├── shared/     design system (ui/), composables, utils, shared types
└── features/   auth · dashboard · projects · tasks · team · notifications · settings
                each: api/ → model/ → store/ → components/ → views/

backend/src
├── config/     env validation, database, swagger
├── common/     guards, filters, decorators, middleware, pagination
├── messaging/  RabbitMQ publisher + event contracts
└── modules/    auth (+sso) · team · projects · tasks · dashboard · notifications · settings · health
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
| `corepack yarn workspace backend migration:generate` | Create a migration (production uses `DB_SYNC=false`) |
