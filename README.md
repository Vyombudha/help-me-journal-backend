# Help Me Journal Backend

This repository contains the backend API for the Help Me Journal application. It is a TypeScript service built with Express 5, Prisma 7, PostgreSQL, Clerk authentication, Zod validation, and CORS/helmet hardening.

## Current project status

The backend is in a working MVP state with the core journaling workflows implemented:

- Project CRUD and ownership checks
- Container CRUD scoped to projects
- Entry CRUD scoped to containers
- Clerk-based user sync and request authentication
- Prisma schema and migrations for users, projects, containers, and entries
- Input validation and centralized error handling

What is not included yet:

- Automated test suite
- API contract/Swagger/OpenAPI docs
- CI/CD pipeline or deployment configuration
- More advanced journaling features beyond the current CRUD surface

## Requirements

- Node.js 20+
- PostgreSQL database
- Clerk application configured for authentication
- A frontend URL if you want CORS to allow browser requests from a specific origin

## Environment setup

Create a `.env` file in the project root with values like:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"
CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
PORT=3000
FRONTEND_URL="http://localhost:5173"
```

Notes:

- `DATABASE_URL` is required for Prisma and the app database connection.
- `FRONTEND_URL` is optional; if omitted, the app defaults to `http://localhost:5173`.
- `PORT` is optional and defaults to `3000` when not defined.

## Install and initialize

```bash
npm install
npx prisma generate
npx prisma migrate dev
```

The Prisma client is generated into `generated/prisma`, and the schema lives in `prisma/schema.prisma`.

## Run the API

Development mode with file watching:

```bash
npm run dev
```

Production-style single-run mode:

```bash
npm start
```

The server listens on the configured `PORT` and defaults to `http://localhost:3000`.

## API behavior

- All routes are mounted under `/api/v1`.
- Every request is protected by Clerk authentication via the global `requireAuth` middleware.
- Successful responses follow the shape:

```json
{ "success": true, "data": { ... } }
```

- Validation errors and application errors are forwarded to the global error handler.
- This project uses Prisma relational data with cascade deletion for related project/container records.

## Routes

### Projects

| Method   | Path                          | Body                                                                        |
| -------- | ----------------------------- | --------------------------------------------------------------------------- |
| `GET`    | `/api/v1/projects`            | None                                                                        |
| `POST`   | `/api/v1/projects`            | `{ "name": "My project", "description": "A personal journal" }`             |
| `GET`    | `/api/v1/projects/:projectId` | None                                                                        |
| `PATCH`  | `/api/v1/projects/:projectId` | `{ "newName": "Renamed project", "newDescription": "Updated description" }` |
| `DELETE` | `/api/v1/projects/:projectId` | None                                                                        |

### Containers

| Method   | Path                                     | Body                                                               |
| -------- | ---------------------------------------- | ------------------------------------------------------------------ |
| `GET`    | `/api/v1/projects/:projectId/containers` | None                                                               |
| `POST`   | `/api/v1/projects/:projectId/containers` | `{ "title": "Daily notes", "type": "JOURNAL", "moods": ["CALM"] }` |
| `GET`    | `/api/v1/containers/:containerId`        | None                                                               |
| `PATCH`  | `/api/v1/containers/:containerId`        | `{ "newTitle": "Updated title", "newMoods": ["HAPPY", "CALM"] }`   |
| `DELETE` | `/api/v1/containers/:containerId`        | None                                                               |

Supported container types:

- `JOURNAL`
- `TECHNICAL_NOTE`

Supported moods:

- `HAPPY`
- `CALM`
- `SAD`
- `ANGRY`
- `ANXIOUS`
- `EXCITED`
- `TIRED`
- `NEUTRAL`

### Entries

| Method   | Path                                      | Body                                                               |
| -------- | ----------------------------------------- | ------------------------------------------------------------------ |
| `GET`    | `/api/v1/containers/:containerId/entries` | None                                                               |
| `POST`   | `/api/v1/containers/:containerId/entries` | `{ "title": "First note", "content": "Entry content" }`            |
| `GET`    | `/api/v1/entries/:entryId`                | None                                                               |
| `PATCH`  | `/api/v1/entries/:entryId`                | `{ "newTitle": "Updated title", "newContent": "Updated content" }` |
| `DELETE` | `/api/v1/entries/:entryId`                | None                                                               |

Notes:

- Entry titles are unique within a container.
- Entries keep an integer `order` value and are indexed by `containerId` and `order`.
- New entries are assigned the next available order value within the parent container.

## Data model

- A user can own multiple projects.
- A project can contain multiple containers, and container titles are unique within a project.
- A container can contain multiple entries, and entry titles are unique within a container.
- Projects have a lifecycle status of `IN_PROGRESS`, `COMPLETED`, or `ABANDONED`.
- New projects default to `IN_PROGRESS`.
- `Container.templateConfig` is stored as an optional JSON value.
- Deleting a project or container cascades and removes dependent records.

## Project structure

```text
src/
  app.ts                     # App setup, middleware, and route mounting
  server.ts                  # Server bootstrap
  modules/
    Projects/                # Project controller, schema, service, router
    Containers/              # Container controller, schema, service, router
    Entries/                 # Entry controller, schema, service, router
  shared/
    db/                      # Prisma instance
    middleware/              # Auth, validation, async handling, rate limiting
    errors/                  # App-level error helpers
    types/                   # Express typings
prisma/
  schema.prisma              # Prisma schema and enums
  migrations/                # Prisma migration history
generated/prisma/           # Generated Prisma client output
```

## Available scripts

| Command       | Description                         |
| ------------- | ----------------------------------- |
| `npm run dev` | Start the API with `tsx` watch mode |
| `npm start`   | Start the API once                  |

## Summary

This backend is a functional, auth-protected journaling API with the expected project/container/entry domain model and Prisma-backed persistence. It is suitable for local development and iterative feature work, but it does not yet include test automation or a formal public API specification.
