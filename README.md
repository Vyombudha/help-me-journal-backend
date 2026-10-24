# Help Me Journal Backend

A TypeScript REST API for the Help Me Journal app. It exposes authenticated project and container management, uses Clerk for identity, and persists data through Prisma against a libSQL/SQLite-compatible database.

## Overview

This backend is designed for a journaling workflow where each authenticated user owns multiple projects, and each project contains one or more containers. Containers represent journal or note collections and carry metadata such as title, type, and mood tags.

The application uses:

- Express 5 for the API server
- Prisma 7 with a generated client
- SQLite/libSQL via `DATABASE_URL`
- Clerk for authentication and user sync
- Zod for request validation
- Helmet + CORS + rate limiting for API hardening

## Features

- User-scoped project CRUD
- User-scoped container CRUD under a project
- Automatic Clerk user creation on first authenticated request
- Prisma migrations and generated client management
- Request validation and centralized error handling
- Rate limiting + CORS setup

## Requirements

- Node.js 20+ recommended
- npm
- A Clerk project with a secret key and publishable key
- A valid `DATABASE_URL` for a supported SQLite/libSQL database

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

- `DATABASE_URL` should point to your Prisma database file or libSQL connection URL.
- `CLERK_SECRET_KEY` is required for authenticated API requests.
- `CLERK_PUBLISHABLE_KEY` is used by the frontend Clerk integration.
- `FRONTEND_URL` is optional but helps enable expected CORS access for local frontend development.
- `PORT` defaults to `3000` when not set.

## Installation

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

Available scripts:

| Command | Description |
| --- | --- |
| `npm run dev` | Runs the server in watch mode via `tsx` |
| `npm start` | Runs the server once via `tsx` |

The API runs locally at `http://localhost:3000` unless you override `PORT`.

## Database and Prisma

The Prisma schema lives in `prisma/schema.prisma` and the generated client is output into `generated/prisma`.

Typical local flow:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

For deployment or non-local environments, apply migrations with:

```bash
npx prisma migrate deploy
```

## Authentication and Authorization

All `/api/v1` routes require a valid Clerk-authenticated request.

Example header:

```http
Authorization: Bearer <clerk_session_token>
```

On the first authenticated request for a Clerk user, the server creates a local `User` row if it does not already exist. User records are keyed by the Clerk user ID, and access is scoped to that user. A user can only read or mutate their own projects and sub-resources.

## Health Check

```http
GET /health
```

Returns:

```json
{ "ok": true }
```

This endpoint does not require authentication and is still protected by the API rate limiter.

## Response Format

Successful responses use:

```json
{ "success": true, "data": {} }
```

Delete operations typically return:

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
- `422` — validation failure

The global rate limit is 300 requests per IP per 15 minutes.

## API Reference

All routes are prefixed with `/api/v1`. UUID values are required for path parameters.

### Projects

| Method | Path | Body |
| --- | --- | --- |
| `GET` | `/api/v1/projects` | None |
| `POST` | `/api/v1/projects` | `{ "name": "My project", "description": "A personal journal" }` |
| `GET` | `/api/v1/projects/:projectId` | None |
| `PATCH` | `/api/v1/projects/:projectId` | `{ "newName": "Updated project", "newDescription": "Updated description" }` |
| `DELETE` | `/api/v1/projects/:projectId` | None |

Validation details:

- `name`: trimmed string, 1-30 characters
- `description`: 1-200 characters
- `newName`: trimmed string, 1-100 characters
- `newDescription`: 1-200 characters

### Containers

| Method | Path | Body |
| --- | --- | --- |
| `GET` | `/api/v1/projects/:projectId/containers` | None |
| `POST` | `/api/v1/projects/:projectId/containers` | `{ "title": "Daily thoughts", "type": "JOURNAL", "moods": ["CALM"] }` |
| `GET` | `/api/v1/containers/:containerId` | None |
| `PATCH` | `/api/v1/containers/:containerId` | `{ "newTitle": "Updated title", "newMoods": ["HAPPY", "CALM"] }` |
| `DELETE` | `/api/v1/containers/:containerId` | None |

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
- `Container` data includes a `content` field, `moods`, and optional `templateConfig` JSON.
- Deleting a user, project, or container cascades dependent records.

## Repository Layout

```text
src/
  app.ts                     # Server bootstrap and middleware setup
  server.ts                 # Express app startup
  modules/
    Projects/               # Project routes, schemas, controller, service
    Containers/             # Container routes, schemas, controller, service
  shared/
    db/                     # Prisma client setup
    middleware/            # Auth, error handling, rate limiting, validation
    errors/                # Custom app errors
    types/                 # Express request augmentation
prisma/
  schema.prisma             # Data model and enums
  migrations/              # Prisma migration history
generated/prisma/          # Generated Prisma client
```

## Current Status

This repository currently includes the backend API and database schema, but it does not yet include an automated test suite, OpenAPI documentation, CI/CD pipeline, or deployment configuration.
