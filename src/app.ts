import { WorkspacesRouter } from "./modules/Workspaces/index.js";
import { apiLimiter } from "./shared/middleware/index.js";
import { clerkMiddleware } from "@clerk/hono";
import { errorHandler } from "./shared/middleware/errorHandler.middleware.js";
import { requireAuth } from "./shared/middleware/auth.middleware.js";

import { Hono } from "hono";
import type { MiddlewareHandler } from "hono";
import { cors } from "hono/cors";
import type { AppEnv } from "./shared/types/hono.js";
import {
  PagesRouter,
  WorkspacePagesRouter,
} from "./modules/Pages/pages.route.js";
import { env } from "cloudflare:workers";

const FRONTEND_URL = env.FRONTEND_URL;
export const createHonoServer = (
  clerkAuth: MiddlewareHandler<AppEnv> = clerkMiddleware(),
  requireAuthentication: MiddlewareHandler<AppEnv> = requireAuth,
) => {
  const app = new Hono<AppEnv>();

  app.use(
    cors({
      origin: FRONTEND_URL,
      maxAge: 600,
    }),
  );

  app.get("/health", (c) => c.json({ ok: true }));

  app.use(clerkAuth);
  app.use(requireAuthentication);
  app.use(apiLimiter);
  app.route("/api/v1/workspaces", WorkspacesRouter);
  app.route("/api/v1/workspaces/:workspaceId/pages", WorkspacePagesRouter);
  app.route("/api/v1/pages", PagesRouter);
  app.onError(errorHandler);
  app.notFound((c) =>
    c.json(
      {
        success: false,
        message: `Route ${c.req.method} ${c.req.path} not found`,
      },
      404,
    ),
  );

  return app;
};

const app = createHonoServer();

export default app;
