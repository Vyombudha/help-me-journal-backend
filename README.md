# Help Me Journal Backend

A secure, project-based journaling backend built with Hono, Prisma, SQLite, and Clerk authentication. It powers a journaling workflow where authenticated users can manage projects and create structured journal or technical note containers inside each project.

## Overview

This backend is designed for a personal productivity application where users can:

- create and manage projects
- organize containers within each project
- store journal entries and technical notes
- attach mood tags to entries
- keep project metadata and audit-friendly timestamps
- authenticate via Clerk

The API is intentionally lightweight and stateless at the application layer, with Prisma handling database access and SQLite used for local development.

## Features

- Clerk-authenticated API access
- Project management with ownership enforcement
- Container-based journaling and documentation
- Support for two container types:
  - `JOURNAL`
  - `TECHNICAL_NOTE`
- Mood tagging per container using enum-based values
- Prisma schema with relational data modeling
- Built-in health endpoint and centralized error handling
- Rate limiting and CORS support

## Tech Stack

- Bun + TypeScript
- Hono for HTTP routing and middleware
- Prisma ORM
- SQLite database
- Clerk for authentication
- Zod for request validation
- tsx for local development

## Project Structure

```text
help-me-journal-backend/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── modules/
│   │   ├── Projects/
│   │   └── Containers/
│   ├── shared/
│   │   ├── db/
│   │   ├── middleware/
│   │   ├── errors/
│   │   └── types/
│   └── utils/
├── .example.env
├── package.json
├── bun.lock
├── README.md
└── tsconfig.json
```

## Authentication

The API uses Clerk middleware and enforces authentication globally after the health check route.

On first authenticated request:

- the user ID from Clerk is read
- a matching user record is looked up in Prisma
- if it does not exist, the user is automatically created from Clerk data

This ensures each project is tied to the authenticated user.

## Environment Variables

Copy `.example.env` to a real `.env` file and populate the values:

```env
DATABASE_URL="file:./dev.db"
PORT=3000
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
FRONTEND_URL=http://localhost:5173
```

### Variable descriptions

- `DATABASE_URL`: Prisma SQLite database path
- `PORT`: backend port for the app
- `CLERK_PUBLISHABLE_KEY`: public key used by Clerk frontend integrations
- `CLERK_SECRET_KEY`: secret key used by the backend to validate sessions
- `FRONTEND_URL`: allowed frontend origin for CORS

## Getting Started

### Prerequisites

- Bun 1.x+
- a Clerk project with valid keys

### Install dependencies

```bash
bun install
```

### Generate Prisma client

```bash
bunx prisma generate
```

### Set up the database

```bash
bunx prisma db push
```

This creates the SQLite database and applies the schema from `prisma/schema.prisma`.

### Run the app in development mode

```bash
bun run dev
```

### Production-like start

```bash
bun run start
```

The app listens on the `PORT` environment variable and exposes the API at the root.

## API Overview

### Health

```http
GET /health
```

Returns status for the backend service.

### Project routes

Base path: `/api/v1/projects`

| Method | Route | Description |
| --- | --- | --- |
| GET | `/api/v1/projects` | List all projects for the authenticated user |
| POST | `/api/v1/projects` | Create a new project |
| GET | `/api/v1/projects/:projectId` | Get a specific project |
| PATCH | `/api/v1/projects/:projectId` | Update project name and description |
| DELETE | `/api/v1/projects/:projectId` | Delete a project |

Example create project request:

```bash
curl -X POST http://localhost:3000/api/v1/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <clerk_token>" \
  -d '{
    "name": "Daily Reflection",
    "description": "A place to track my thoughts and wins."
  }'
```

### Container routes

Base path: `/api/v1/projects/:projectId/containers`

| Method | Route | Description |
| --- | --- | --- |
| GET | `/api/v1/projects/:projectId/containers` | List all containers inside a project |
| POST | `/api/v1/projects/:projectId/containers` | Create a new container in a project |

Container-specific route:

| Method | Route | Description |
| --- | --- | --- |
| GET | `/api/v1/containers/:containerId` | Fetch a single container |
| PATCH | `/api/v1/containers/:containerId` | Update title and mood tags |
| DELETE | `/api/v1/containers/:containerId` | Delete a container |

Example create container request:

```bash
curl -X POST http://localhost:3000/api/v1/projects/<projectId>/containers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <clerk_token>" \
  -d '{
    "title": "Morning Journal",
    "type": "JOURNAL",
    "moods": ["HAPPY", "CALM"]
  }'
```

## Data Model

### User

- `id`: Clerk user ID
- `email`: unique email
- `name`: optional name
- `createdAt`, `updatedAt`

### Project

- `id`: UUID
- `name`
- `description`
- `status`: `IN_PROGRESS`, `COMPLETED`, or `ABANDONED`
- `ownerId`
- `createdAt`, `updatedAt`

### Container

- `id`: UUID
- `title`
- `projectId`
- `content`: default empty string
- `type`: `JOURNAL` or `TECHNICAL_NOTE`
- `moods`: JSON array of mood values
- `templateConfig`: optional JSON payload
- `createdAt`, `updatedAt`

## Validation and Error Handling

The application uses Zod schemas to validate incoming request bodies and route params. Common validation errors return structured API responses with a 4xx status.

The app also centralizes general error handling through `errorHandler.middleware.ts`, and invalid routes return a 404 JSON response.

## Notes

- The project is optimized for local development with SQLite.
- For production deployments, you will likely want to switch the database provider and strengthen deployment/security configuration.
- Clerk auth must be configured correctly on both the frontend and backend for the API to function.

## Useful Commands

```bash
bun install
bun run dev
bunx prisma generate
bunx prisma db push
bunx prisma studio
```

## License

This project is currently unlicensed unless you add an explicit license file or update the package metadata.
