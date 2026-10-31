# Journaling App Backend

A Hono API for managing journal workspaces and pages. It runs on Cloudflare Workers, stores data in Cloudflare D1 through Drizzle ORM, and uses Clerk for authentication.

## Requirements

- [Bun](https://bun.sh/)
- A Clerk application
- Cloudflare account access for deploying and applying remote database migrations

## Local development

1. Install dependencies:

   ```sh
   bun install
   ```

2. Create a `.dev.vars` file in the project root with your Clerk credentials:

   ```dotenv
   CLERK_SECRET_KEY=your-clerk-secret-key
   CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
   ```

   Keep these values private. The allowed frontend origin is configured as `FRONTEND_URL` in `wrangler.jsonc`; its local default is `http://localhost:5173`.

3. Apply migrations to the local D1 database and start the Worker:

   ```sh
   bun run db:local
   bun run dev
   ```

   Wrangler serves the local API at `http://localhost:8787` by default.

## Database

The Drizzle schema is in `db/schema.ts`; SQL migrations are in `db/migrations/`.

```sh
bun run db:gen      # Generate migrations from schema changes
bun run db:local    # Apply migrations to local D1
bun run db:remote   # Apply migrations to the configured remote D1 database
```

## Deployment

Set `FRONTEND_URL` in `wrangler.jsonc` to the deployed frontend's origin. Configure the Clerk credentials as Worker secrets, then apply remote migrations and deploy:

```sh
bunx wrangler secret put CLERK_SECRET_KEY
bunx wrangler secret put CLERK_PUBLISHABLE_KEY
bun run db:remote
bun run deploy
```

## API

All API routes are under `/api/v1` and require Clerk authentication. Successful API responses use the shape `{ "success": true, "data": ... }`. The health check does not require authentication.

| Method   | Path                                    | Purpose                                                            |
| -------- | --------------------------------------- | ------------------------------------------------------------------ |
| `GET`    | `/health`                               | Check whether the Worker is responding                             |
| `GET`    | `/api/v1/workspaces`                    | List the signed-in user's workspaces (creates a default if needed) |
| `POST`   | `/api/v1/workspaces`                    | Create a workspace                                                 |
| `GET`    | `/api/v1/workspaces/:workspaceId`       | Get a workspace                                                    |
| `PATCH`  | `/api/v1/workspaces/:workspaceId`       | Update a workspace's name and description                          |
| `DELETE` | `/api/v1/workspaces/:workspaceId`       | Delete a workspace and its pages                                   |
| `GET`    | `/api/v1/workspaces/:workspaceId/pages` | List a workspace's pages                                           |
| `POST`   | `/api/v1/workspaces/:workspaceId/pages` | Create a page in a workspace                                       |
| `GET`    | `/api/v1/pages/:pageId`                 | Get a page                                                         |
| `PATCH`  | `/api/v1/pages/:pageId/title`           | Update a page title                                                |
| `PATCH`  | `/api/v1/pages/:pageId/content`         | Update page content                                                |
| `DELETE` | `/api/v1/pages/:pageId`                 | Delete a page                                                      |

Request bodies:

- Create workspace: `{ "name": "Personal", "description": "..." }`
- Update workspace: `{ "newName": "Personal", "newDescription": "..." }`
- Create page: `{ "title": "Today", "moods": ["CALM"] }`
- Update page title: `{ "newTitle": "A new title" }`
- Update page content: `{ "newContent": "Journal entry..." }`

Available mood values are `HAPPY`, `CALM`, `SAD`, `ANGRY`, `ANXIOUS`, `EXCITED`, `TIRED`, and `NEUTRAL`.
