# Help Me Journal Backend

A TypeScript API for managing journal workspaces and their pages. It runs on
Cloudflare Workers, uses Hono for HTTP routing, Clerk for authentication, and
Prisma with Cloudflare D1 (SQLite) for persistence.

## Commands

| Order | Command | Description |
| --- | --- | --- |
| Install | `bun install` | Install dependencies |
| Dev | `bun run dev` | Generate the Prisma client and start the local Worker |
| Test | `bun run test` | Run the integration tests |
| Test | `bun run test:watch` | Run the integration tests in watch mode |
| Typecheck | `bun run typecheck` | Type-check the application |
| Typecheck | `bun run typecheck:test` | Type-check the tests |
| Database | `bun run db:diff` | Generate SQL from the Prisma schema |
| Database | `bun run db:migrate:local` | Apply migrations to local D1 |
| Database | `bun run db:migrate:remote` | Apply migrations to remote D1 |
| Deploy | `bunx wrangler login` | Authenticate Wrangler with Cloudflare |
| Deploy | `bunx wrangler d1 create journal-db` | Create the D1 database for this Worker |
| Deploy | `bunx wrangler secret put CLERK_SECRET_KEY` | Set the deployed Clerk secret |
| Deploy | `bun run deploy` | Generate the Prisma client and deploy the Worker |

## Features

- Clerk-authenticated API with data scoped to the signed-in user
- Workspace and page management
- Zod request validation
- CORS support for the frontend and local development
- API rate limiting (300 requests per 15-minute window, keyed by client IP)
- Cloudflare D1 database with versioned SQL migrations
- Public health check at `GET /health`

## Requirements

- Bun
- A Cloudflare account with a D1 database
- A Clerk application

## Setup from a fresh clone

Run these steps from a terminal. You need Bun, Git, a Clerk application, and a
Cloudflare account.

1. Clone the repository and enter its directory:

   ```sh
   git clone https://github.com/Vyombudha/help-me-journal-backend.git && cd help-me-journal-backend
   ```

2. Install dependencies:

   ```sh
   bun install
   ```

3. Create `.dev.vars` with the Clerk secret key from your Clerk dashboard. The
   command prompts for the value without displaying it:

   ```sh
   read -rsp "Clerk secret key: " CLERK_SECRET_KEY; printf '\nCLERK_SECRET_KEY=%s\n' "$CLERK_SECRET_KEY" > .dev.vars; unset CLERK_SECRET_KEY
   ```

   `.dev.vars` is used by Wrangler for local development and is ignored by
   Git. Do not commit or share the secret.

4. Generate the Prisma client:

   ```sh
   bunx prisma generate --config prisma7.config.ts
   ```

5. Apply migrations to the local D1 database:

   ```sh
   bun run db:migrate:local
   ```

6. Run the integration tests:

   ```sh
   bun run test
   ```

7. Start the local Worker:

   ```sh
   bun run dev
   ```

8. In a second terminal, check the health endpoint:

   ```sh
   curl http://localhost:8787/health
   ```

   Expected response:

   ```json
   { "ok": true }
   ```

### Reset the local D1 database

This removes Wrangler's local D1 data. Run it only when you intend to reset
that local database, then reapply migrations:

```sh
rm -rf .wrangler/state/v3/d1
bun run db:migrate:local
```

## First deployment

1. Authenticate Wrangler with Cloudflare:

   ```sh
   bunx wrangler login
   ```

2. Create the D1 database:

   ```sh
   bunx wrangler d1 create journal-db
   ```

   Copy the `database_id` from Wrangler's output into the `database_id` field
   for the `DB` binding in `wrangler.jsonc`. Keep the existing binding name,
   database name, and migrations directory.

3. Set the Clerk secret for the deployed Worker. Wrangler will prompt for its
   value:

   ```sh
   bunx wrangler secret put CLERK_SECRET_KEY
   ```

4. Apply migrations to the remote D1 database:

   ```sh
   bun run db:migrate:remote
   ```

5. Deploy the Worker:

   ```sh
   bun run deploy
   ```

6. Check the deployed health endpoint. Enter the Worker URL shown by Wrangler
   after deployment when prompted:

   ```sh
   read -rp "Worker URL (for example https://name.account.workers.dev): " WORKER_URL; curl "${WORKER_URL%/}/health"
   ```

   Expected response:

   ```json
   { "ok": true }
   ```

## Migration workflow

1. Edit `prisma/schema.prisma`.
2. Generate SQL from the schema:

   ```sh
   bun run db:diff
   ```

3. Review the generated SQL for SQLite/D1 compatibility and save the migration
   as the next sequential `migrations/000N_description.sql`. The `db:diff`
   script generates a fresh-schema SQL diff; for an existing database, adapt
   the output into a migration that changes the current schema rather than
   replaying table-creation statements.
   
4. Apply the migration locally:

   ```sh
   bun run db:migrate:local
   ```

5. Run the integration tests:

   ```sh
   bun run test
   ```

6. Apply the migration remotely after verifying the target D1 database:

   ```sh
   bun run db:migrate:remote
   ```

Never edit a migration that has already been applied; add a new migration.

## Troubleshooting

| Error or symptom | Fix |
| --- | --- |
| `no such table` | Confirm a migration creates the table in `migrations/`, then run `bun run db:migrate:local`. Tests apply migrations to an isolated database, so update the migration files too. |
| Prisma client is not generated or generated client imports fail | Run `bunx prisma generate --config prisma7.config.ts`. |
| Missing `CLERK_SECRET_KEY` during local development | Add the Clerk secret to the repository-root `.dev.vars` file. |
| API returns `401` | Send a valid Clerk session token; confirm the local Worker has the correct `CLERK_SECRET_KEY` in `.dev.vars`. |
| Browser reports a CORS error | Confirm the frontend origin matches `FRONTEND_URL` in `wrangler.jsonc`; local frontend development on `http://localhost:5173` is also allowed. |

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

Workspace and page IDs must be UUIDs. A user can only access their own
workspaces and pages.

### Health

| Method | Path | Authentication | Description |
| --- | --- | --- | --- |
| GET | `/health` | Not required | Service health check |

### Workspaces

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/v1/workspaces` | List the current user's workspaces |
| POST | `/api/v1/workspaces` | Create a workspace |
| GET | `/api/v1/workspaces/:workspaceId` | Get a workspace |
| PATCH | `/api/v1/workspaces/:workspaceId` | Update a workspace's name and description |
| DELETE | `/api/v1/workspaces/:workspaceId` | Delete a workspace and its pages |

Create a workspace:

```json
{
  "name": "Daily Reflection",
  "description": "A place to collect daily thoughts."
}
```

On creation, `name` is trimmed and must be 1-30 characters; `description` must
be 1-200 characters. Workspace names must be unique for each owner.

Update a workspace (both fields are required):

```json
{
  "newName": "Weekly Reflection",
  "newDescription": "A place to collect weekly thoughts."
}
```

The updated `newName` is trimmed and must be 1-100 characters.

### Pages

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/v1/workspaces/:workspaceId/pages` | List a workspace's pages |
| POST | `/api/v1/workspaces/:workspaceId/pages` | Create a page in a workspace |
| GET | `/api/v1/pages/:pageId` | Get a page |
| PATCH | `/api/v1/pages/:pageId/title` | Update a page's title |
| PATCH | `/api/v1/pages/:pageId/content` | Update a page's content |
| DELETE | `/api/v1/pages/:pageId` | Delete a page |

Create a page:

```json
{
  "title": "Morning Journal",
  "moods": ["HAPPY", "CALM"]
}
```

`title` is trimmed and must be 1-500 characters. `moods` is a required array;
supported values are `HAPPY`,
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
including an empty string, with no length limit. The API does not currently expose endpoints for changing a page's status,
moods, or template configuration.

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
- **Workspace:** UUID, name, description, owner, and timestamps.
- **Page:** UUID, title, content, status (`IN_PROGRESS`, `COMPLETED`, or
  `ABANDONED`), moods, optional template configuration, parent workspace, and
  timestamps.

Deleting a user cascades to their workspaces; deleting a workspace cascades to
its pages. Workspace names are unique per owner, and page titles are unique
per workspace.

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

## Repository layout

```text
src/
  app.ts                 Hono app, middleware, and route mounting
  modules/
    Workspaces/          Workspace routes, validation, controllers, and services
    Pages/               Page routes, validation, controllers, and services
  shared/
    db/                  Prisma client and D1 adapter
    middleware/          Authentication, rate limiting, and error handling
migrations/              Versioned D1 SQL migrations
prisma/
  schema.prisma          Prisma data model
wrangler.jsonc           Worker entry point, D1 binding, and frontend URL
```
