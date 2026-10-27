# Help Me Journal Backend

A TypeScript API for managing journal projects and their entries. It runs on
Cloudflare Workers, uses Hono for HTTP routing, Clerk for authentication, and
Prisma with Cloudflare D1 (SQLite) for persistence.

## Features

- Clerk-authenticated API with data scoped to the signed-in user
- Project and journal-container management
- Zod request validation
- CORS support for the frontend and local development
- API rate limiting (300 requests per 15-minute window, keyed by client IP)
- Cloudflare D1 database with versioned SQL migrations
- Public health check at `GET /health`

## Requirements

- Bun
- A Cloudflare account with a D1 database
- A Clerk application

## Local development

### 1. Install dependencies

```sh
bun install
```

### 2. Configure Clerk

Create a `.dev.vars` file in the repository root for local Worker secrets:

```env
CLERK_SECRET_KEY=your_clerk_secret_key
```

Keep the Clerk secret private. The Clerk publishable key is used by the
frontend, not this API. Wrangler reads `.dev.vars` for local development; it is
ignored by Git.

`FRONTEND_URL` is configured in `wrangler.jsonc`. It currently allows
`https://vyombudha.github.io`; the API also allows `http://localhost:5173` for
local frontend development. Update the configured URL if the frontend origin
changes.

### 3. Apply local D1 migrations

```sh
bun run db:migrate:local
```

The local database is managed by Wrangler under `.wrangler/`. The command
applies SQL migrations from `migrations/` to the `journal-db` D1 binding.

### 4. Start the local Worker

```sh
bun run dev
```

This generates the Prisma client and starts `wrangler dev`. Check that the
Worker is responding:

```sh
curl http://localhost:8787/health
```

Expected response:

```json
{ "ok": true }
```

## Deployment

Authenticate Wrangler with Cloudflare if you have not already:

```sh
bunx wrangler login
```

Set the Clerk secret for the deployed Worker:

```sh
bunx wrangler secret put CLERK_SECRET_KEY
```

Apply migrations to the remote D1 database before deploying:

```sh
bun run db:migrate:remote
```

Deploy the Worker:

```sh
bun run deploy
```

The D1 binding name, database ID, migration directory, and frontend origin are
configured in `wrangler.jsonc`. Verify that the binding points to the intended
database before applying remote migrations.

## API

All routes except `GET /health` require a valid Clerk session token:

```http
Authorization: Bearer <clerk-session-token>
```

Resource routes are under `/api/v1`. Successful responses use this shape:

```json
{
  "success": true,
  "data": {}
}
```

Project and container IDs must be UUIDs. A user can only access their own
projects and containers.

### Health

| Method | Path | Authentication | Description |
| --- | --- | --- | --- |
| GET | `/health` | Not required | Service health check |

### Projects

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/v1/projects` | List the current user's projects |
| POST | `/api/v1/projects` | Create a project |
| GET | `/api/v1/projects/:projectId` | Get a project |
| PATCH | `/api/v1/projects/:projectId` | Update a project's name and description |
| DELETE | `/api/v1/projects/:projectId` | Delete a project and its containers |

Create a project:

```json
{
  "name": "Daily Reflection",
  "description": "A place to collect daily thoughts."
}
```

On creation, `name` is trimmed and must be 1-30 characters; `description` must
be 1-200 characters. Project names must be unique for each owner.

Update a project (both fields are required):

```json
{
  "newName": "Weekly Reflection",
  "newDescription": "A place to collect weekly thoughts."
}
```

The updated `newName` is trimmed and must be 1-100 characters.

### Containers

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/v1/projects/:projectId/containers` | List a project's containers |
| POST | `/api/v1/projects/:projectId/containers` | Create a container in a project |
| GET | `/api/v1/containers/:containerId` | Get a container |
| PATCH | `/api/v1/containers/:containerId/title` | Update a container's title |
| PATCH | `/api/v1/containers/:containerId/content` | Update a container's content |
| DELETE | `/api/v1/containers/:containerId` | Delete a container |

Create a container:

```json
{
  "title": "Morning Journal",
  "type": "JOURNAL",
  "moods": ["HAPPY", "CALM"]
}
```

`title` is trimmed and must be 1-100 characters. `type` must be `JOURNAL` or
`TECHNICAL_NOTE`. `moods` is a required array; supported values are `HAPPY`,
`CALM`, `SAD`, `ANGRY`, `ANXIOUS`, `EXCITED`, `TIRED`, and `NEUTRAL`.

Update a title:

```json
{
  "newTitle": "Evening Journal"
}
```

Update content:

```json
{
  "newContent": "Today I felt calm and focused."
}
```

Both update fields are required and trimmed. `newContent` can be any string,
including an empty string, with no length limit. The API does not currently
expose endpoints for changing a container's type, moods, or template
configuration.

### Errors and limits

Errors return JSON with `success: false` and a `message`. Common status codes:

- `400` — invalid request body or path parameter
- `401` — missing or invalid authentication
- `404` — resource or route not found
- `409` — duplicate or conflicting data
- `429` — rate limit exceeded
- `500` — unexpected server error

## Data model

- **User:** Clerk user ID, unique email, optional name, and timestamps.
- **Project:** UUID, name, description, owner, status (`IN_PROGRESS`,
  `COMPLETED`, or `ABANDONED`), and timestamps.
- **Container:** UUID, title, content, type, moods, optional template
  configuration, parent project, and timestamps.

Deleting a user cascades to their projects; deleting a project cascades to its
containers. Project names are unique per owner, and container titles are
unique per project.

## Database migrations

SQL migrations for D1 live in `migrations/`. Apply them locally or remotely
with:

```sh
bun run db:migrate:local
bun run db:migrate:remote
```

To print SQL for a fresh database after changing `prisma/schema.prisma`:

```sh
bun run db:diff
```

Review generated SQL for SQLite/D1 compatibility, save the migration under
`migrations/` with the next sequential name, and apply it locally before
deploying. Do not edit an already-applied migration; add a new migration
instead.

## Development checks and tests

Run the TypeScript check with:

```sh
bun run typecheck
```

Run the API integration tests inside Cloudflare's Workers runtime with the
Vitest plugin:

```sh
bun run test
```

The test runner uses Miniflare's local D1 implementation and applies the SQL
migrations in `migrations/` to an isolated test database. It mocks Clerk
authentication while exercising the real Hono routes and Prisma/D1 queries;
no Cloudflare account, PostgreSQL service, or Clerk credentials are needed.
The test database is separate from Wrangler's local development database.

For watch mode during development:

```sh
bun run test:watch
```

Test type-checking is available separately:

```sh
bun run typecheck:test
```

## Project layout

```text
src/
  app.ts                 Hono app, middleware, and route mounting
  modules/
    Projects/            Project routes, validation, controllers, and services
    Containers/          Container routes, validation, controllers, and services
  shared/
    db/                  Prisma client and D1 adapter
    middleware/          Authentication, rate limiting, and error handling
migrations/              Versioned D1 SQL migrations
prisma/
  schema.prisma          Prisma data model
wrangler.jsonc           Worker entry point, D1 binding, and frontend URL
```
