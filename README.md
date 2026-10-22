# Vortex Sync — Project Tracker

A full-stack project and task tracker for a dev team. Manage **projects**, **tasks** and **team members**, see a live **dashboard**, and get **notifications** when work is assigned to you.

- **Frontend:** Vue 3 + Vite, Pinia, Vue Router, PrimeVue, Tailwind CSS
- **Backend:** NestJS 11 REST API, TypeORM, Microsoft SQL Server, JWT auth, Swagger
- **Messaging:** RabbitMQ + a separate NestJS notification microservice

---

## Table of contents

- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [API overview](#api-overview)
- [Authentication](#authentication)
- [Notifications](#notifications)
- [Optional: encrypted payloads](#optional-encrypted-payloads)
- [Database and migrations](#database-and-migrations)
- [Troubleshooting](#troubleshooting)

---

## Architecture

```mermaid
flowchart LR
    UI["Vue 3 SPA<br/>localhost:3000"] -- "REST + JWT<br/>/api/*" --> API["NestJS API<br/>localhost:3001"]
    API -- TypeORM --> DB[("SQL Server")]
    API -- "publish events" --> MQ[["RabbitMQ<br/>notifications_queue"]]
    MQ -- consume --> NS["Notification microservice<br/>(no HTTP)"]
    NS -- TypeORM --> DB
```

The backend runs as **two processes** from the same codebase:

| Process | Entry file | What it does |
|---|---|---|
| **API** | `backend/src/main.ts` | HTTP REST API on port `3001`, Swagger docs, JWT guard. Publishes events to RabbitMQ. |
| **Notification service** | `backend/src/NotificationMain.ts` | Listens to RabbitMQ, saves notification rows, and runs a daily 8:00 AM reminder job. |

## Project structure

```
projectvuejs/
├── backend/                     NestJS API + notification microservice
│   └── src/
│       ├── main.ts              API entry point (port 3001)
│       ├── NotificationMain.ts  Notification microservice entry point
│       ├── app.module.ts        Root module (DB, auth, feature modules)
│       ├── common/              Interceptors (encryption) and pipes
│       ├── database/            TypeORM CLI data source + migrations
│       ├── messaging/           RabbitMQ client, event names, event payloads
│       └── modules/
│           ├── auth/            Register, login, JWT guard, @Public()
│           ├── dashboard/       Dashboard overview
│           ├── project/         Projects CRUD
│           ├── tasks/           Tasks CRUD + assignment
│           ├── team/            Team members + positions
│           ├── notification/    Notification API, consumer, scheduler
│           └── settings/        Profile + about
├── frontend/                    Vue 3 + Vite SPA
│   └── src/
│       ├── views/               Login, Dashboard, Projects, Tasks, Teams, Settings
│       ├── components/          Sidebar, NotificationBell, reusable App* components
│       ├── composables/         useProject, useTask, useTeam, useDashBoard, ...
│       ├── store/               Pinia stores (auth, project, task, team, notification)
│       ├── api/                 Request/response DTO helpers
│       ├── plugins/axios.js     Axios instance (JWT header, optional encryption)
│       ├── router/              Routes + login guard
│       └── utils/               Crypto, formatters, status colors
├── docker-compose.yml           Local RabbitMQ
└── package.json                 Yarn workspaces root
```

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | `^20.19.0` or `>=22.12.0` |
| Yarn | Classic (1.x) — the root uses Yarn workspaces |
| Microsoft SQL Server | Any recent version, reachable from your machine |
| Docker | For running RabbitMQ locally |

## Getting started

### 1. Clone and install

```bash
git clone https://github.com/Dumangasleo/Project-Tracker.git
cd Project-Tracker
yarn install
```

### 2. Start RabbitMQ

```bash
docker compose up -d
```

The management UI is at <http://localhost:15672> (login: `guest` / `guest`).

### 3. Create the database

Create an empty database in SQL Server (for example `VortexSync`). You don't need to create tables — in development, TypeORM creates them automatically (`DB_SYNC=true`).

### 4. Configure environment files

Create `backend/.env` and `frontend/.env`. See [Environment variables](#environment-variables) for every key.

### 5. Run the app

Open three terminals in the project root:

```bash
yarn backend
```

```bash
yarn notification
```

```bash
yarn frontend
```

| What | URL |
|---|---|
| Web app | <http://localhost:3000> |
| API | <http://localhost:3001/api> |
| Swagger docs | <http://localhost:3001/api/docs> |

### 6. Create your account

Open <http://localhost:3000>, click **No account? Register**, and sign up. On a fresh database, the first registration also creates a default `Member` position.

## Environment variables

> `.env` files are git-ignored. Never commit real passwords or secrets.

### `backend/.env`

```env
# SQL Server
DB_HOST=localhost
DB_PORT=1433
DB_USERNAME=sa
DB_PASSWORD=your_password
DB_NAME=VortexSync

# TypeORM auto-sync: true for dev, false for prod (use migrations instead)
DB_SYNC=true

# JWT
JWT_SECRET=change-me-to-a-long-random-string
JWT_EXPIRES_IN=1d

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672

# Base32 secret for the optional encrypted-payload handshake
SECRET_KEY=JBSWY3DPEHPK3PXP

# Optional — API port (default 3001)
# PORT=3001
```

| Key | Required | Default | Notes |
|---|---|---|---|
| `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` | Yes | — | SQL Server connection. Used by both backend processes and the TypeORM CLI. |
| `DB_SYNC` | No | `true` | Auto-creates/updates tables from entities. Set to `false` in production. |
| `JWT_SECRET` | Yes in prod | `dev-insecure-secret-change-me` | Signs access tokens. |
| `JWT_EXPIRES_IN` | No | `1d` | Token lifetime (e.g. `1h`, `7d`). |
| `RABBITMQ_URL` | No | `amqp://guest:guest@localhost:5672` | Used by the API (publisher) and the notification service (consumer). |
| `SECRET_KEY` | Only if encryption is on | — | Must match the frontend's `VITE_SECRET_KEY`. |
| `PORT` | No | `3001` | API HTTP port. |

### `frontend/.env`

```env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_SECRET_KEY=JBSWY3DPEHPK3PXP
VITE_ENABLE_ENCRYPTION=false
```

| Key | Default | Notes |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:3001/api` | Base URL for all Axios calls. |
| `VITE_SECRET_KEY` | — | Must match the backend's `SECRET_KEY`. |
| `VITE_ENABLE_ENCRYPTION` | `false` | Turns on the encrypted-payload handshake. See below. |

## Scripts

### Root (run from the project root)

| Command | What it does |
|---|---|
| `yarn frontend` | Start the Vite dev server on port 3000 |
| `yarn backend` | Start the NestJS API in watch mode |
| `yarn notification` | Start the notification microservice in watch mode |
| `yarn build:all` | Build both frontend and backend |

### Backend (`yarn workspace backend <script>`)

| Script | What it does |
|---|---|
| `build` | Compile to `backend/dist` |
| `start:prod` | Run the compiled API (`node dist/main`) |
| `start:notification:prod` | Run the compiled notification service |
| `lint` / `format` | ESLint fix / Prettier format |
| `test`, `test:watch`, `test:cov`, `test:e2e` | Jest tests |
| `migration:generate`, `migration:run`, `migration:revert` | TypeORM migrations |

### Frontend (`yarn workspace frontend <script>`)

| Script | What it does |
|---|---|
| `dev` | Vite dev server |
| `build` | Production build to `frontend/dist` |
| `preview` | Serve the production build on port 3000 |

## API overview

All routes are prefixed with `/api`. Full request/response schemas are in Swagger at `/api/docs`.

| Area | Method & path |
|---|---|
| Health | `GET /api` *(public)* |
| Auth | `POST /auth/register` *(public)* · `POST /auth/login` *(public)* · `GET /auth/me` |
| Dashboard | `GET /dashboard/overview` |
| Projects | `GET /projects` · `GET /projects/search/list` · `POST /projects/assign-projects` · `PUT /projects/update-projects/:id` · `DELETE /projects/delete-projects/:id` |
| Tasks | `GET /tasks` · `POST /tasks/assign` · `PUT /tasks/:id` · `DELETE /tasks/:id` |
| Team | `GET /team` · `GET /team/positions` · `POST /team` · `PUT /team/:id` · `DELETE /team/:id` |
| Notifications | `GET /notifications` · `PATCH /notifications/read-all` · `PATCH /notifications/:id/read` |
| Settings | `GET /settings/profile` · `GET /settings/about` |

## Authentication

- Every route needs a JWT **by default** — a global `JwtAuthGuard` is registered in `AuthModule`. Routes that should be open are marked with `@Public()`.
- `POST /auth/login` and `POST /auth/register` return `{ accessToken, user }`.
- The frontend stores the token in `localStorage` (`vortex_token`) and sends it as `Authorization: Bearer <token>`.
- On a `401`, the frontend clears the session and redirects to `/login`.
- In Swagger, click **Authorize** and paste the `accessToken` to call protected routes.

## Notifications

The API publishes these events to the `notifications_queue` in RabbitMQ:

| Event | When |
|---|---|
| `task.assigned` | A task is created/assigned (`POST /tasks/assign`) |
| `project.created` | A new project is created (`POST /projects/assign-projects`) |
| `member.registered` | A member is added from the Team page (`POST /team`) |

The notification microservice consumes them and saves notification rows to the database. The frontend reads them through `GET /api/notifications` (shown in the bell icon).

It also runs a scheduled job **every day at 8:00 AM** that creates reminders for open delegated tasks (no duplicates).

> Publishing is fire-and-forget. If the notification service is down, events wait in the queue until it starts. If RabbitMQ itself is down, the API still works — it only logs a warning and the notification is lost.

## Optional: encrypted payloads

The project includes a TOTP + AES request/response encryption handshake (`frontend/src/utils/Crypto.js` and `backend/src/common/interceptors/`). It is **off by default**.

To turn it on, do **both**:

1. Set `VITE_ENABLE_ENCRYPTION=true` in `frontend/.env`, with `VITE_SECRET_KEY` matching the backend's `SECRET_KEY`.
2. Uncomment the `EncryptionInterceptor` / `DecryptionInterceptor` providers in `backend/src/app.module.ts`.

Turning on only one side breaks every request, because the other side can't read the `{ data: ... }` payload.

## Database and migrations

- **Development:** keep `DB_SYNC=true`. Tables are created and updated from the `*.entities.ts` files when the app starts.
- **Production:** set `DB_SYNC=false` and use migrations:

```bash
yarn workspace backend migration:generate
```

```bash
yarn workspace backend migration:run
```

Migrations are saved in `backend/src/database/migrations/`. The CLI config is `backend/src/database/data-source.ts` — keep it in sync with the connection settings in `app.module.ts`.

## Troubleshooting

| Problem | Fix |
|---|---|
| API fails to start with a DB connection error | Check SQL Server is running, TCP/IP is enabled, and the `DB_*` values in `backend/.env` are correct. |
| Notification service fails to start | Make sure RabbitMQ is up: `docker compose ps`. |
| Every request returns `400` | Encryption is on in only one side. See [Optional: encrypted payloads](#optional-encrypted-payloads). |
| Redirected to `/login` all the time | Token expired or `JWT_SECRET` changed. Log in again. |
| No notifications appear | Start the notification service with `yarn notification`. |
