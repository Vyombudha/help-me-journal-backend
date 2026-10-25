# Help Me Journal Backend

A Bun-powered API for organizing journal entries and technical notes into projects. The backend uses Hono for HTTP routing, Clerk for authentication, and Prisma with PostgreSQL for persistence.

## Features

- Clerk-authenticated API with per-user project ownership
- Projects with status and unique names per user
- Journal and technical-note containers within projects
- Mood tags on containers
- Request validation with Zod
- CORS configuration for the frontend
- API rate limiting: 300 requests per 15 minutes
- Health-check endpoint

## Stack

- [Bun](https://bun.sh/) and TypeScript
- [Hono](https://hono.dev/)
- [Clerk](https://clerk.com/)
- [Prisma](https://www.prisma.io/) and PostgreSQL
- Zod

## Prerequisites

- Bun 1.x
- A Clerk application and its API keys

## Setup

1. Install dependencies:

   ```sh
   bun install
   ```

2. Copy `.example.env` to `.env` and configure the values:

   ```env
   DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require
   PORT=3000
   CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   FRONTEND_URL=http://localhost:5173
   ```

   Replace the database URL placeholders with the connection string from your PostgreSQL provider. URL-encode any special characters in the username or password. Bun loads `.env` automatically; the Prisma CLI loads it through the Prisma config. `FRONTEND_URL` is the permitted frontend origin; `http://localhost:5173` is also allowed by default. The API requires Clerk authentication for all routes other than `GET /health`.

3. Generate the Prisma client and apply the committed initial migration:

   ```sh
   bunx prisma generate --config prisma7.config.ts
   bunx prisma migrate deploy --config prisma7.config.ts
   ```

4. Start the server:

   ```sh
   bun run dev
   ```

   The development command watches for changes. To start without watch mode:

   ```sh
   bun run start
   ```

The server uses `PORT` when set; otherwise Bun uses its default port.

## API

All routes except `GET /health` require a valid Clerk session. Send the session token as a bearer token:

```http
Authorization: Bearer <clerk_session_token>
```

Successful resource responses use the shape `{ "success": true, "data": ... }`. Route parameters ending in `Id` must be UUIDs.

### Health

| Method | Path | Description | Auth |
| --- | --- | --- | --- |
| GET | `/health` | Returns `{ "ok": true }` when the service is available | No |

### Projects

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/v1/projects` | List the authenticated user's projects |
| POST | `/api/v1/projects` | Create a project |
| GET | `/api/v1/projects/:projectId` | Get a project |
| PATCH | `/api/v1/projects/:projectId` | Update its name and description |
| DELETE | `/api/v1/projects/:projectId` | Delete a project and its containers |

Create a project with:

```json
{
  "name": "Daily Reflection",
  "description": "A place to collect daily thoughts."
}
```

`name` is trimmed and must be 1-30 characters; `description` must be 1-200 characters. Project names are unique per owner.

Update a project with both fields:

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
| PATCH | `/api/v1/containers/:containerId` | Update its title and optionally moods |
| DELETE | `/api/v1/containers/:containerId` | Delete a container |

Create a container with:

```json
{
  "title": "Morning Journal",
  "type": "JOURNAL",
  "moods": ["HAPPY", "CALM"]
}
```

`title` is trimmed and must be 1-100 characters. `type` must be `JOURNAL` or `TECHNICAL_NOTE`. Mood values are `HAPPY`, `CALM`, `SAD`, `ANGRY`, `ANXIOUS`, `EXCITED`, `TIRED`, and `NEUTRAL`.

Update a container with a required title and optional mood list:

```json
{
  "newTitle": "Evening Journal",
  "newMoods": ["CALM", "TIRED"]
}
```

Container content defaults to an empty string. The current API does not expose a route to update container content.

### Errors

Errors return JSON with `success: false` and a `message`. Common status codes include `401` for unauthenticated requests, `404` for missing resources or routes, `409` for duplicate entries, and `500` for unexpected server errors.

## Data model

- **User:** Clerk user ID, unique email, optional name, timestamps.
- **Project:** UUID, name, description, status (`IN_PROGRESS`, `COMPLETED`, or `ABANDONED`), owner, timestamps.
- **Container:** UUID, title, content, type, optional template configuration, mood list, parent project, timestamps.

Deleting a user or project cascades to its associated projects or containers, respectively.

## Development

Run the TypeScript checker with:

```sh
bunx tsc --noEmit --project tsconfig.json
```

Project configuration is in `tsconfig.json`; Prisma schema and migrations are under `prisma/`.

### Database migrations

The initial PostgreSQL migration is in `prisma/migrations`. For schema changes during development, create and apply a migration with:

```sh
bunx prisma migrate dev --name describe-your-change --config prisma7.config.ts
```

In production, apply committed migrations with `bunx prisma migrate deploy --config prisma7.config.ts`. Changing the database URL to PostgreSQL does not copy records from an existing SQLite or Turso database; migrate existing data separately before switching production traffic.