# Help Me Journal Backend

A TypeScript REST API for the Help Me Journal app. It exposes authenticated project and container endpoints, uses Clerk for identity, and stores data in SQLite via Prisma.

## Overview

This backend powers the journaling workflow for authenticated users:

- Each Clerk user can own multiple projects.
- Each project contains multiple containers.
- A container represents a journal entry or note with a title, type, moods, and content.

The application uses:

- Hono for routing and middleware
- Prisma 7 with a generated client
- SQLite / libSQL-compatible storage via `DATABASE_URL`
- Clerk for authentication and user sync
- Zod for request validation
- CORS and rate limiting

## Features

- User-scoped project CRUD
- User-scoped container CRUD under a project
- Automatic local `User` creation on first authenticated request
- Prisma migrations and generated client management
- Validation and centralized error handling
- Rate limiting and CORS configuration

## Requirements

- Bun
- A Clerk project with a secret key and publishable key
- A valid `DATABASE_URL` for SQLite or libSQL

## Environment Setup

Create a `.env` file in the project root:

```env
DATABASE_URL="file:./dev.db"
CLERK_SECRET_KEY="sk_test_..."
CLERK_PUBLISHABLE_KEY="pk_test_..."
PORT=3000
FRONTEND_URL="http://localhost:5173"
```

Notes:

- `DATABASE_URL` should point to the Prisma database file or a supported SQLite/libSQL URL.
- `CLERK_SECRET_KEY` is required for authenticated requests.
- `CLERK_PUBLISHABLE_KEY` is used by the frontend Clerk integration.
- `FRONTEND_URL` is optional but improves local CORS behavior.
- `PORT` defaults to `3000` when not set.

## Installation

```bash
bun install
bunx prisma generate
bunx prisma migrate dev
bun run dev
```

Available scripts:

| Command         | Description                              |
| --------------- | ---------------------------------------- |
| `bun run dev`   | Runs the server in watch mode with `tsx` |
| `bun run start` | Runs the server once with `tsx`          |
| `bun test`      | Runs the tests using Bun's test runner   |

The API runs locally at `http://localhost:3000` unless you override `PORT`.

## Tests

Run the integration tests with:

```bash
bun test
```

The tests exercise the API routes with a mocked Clerk identity provider and a real Prisma database. They cover the main project and container CRUD flows, authentication and ownership checks, representative validation and duplicate-name errors, missing IDs, and project deletion cascading to its containers.

The Bun configuration in `bunfig.toml` automatically loads `src/utils/test.setup.ts` before tests. The preload sets `DATABASE_URL` to `file:./test.db`, removes the existing test database, and applies Prisma migrations before the suite starts. This keeps test data separate from the development database configured in `.env`. The test database is disposable and is recreated when you run `bun test`.

## Database and Prisma

The Prisma schema lives in `prisma/schema.prisma`, and the generated client is output to `generated/prisma`.

Typical local workflow:

```bash
bunx prisma generate
bunx prisma migrate dev
```

For deployment or other environments, apply migrations with:

```bash
bunx prisma migrate deploy
```

## Authentication and Authorization

All routes under `/api/v1` require a valid Clerk-authenticated request.

The app uses `clerkMiddleware()` and a custom `requireAuth` middleware to confirm the user is authenticated and present in the local Prisma `User` table. On first authenticated access, the server creates the local `User` record using the Clerk user ID and email.

## Health Check

```http
GET /health
```

Response:

```json
{ "ok": true }
```

This endpoint does not require authentication. The API authentication and rate-limiting middleware runs after the health route is registered.

## Response Format

Successful responses use:

```json
{ "success": true, "data": {} }
```

Delete operations usually return:

```json
{ "success": true, "data": null }
```

Error responses use:

```json
{ "success": false, "message": "..." }
```

Common status codes:

- `401` — unauthenticated / invalid Clerk session
- `404` — missing or inaccessible resource
- `409` — duplicate project or container name
- `400` — validation failure

The default global rate limit is 300 requests per IP per 15 minutes.

## API Reference

All routes are prefixed with `/api/v1`.

### Projects

| Method   | Path                          | Body                                                                        |
| -------- | ----------------------------- | --------------------------------------------------------------------------- |
| `GET`    | `/api/v1/projects`            | None                                                                        |
| `POST`   | `/api/v1/projects`            | `{ "name": "My project", "description": "A personal journal" }`             |
| `GET`    | `/api/v1/projects/:projectId` | None                                                                        |
| `PATCH`  | `/api/v1/projects/:projectId` | `{ "newName": "Updated project", "newDescription": "Updated description" }` |
| `DELETE` | `/api/v1/projects/:projectId` | None                                                                        |

Validation details:

- `name`: trimmed string, 1-30 characters
- `description`: 1-200 characters
- `newName`: trimmed string, 1-100 characters
- `newDescription`: 1-200 characters

### Containers

| Method   | Path                                     | Body                                                                  |
| -------- | ---------------------------------------- | --------------------------------------------------------------------- |
| `GET`    | `/api/v1/projects/:projectId/containers` | None                                                                  |
| `POST`   | `/api/v1/projects/:projectId/containers` | `{ "title": "Daily thoughts", "type": "JOURNAL", "moods": ["CALM"] }` |
| `GET`    | `/api/v1/containers/:containerId`        | None                                                                  |
| `PATCH`  | `/api/v1/containers/:containerId`        | `{ "newTitle": "Updated title", "newMoods": ["HAPPY", "CALM"] }`      |
| `DELETE` | `/api/v1/containers/:containerId`        | None                                                                  |

Validation details:

- `title`: trimmed string, 1-100 characters
- `type`: `JOURNAL` or `TECHNICAL_NOTE`
- `moods`: array of allowed mood values
- `newMoods` is optional during updates

Allowed mood values:

`HAPPY`, `CALM`, `SAD`, `ANGRY`, `ANXIOUS`, `EXCITED`, `TIRED`, `NEUTRAL`

## Data Model

- A `User` owns many `Project` records.
- A `Project` belongs to exactly one owner and has a unique name per owner.
- A `Project` contains many `Container` records.
- A `Container` has a unique title within its parent project.
- `Project` status values are `IN_PROGRESS`, `COMPLETED`, and `ABANDONED`.
- `Container` type values are `JOURNAL` and `TECHNICAL_NOTE`.
- `Container` records include `content`, `moods`, and optional `templateConfig` JSON.
- Deleting a user, project, or container cascades dependent records.

## Repository Layout

```text
src/
  server.ts                 # Hono app bootstrap and route registration
  modules/
    Projects/               # Project routes, schemas, controller, and service
    Containers/             # Container routes, schemas, controller, and service
  shared/
    db/                     # Prisma client setup
    middleware/             # Auth, rate limiting, and error handling
    errors/                 # Custom app errors
    types/                  # Hono request typings
prisma/
  schema.prisma             # Data model and enums
  migrations/              # Prisma migration history
generated/prisma/          # Generated Prisma client
```

## Current Status

The repository includes the backend API, Prisma schema, and a small Bun integration-test suite for the main API flows. Coverage is intentionally focused on core behavior rather than every validation edge case. The project does not yet include a full deployment setup, formal OpenAPI docs, or a complete CI pipeline.
