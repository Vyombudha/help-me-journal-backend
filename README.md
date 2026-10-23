# Help Me Journal Backend

TypeScript REST API for Help Me Journal. It uses Express 5, PostgreSQL, Prisma 7, Clerk authentication, Zod request validation, and Helmet/CORS middleware.

## Features

- CRUD operations for projects, containers, and journal entries
- Resource access scoped to the authenticated user's projects
- First-request user synchronization from Clerk into the local database
- Database migrations and generated Prisma client
- Request validation, centralized error responses, and rate limiting

## Requirements

- Node.js version supported by Prisma 7
- npm
- PostgreSQL
- A Clerk application and its backend secret key

## Configuration

Create a `.env` file in the repository root:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"
CLERK_SECRET_KEY="sk_test_..."
CLERK_PUBLISHABLE_KEY="pk_test_..."
PORT=3000
FRONTEND_URL="http://localhost:5173"
```

`DATABASE_URL` and `CLERK_SECRET_KEY` are needed for the database and authenticated API. The publishable key is included for the associated Clerk frontend; the backend code uses Clerk middleware and its server-side client. `PORT` defaults to `3000`. `FRONTEND_URL` is optional; CORS allows it and `http://localhost:5173`.

## Install and Run

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

The Prisma schema is `prisma/schema.prisma`; the generated client is written to `generated/prisma`. `npx prisma migrate dev` applies pending migrations to the configured development database.

Available scripts:

| Command       | Description                               |
| ------------- | ----------------------------------------- |
| `npm run dev` | Run `src/server.ts` with `tsx` watch mode |
| `npm start`   | Run `src/server.ts` once with `tsx`       |

The API listens at `http://localhost:3000` unless `PORT` is set. For a production deployment, build and deploy the service using your hosting environment and apply checked-in migrations with `npx prisma migrate deploy`.

## Health Check

`GET /health` returns `200` with `{ "ok": true }`. It does not require Clerk authentication. It is subject to the global rate limit.

## Authentication and Responses

All `/api/v1` endpoints require an authenticated Clerk request. Send a valid Clerk session token as a bearer token:

```http
Authorization: Bearer <CLERK_SESSION_TOKEN>
```

On the first authenticated request for a Clerk user, the API creates a local user record using the Clerk user ID and first available email address. Requests are then scoped to that user; a user cannot access another user's projects or their child resources.

Successful endpoints return HTTP `200` and use this envelope:

```json
{ "success": true, "data": {} }
```

Delete responses set `data` to `null`. Errors use `{ "success": false, "message": "..." }`. Common error codes include `401` for unauthenticated requests, `404` for missing or inaccessible resources, `409` for duplicate project/container names, and `422` for invalid input.

The global rate limit is 300 requests per IP per 15 minutes. Creating an entry has an additional limit of 20 requests per IP per minute.

## API Reference

All resource routes are prefixed with `/api/v1`. Path IDs must be UUIDs. Request and response bodies use JSON.

### Projects

| Method   | Path                          | Request body                                                                |
| -------- | ----------------------------- | --------------------------------------------------------------------------- |
| `GET`    | `/api/v1/projects`            | None                                                                        |
| `POST`   | `/api/v1/projects`            | `{ "name": "My project", "description": "A personal journal" }`             |
| `GET`    | `/api/v1/projects/:projectId` | None                                                                        |
| `PATCH`  | `/api/v1/projects/:projectId` | `{ "newName": "Renamed project", "newDescription": "Updated description" }` |
| `DELETE` | `/api/v1/projects/:projectId` | None                                                                        |

Project creation requires a trimmed name of 1-30 characters and a description of 1-200 characters. Updates require both `newName` (1-100 characters) and `newDescription` (1-200 characters). Project status is stored in the data model but is not currently editable through the API.

### Containers

| Method   | Path                                     | Request body                                                       |
| -------- | ---------------------------------------- | ------------------------------------------------------------------ |
| `GET`    | `/api/v1/projects/:projectId/containers` | None                                                               |
| `POST`   | `/api/v1/projects/:projectId/containers` | `{ "title": "Daily notes", "type": "JOURNAL", "moods": ["CALM"] }` |
| `GET`    | `/api/v1/containers/:containerId`        | None                                                               |
| `PATCH`  | `/api/v1/containers/:containerId`        | `{ "newTitle": "Updated title", "newMoods": ["HAPPY", "CALM"] }`   |
| `DELETE` | `/api/v1/containers/:containerId`        | None                                                               |

Creation requires a title (1-100 characters), a type, and a mood array. Types are `JOURNAL` and `TECHNICAL_NOTE`. Moods are `HAPPY`, `CALM`, `SAD`, `ANGRY`, `ANXIOUS`, `EXCITED`, `TIRED`, and `NEUTRAL`. Updates require `newTitle`; `newMoods` is optional.

### Entries

| Method   | Path                                      | Request body                                                       |
| -------- | ----------------------------------------- | ------------------------------------------------------------------ |
| `GET`    | `/api/v1/containers/:containerId/entries` | None                                                               |
| `POST`   | `/api/v1/containers/:containerId/entries` | `{ "title": "First note", "content": "Entry content" }`            |
| `GET`    | `/api/v1/entries/:entryId`                | None                                                               |
| `PATCH`  | `/api/v1/entries/:entryId`                | `{ "newTitle": "Updated title", "newContent": "Updated content" }` |
| `DELETE` | `/api/v1/entries/:entryId`                | None                                                               |

Entry creation accepts a title up to 100 characters (including an empty title) and any string content. Entry updates accept either or both of `newTitle` (up to 100 characters) and `newContent`. Entries are listed by ascending `order`; new entries receive the next order value in their container. Entry titles are not required to be unique.

## Data Model

- A user owns projects; project names are unique per owner.
- A project contains containers; container titles are unique per project.
- A container contains entries; entry titles have no uniqueness constraint.
- Projects have `IN_PROGRESS`, `COMPLETED`, or `ABANDONED` status and default to `IN_PROGRESS`.
- Containers have a `JOURNAL` or `TECHNICAL_NOTE` type, a mood list, and an optional JSON `templateConfig` field.
- Entries have a string title and content, plus an integer order indexed with the container ID.
- Deleting a user, project, or container cascades to its dependent records.

## Repository Layout

```text
src/
  app.ts                     # Middleware and route mounting
  server.ts                  # Server bootstrap
  modules/                   # Projects, containers, and entries API modules
  shared/                    # Database, middleware, errors, and Express types
prisma/
  schema.prisma              # Data model and enums
  migrations/                # Database migration history
generated/prisma/            # Generated Prisma client
```

## Current Gaps

There is no automated test suite, OpenAPI specification, CI/CD workflow, or deployment configuration in this repository yet.
