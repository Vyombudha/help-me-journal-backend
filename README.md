# Help Me Journal Backend

A Bun and TypeScript API for managing journal projects and their entries. It uses Hono for HTTP routing, Clerk for authentication, and Prisma with PostgreSQL for data storage.

## Features

- Clerk-authenticated API with user-scoped projects and containers
- Project and journal-container management
- Zod request validation
- CORS support for the frontend
- API rate limiting
- PostgreSQL migrations managed with Prisma
- Public health check at `/health`

## Requirements

- Bun
- PostgreSQL
- A Clerk application with backend and frontend credentials

## Local setup

### 1. Install dependencies

```sh
bun install
```

### 2. Configure environment variables

Copy `.example.env` to `.env` and set the values:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public
TEST_DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE_TEST?schema=public
PORT=3000
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
FRONTEND_URL=http://localhost:5173
```

- Use the PostgreSQL connection string provided by your database host. Add `sslmode=require` if your host requires TLS.
- Keep `TEST_DATABASE_URL` pointed at a separate, disposable database. The test setup resets it and deletes its data.
- Set Clerk keys from your Clerk dashboard. Keep the secret key private.
- `FRONTEND_URL` controls the allowed frontend origin. `http://localhost:5173` is also allowed by default.

Bun loads `.env` for the server. Prisma CLI loads it through `prisma7.config.ts`. Do not commit `.env` or share credentials.

### 3. Generate Prisma Client and apply migrations

```sh
bunx prisma generate --config prisma7.config.ts
bunx prisma migrate deploy --config prisma7.config.ts
```

`migrate deploy` applies committed migrations to the database named by `DATABASE_URL`. Confirm the URL points to the intended database before running it.

### 4. Start the API

```sh
bun run dev
```

The development command watches for file changes. To start without watch mode:

```sh
bun run start
```

The server uses `PORT` when set. Check that it is responding with:

```sh
curl http://localhost:3000/health
```

Expected response:

```json
{ "ok": true }
```

## API

Every route except `GET /health` requires a valid Clerk session token:

```http
Authorization: Bearer <clerk_session_token>
```

All resource routes are under `/api/v1`. Successful responses generally have this shape:

```json
{
  "success": true,
  "data": {}
}
```

Project and container ID path parameters must be UUIDs. Data is scoped to the authenticated user.

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

`name` is trimmed and must be 1-30 characters. `description` must be 1-200 characters. Project names must be unique for each owner.

Update a project (both fields are required):

```json
{
  "newName": "Weekly Reflection",
  "newDescription": "A place to collect weekly thoughts."
}
```

### Containers

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/v1/projects/:projectId/containers` | List a project's containers |
| POST | `/api/v1/projects/:projectId/containers` | Create a container in a project |
| GET | `/api/v1/containers/:containerId` | Get a container |
| PATCH | `/api/v1/containers/:containerId` | Update a container's title and optional moods |
| DELETE | `/api/v1/containers/:containerId` | Delete a container |

Create a container:

```json
{
  "title": "Morning Journal",
  "type": "JOURNAL",
  "moods": ["HAPPY", "CALM"]
}
```

`title` is trimmed and must be 1-100 characters. `type` must be `JOURNAL` or `TECHNICAL_NOTE`. Supported moods are `HAPPY`, `CALM`, `SAD`, `ANGRY`, `ANXIOUS`, `EXCITED`, `TIRED`, and `NEUTRAL`.

Update a container (title is required; moods are optional):

```json
{
  "newTitle": "Evening Journal",
  "newMoods": ["CALM", "TIRED"]
}
```

Containers have a `content` field that defaults to an empty string, but the current API does not provide an endpoint to update it.

### Errors and limits

Errors return JSON containing `success: false` and a `message`. Common status codes include:

- `400` — invalid request body or path parameter
- `401` — missing or invalid authentication
- `404` — resource or route not found
- `409` — duplicate or conflicting data
- `429` — rate limit exceeded
- `500` — unexpected server error

The API rate limit is 300 requests per 15-minute window.

## Data model

- **User:** Clerk user ID, unique email, optional name, and timestamps.
- **Project:** UUID, name, description, owner, status (`IN_PROGRESS`, `COMPLETED`, or `ABANDONED`), and timestamps.
- **Container:** UUID, title, content, type, mood list, optional template configuration, parent project, and timestamps.

Deleting a user cascades to their projects; deleting a project cascades to its containers.

## Development

### Type-check

```sh
bunx tsc --noEmit --project tsconfig.json
```

### Tests

Configure `TEST_DATABASE_URL` to point to a separate throwaway PostgreSQL database, then run:

```sh
bun test
```

The Bun test preload runs `prisma migrate reset` against `TEST_DATABASE_URL` before the suite. This removes existing data from that database and reapplies the migrations. Never point it at production or any database containing data you need. CI provisions its own PostgreSQL service and isolated test database.

### Database migrations

After changing `prisma/schema.prisma`, create and apply a migration during development:

```sh
bunx prisma migrate dev --name describe-your-change --config prisma7.config.ts
```

Commit the resulting migration. Apply committed migrations in deployed environments with:

```sh
bunx prisma migrate deploy --config prisma7.config.ts
```

Do not use `migrate reset` or `migrate dev` against production databases. Changing a connection string does not transfer data from another database; plan a separate data migration when needed.

## Project layout

```text
src/
  app.ts                 Hono app, middleware, and route mounting
  server.ts              Bun server entry point
  modules/
    Projects/            Project routes, validation, controllers, and services
    Containers/          Container routes, validation, controllers, and services
  shared/
    db/                  Prisma client and PostgreSQL adapter
    middleware/          Authentication, rate limiting, and error handling
prisma/
  schema.prisma          Database schema
  migrations/            Versioned PostgreSQL migrations
```
