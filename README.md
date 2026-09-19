# My API

A TypeScript REST API for managing projects, containers, and entries. The API uses Express 5, Prisma 7, PostgreSQL, Zod validation, and Clerk authentication.

## Requirements

- Node.js 20 or newer
- PostgreSQL
- A Clerk application for authenticated requests

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file in the project root:

   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"
   CLERK_PUBLISHABLE_KEY="your-clerk-publishable-key"
   CLERK_SECRET_KEY="your-clerk-secret-key"
   PORT=3000
   ```

3. Generate the Prisma client and apply the development migrations:

   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

The Prisma client is generated into `generated/prisma` according to [`prisma/schema.prisma`](prisma/schema.prisma). The database URL is read by [`prisma7.config.ts`](prisma7.config.ts).

## Running the API

Start the development server with watch mode:

```bash
npm run dev
```

The server listens on `http://localhost:3000` by default, or on the port set in `PORT`. To run it without watch mode, use `npm start`.

Successful endpoints return JSON responses in the form `{ "success": true, "data": ... }`. All API routes require a valid Clerk-authenticated request through the global `requireAuth` middleware. Requests must include a JSON body where indicated, and validation errors are returned by the validation middleware.

## Endpoints

Base path: `/api/v1`

### Projects

| Method   | Path                   | Body                                                                        |
| -------- | ---------------------- | --------------------------------------------------------------------------- |
| `GET`    | `/projects`            | None                                                                        |
| `POST`   | `/projects`            | `{ "name": "My project", "description": "A personal journal" }`             |
| `GET`    | `/projects/:projectId` | None                                                                        |
| `PATCH`  | `/projects/:projectId` | `{ "newName": "Renamed project", "newDescription": "Updated description" }` |
| `DELETE` | `/projects/:projectId` | None                                                                        |

### Containers

| Method   | Path                              | Body                                                               |
| -------- | --------------------------------- | ------------------------------------------------------------------ |
| `GET`    | `/projects/:projectId/containers` | None                                                               |
| `POST`   | `/projects/:projectId/containers` | `{ "title": "Daily notes", "type": "JOURNAL", "moods": ["CALM"] }` |
| `GET`    | `/containers/:containerId`        | None                                                               |
| `PATCH`  | `/containers/:containerId`        | `{ "newTitle": "Updated title", "newMoods": ["HAPPY", "CALM"] }`   |
| `DELETE` | `/containers/:containerId`        | None                                                               |

Supported container types are `JOURNAL` and `TECHNICAL_NOTE`. Supported moods are `HAPPY`, `CALM`, `SAD`, `ANGRY`, `ANXIOUS`, `EXCITED`, `TIRED`, and `NEUTRAL`.

### Entries

| Method   | Path                               | Body                                                              |
| -------- | ---------------------------------- | ----------------------------------------------------------------- |
| `GET`    | `/containers/:containerId/entries` | None                                                              |
| `POST`   | `/containers/:containerId/entries` | `{ "title": "First note", "content": "Entry content" }`           |
| `GET`    | `/entries/:entryId`                | None                                                              |
| `PATCH`  | `/entries/:entryId`                | `{ "newTitle": "Updated note", "newContent": "Updated content" }` |
| `DELETE` | `/entries/:entryId`                | None                                                              |

Entry titles must be unique within a container. Entries are stored with an integer ordering field and are indexed by container and order. New entries are assigned the next order value in their container.

## Data Model

- A user can own multiple projects.
- A project can contain multiple containers, with unique container titles per project.
- A container can contain multiple entries, with unique entry titles per container.
- Projects have a status of `IN_PROGRESS`, `COMPLETED`, or `ABANDONED`; new projects default to `IN_PROGRESS`.
- Containers support the `JOURNAL` and `TECHNICAL_NOTE` types, mood tags, and optional JSON template configuration.
- Deleting a project or container cascades to its related records.

## Project Structure

```text
src/
	server.ts                 # Express application and route mounting
	modules/
		Projects/               # Project routes, validation, controllers, services
		Containers/             # Container routes, validation, controllers, services
		Entries/                # Entry routes, validation, controllers, services
	shared/
		db/                     # Prisma database client
		middleware/             # Authentication, validation, async handlers
generated/prisma/           # Generated Prisma client
prisma/
	schema.prisma             # Database schema
	migrations/               # Database migrations
```

## Available Scripts

| Command       | Description                         |
| ------------- | ----------------------------------- |
| `npm run dev` | Start the API with `tsx` watch mode |
| `npm start`   | Start the API once                  |

## Current Status

- Project, container, and entry endpoints are implemented and mounted.
- Automated API tests and broader API documentation are not currently included.
